# Cold Storage MVP: System Architecture & Technical Decisions

---

## PART 1: SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐      ┌──────────────────────┐         │
│  │   React Web App      │      │  React Native Mobile │         │
│  │  (Browser)           │      │  (iOS/Android)       │         │
│  │  - Inventory         │      │  - Delivery Form     │         │
│  │  - Dashboard         │      │  - Offline Support   │         │
│  │  - Settings (Admin)  │      │  - Local Cache       │         │
│  │  - Payments          │      │  - Photo Proof       │         │
│  └──────────────────────┘      └──────────────────────┘         │
│                 ↓                         ↓                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (REST)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Node.js / Express / Hono                                       │
│  ┌────────────────────────────────────────────────────┐         │
│  │ Routes:                                            │         │
│  │ • POST   /api/lots                                 │         │
│  │ • GET    /api/lots                                 │         │
│  │ • GET    /api/lots/:id                             │         │
│  │ • POST   /api/lots/:id/delivery                    │         │
│  │ • POST   /api/lots/:id/delivery/override           │         │
│  │ • POST   /api/lots/:id/written-off                 │         │
│  │ • POST   /api/lots/:id/disputed                    │         │
│  │ • GET    /api/customers/:id/outstanding           │         │
│  │ • POST   /api/customers/:id/receipts               │         │
│  │ • GET    /api/warehouse-settings/:id               │         │
│  │ • POST   /api/warehouse-settings/:id               │         │
│  │ • GET    /api/dashboard/home                       │         │
│  │ • GET    /api/dashboard/inventory                  │         │
│  │ • POST   /api/jobs/daily-stale-check (internal)    │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                   │
│  Middleware:                                                      │
│  • Auth (JWT from Supabase)                                      │
│  • RLS enforcement (row-level security)                          │
│  • Error handling                                                │
│  • Request logging                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Authentication:                                                 │
│  • Supabase Auth (Phone OTP)                                     │
│  • JWT token issuance & verification                             │
│                                                                   │
│  PostgreSQL Database:                                            │
│  ┌─────────────────────────────────────────────────┐             │
│  │ Tables:                                         │             │
│  │ • warehouses                                    │             │
│  │ • customers                                     │             │
│  │ • products                                      │             │
│  │ • lots (status, balanceBags, lodgementDate)     │             │
│  │ • rent_accruals (isPaid, paidDate)              │             │
│  │ • transaction_charges (isPaid, paidDate)        │             │
│  │ • deliveries (with blocking info)               │             │
│  │ • customer_receipts                             │             │
│  │ • receipt_allocations (FIFO)                     │             │
│  │ • users (role-based)                            │             │
│  │ • warehouse_settings (config)                    │             │
│  │ • audit_log (compliance)                         │             │
│  │ • lot_status_history (traceability)              │             │
│  └─────────────────────────────────────────────────┘             │
│                                                                   │
│  Row-Level Security (RLS):                                       │
│  • Users see only their warehouse data                           │
│  • OPS_MANAGER sees only ACTIVE/STALE lots                       │
│  • ADMIN/OWNER see all lots                                      │
│                                                                   │
│  Realtime (Supabase):                                            │
│  • Subscribe to lot status changes                               │
│  • Live delivery updates                                         │
│  • Real-time outstanding balance updates                         │
│                                                                   │
│  Edge Functions (Cron):                                          │
│  • Daily stale check job (00:00 UTC)                             │
│  • Runs: Calculate daysOld vs staleDaysLimit                     │
│  • Updates lot status to STALE if needed                         │
│  • Logs to lot_status_history                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES (Optional)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  • Sentry (Error tracking)                                       │
│  • Datadog/CloudWatch (Monitoring & metrics)                     │
│  • Whatsapp Business (Whatsapp notifications)                    │
│  • Supabase Storage (Invoice/document storage)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────-┘
```

---

## PART 2: DATA FLOW DIAGRAMS

### Flow 1: Recording a Delivery (with Blocking)

```
OpManager initiates delivery:
  1. POST /api/lots/:id/delivery { numBagsOut, notes }
  2. Backend calculates: isFinal = (balanceBags - numBagsOut) === 0
  3. If isFinal:
       → Query lot.outstanding (sum unpaid rent + charges)
       → If outstanding > 0:
            Return 409 Conflict { error, outstanding, canOverride }
            STOP
       → Else:
            Proceed to step 4
  4. If not isFinal:
       → If outstanding > 0:
            Return 200 { warning, canProceed: true }
            (Allow ops manager to proceed despite warning)
       → Else:
            Proceed to step 4
  5. Create Delivery record:
     • deliveryID = new UUID
     • numBagsOut = input
     • status = 'COMPLETED'
  6. Update Lot:
     • balanceBags -= numBagsOut
     • If balanceBags === 0: status = 'DELIVERED'
  7. Create TransactionCharges (if applicable):
     • Hamali, Platform, KataCoolie, Mamulle
     • isPaid = false
  8. Return 200 { success, deliveryID, balanceBagsAfter }

If blocked (409), Owner overrides:
  1. POST /api/lots/:id/delivery/override { overrideReason }
  2. Validate: user.role === 'OWNER' (403 if not)
  3. Validate: overrideReason is not empty
  4. Create same Delivery record (as step 5-8 above)
  5. Log to audit_log:
     • action = 'DELIVERY_OVERRIDE'
     • oldValues = null
     • newValues = { deliveryID, overrideReason }
     • reason = overrideReason
  6. Notify all ADMIN users (in-app notification or email)
  7. Return 200 { success, deliveryID }
```

### Flow 2: Daily Stale Check Job

```
Cron job runs at 00:00 UTC (5:30 AM IST):
  1. Trigger: POST /api/jobs/daily-stale-check
  2. For each warehouse (or filtered):
  3.   For each lot WHERE status IN ('ACTIVE', 'STALE'):
  4.     Calculate:
         • daysOld = TODAY - lot.lodgementDate
         • staleDaysLimit = product.staleDaysLimit OR warehouse_settings.BLANKET_STALE_DAYS
  5.     If daysOld > staleDaysLimit AND lot.status !== 'STALE':
         • Update lot: status = 'STALE'
         • Insert lot_status_history:
           - oldStatus = lot.status (was ACTIVE or something)
           - newStatus = 'STALE'
           - reason = "Auto: exceeded staleDaysLimit (X days)"
           - changedBy = null (system job)
  6.     If daysOld <= staleDaysLimit AND lot.status === 'STALE':
         • (Optional) Leave as STALE (don't auto-revert)
         • OR (Better) Consider reverting if product limit increased
  7.   Log summary: { lotsMarkedStale: count, timestamp }
  8. Return 200 { success, lotsMarkedStale }

Job must be idempotent:
  • Running twice same day should not create duplicate logs
  • Check: IF lot.status !== 'STALE' before updating
```

### Flow 3: Payment Allocation (FIFO)

```
Customer sends payment:
  1. POST /api/customers/:id/receipts { receiptDate, totalAmount, paymentMethod }
  2. Backend queries unpaid items for customer:
     • unpaidRents = SELECT * FROM rent_accruals WHERE customerID's lots AND isPaid=false ORDER BY accrualDate ASC
     • unpaidCharges = SELECT * FROM transaction_charges WHERE customerID's lots AND isPaid=false ORDER BY createdAt ASC
  3. Merge & sort by date (FIFO): [rent1, charge1, rent2, charge2, ...]
  4. Create CustomerReceipt:
     • receiptID = new UUID
     • totalAmount = input
  5. Allocate receipt iteratively:
     remaining = totalAmount
     FOR EACH item IN [rent1, charge1, ...]:
       allocate = MIN(item.amount, remaining)
       CREATE ReceiptAllocation { receiptID, itemID, amount: allocate }
       IF item.type === 'rent':
         UPDATE rent_accruals SET isPaid=true, paidDate=TODAY WHERE id=itemID
       ELSE:
         UPDATE transaction_charges SET isPaid=true, paidDate=TODAY WHERE id=itemID
       remaining -= allocate
       IF remaining === 0: BREAK
  6. If remaining > 0:
     • Store unallocated receipt (partial payment to follow-ups)
  7. Check lot status transition:
     • For each lot in allocation:
       IF lot.balanceBags === 0 AND lot.outstanding === 0:
         UPDATE lot SET status = 'CLEARED'
  8. Return 200 { receiptID, allocations: [...] }
```

---

## PART 3: TECHNICAL DECISIONS & TRADEOFFS

### Decision 1: Supabase vs Custom Backend + Database

**Decision**: Use Supabase (PostgreSQL + Auth + Realtime)

**Rationale**:
- ✅ Authentication (Phone OTP) built-in
- ✅ Row-Level Security (RLS) enforces access control at DB level
- ✅ Realtime subscriptions for live updates
- ✅ Edge Functions for scheduled jobs
- ✅ Managed PostgreSQL (no ops overhead)
- ⚠️ Vendor lock-in (Supabase is open-source, but still proprietary)

**Alternative Considered**:
- Custom Node + PostgreSQL: More control, higher ops burden
- Firebase: Better for real-time, but weaker SQL

**Mitigation**:
- Database layer abstraction (could migrate to self-hosted Postgres later)
- Regular backups to S3

---

### Decision 2: STALE as Status vs Warning Flag

**Decision**: STALE is a status enum, not a separate flag

**Rationale**:
- ✅ Clear state machine (ACTIVE → STALE → DELIVERED)
- ✅ Automatic triggers (daily job)
- ✅ Prevents confusion (lot can't be both ACTIVE and STALE)
- ⚠️ Temptation to confuse with "stop accruing rent" (it doesn't)

**Important Clarification**:
- STALE status = "lot is old, spoilage risk high"
- Rent continues accruing in STALE (bags still occupy shelf)
- STALE only stops when status → DELIVERED (bags removed)

**Audit Trail**:
- lot_status_history tracks all transitions
- Includes reason: "Auto: exceeded 180 days"

---

### Decision 3: Final Delivery Blocking (Stock as Leverage)

**Decision**: Hard block final delivery if customer outstanding > 0

**Rationale**:
- ✅ Enforces collections (stock is leverage)
- ✅ Prevents customer from leaving with stock unpaid
- ✅ Clear business rule
- ⚠️ Legal risk (undue lien claim)
- ⚠️ User friction (customers may dispute)

**Mitigations**:
- Owner override with mandatory reason + audit trail
- 7-day audit flag (override without payment)
- Clear T&C: "Final delivery withheld if outstanding"
- Future: 60-day max hold policy (v1.1)

**Alternative Considered**:
- Soft warning (allow anyway): Less leverage, less effective
- Hard block with NO override: Too rigid, doesn't account for OTC payment

---

### Decision 4: Accrual Stops on DELIVERED (Not ACTIVE → CLEARED)

**Decision**: Accrual stops when `status = DELIVERED`, not when fully cleared

**Rationale**:
- ✅ Logical: No bags in warehouse → no rent accrues
- ✅ Accurate: "Storage rent" only applies while stock is stored
- ✅ Clear: DELIVERED = physically out, stop charging

**Alternative Considered**:
- Stop accrual only when status = CLEARED: Confusing (why charge after delivery?)
- Continue accrual until paid in full: Charges accumulate forever

---

### Decision 5: Payment Allocation FIFO (Oldest First)

**Decision**: Auto-allocate to oldest unpaid rent/charges first

**Rationale**:
- ✅ Standard accounting (FIFO)
- ✅ Transparent to customer
- ✅ Reduces outstanding balance most efficiently
- ⚠️ Customer might want specific allocation (e.g., pay one lot only)

**Mitigation**:
- Manual reallocation available to ADMIN/OWNER
- UI shows proposed allocations before confirm

---

### Decision 6: Role-Based Views (OPS_MANAGER sees only ACTIVE/STALE)

**Decision**: OPS_MANAGER cannot see DELIVERED/CLEARED/WRITTEN_OFF lots

**Rationale**:
- ✅ Reduces cognitive load (focus on actionable lots)
- ✅ Prevents accidental actions on closed lots
- ⚠️ OPS_MANAGER loses visibility into closed history

**Mitigation**:
- ADMIN/OWNER can see full lot history
- Audit log available to authorized users
- OPS_MANAGER can request ADMIN to show history if needed

**Enforcement**:
- RLS policy: `WHERE status IN ('ACTIVE', 'STALE')` for OPS_MANAGER
- Frontend also hides (defense in depth)

---

### Decision 7: Stale Check as Daily Job (not real-time)

**Decision**: Run stale status update as daily cron at 00:00 UTC

**Rationale**:
- ✅ Simple, predictable
- ✅ No race conditions
- ✅ Idempotent (safe to re-run)
- ✅ Low database load
- ⚠️ Slight delay (lot marked STALE next day, not same day)

**Alternatives Considered**:
- Real-time trigger (on every query): Too expensive, race conditions
- Manual batch job: Requires operator action
- Hourly cron: Overkill for v1

---

### Decision 8: Warehouse Settings as Configurable

**Decision**: Each warehouse has own BLANKET_STALE_DAYS, FOLLOW_UP_OUTSTANDING_DAYS, etc.

**Rationale**:
- ✅ Flexibility (different commodities, climates)
- ✅ Different ops workflows per warehouse
- ⚠️ Adds config management burden

**Mitigation**:
- Sensible defaults (180 days blanket, 30 days follow-up)
- ADMIN only access
- Documented in settings UI

---

### Decision 9: Delivery Blocking Override Requires OWNER Role

**Decision**: Only OWNER can override final delivery block

**Rationale**:
- ✅ Prevents OPS_MANAGER from circumventing collections
- ✅ Escalates to decision-maker
- ✅ Audit trail (OWNER's decision, not ops)
- ⚠️ OPS_Manager friction if OWNER unavailable

**Mitigation**:
- OWNER can delegate (v1.1 feature)
- Clear notification to admins when override happens
- 7-day audit flag catches abuse

---

### Decision 10: Separate ReceiptAllocations Table

**Decision**: Track how each receipt is allocated to rents/charges

**Rationale**:
- ✅ Audit trail (which charges paid by which receipt)
- ✅ Handle partial payments
- ✅ Detect orphaned/unallocated amounts
- ⚠️ Extra joins in queries

**Implementation**:
- receiptAllocations.rentAccrualID OR chargeID (mutually exclusive)
- Sum(receiptAllocations.amount) = receipt.totalAmount

---

## PART 4: FAILURE MODE ANALYSIS

### Failure: Stale Job Doesn't Run

**Symptom**: Lots not marked STALE past deadline

**Detection**:
- Dashboard: "Last stale check: 2 days ago"
- Alert: If job doesn't run for 2 consecutive days

**Recovery**:
- Manual trigger: POST /api/jobs/daily-stale-check { warehouseID }
- Check Supabase logs for Edge Function errors
- Escalate to platform team if Supabase is down

---

### Failure: Delivery Blocking Logic Bypassed

**Symptom**: Final delivery allowed despite outstanding

**Detection**:
- Audit log: Check if blocked delivery marked DELIVERED
- Outstanding > 0 AND balanceBags = 0 (impossible state)

**Recovery**:
- Revert lot status to ACTIVE (manual SQL)
- Log to audit_log: action = 'EMERGENCY_UNLOCK', reason = 'Blocking bypass detected'
- Investigate why 409 not returned (API bug?)

---

### Failure: Payment Allocation Goes Negative

**Symptom**: Customer credited with negative outstanding (owed money back)

**Detection**:
- Query: SELECT customer, SUM(outstanding) < 0
- Audit: Check if over-payment not handled

**Prevention**:
- Transaction validation: remaining >= 0 during allocation
- Constraint: outstanding <= 0 is invalid (should be NULL or 0)

---

### Failure: Duplicate Lot Status Transitions

**Symptom**: lot_status_history has multiple same-day STALE entries

**Detection**:
- Query: SELECT lotID, newStatus, createdAt FROM lot_status_history WHERE newStatus='STALE' GROUP BY lotID, DATE(createdAt) HAVING COUNT(*) > 1

**Prevention**:
- Idempotent check: IF lot.status != STALE before updating
- Already implemented in daily stale check

---

## PART 5: SCALABILITY & PERFORMANCE

### Expected Load (Year 1)

- **Warehouses**: 5-10
- **Customers per warehouse**: 50-100
- **Lots per warehouse**: 200-500
- **Deliveries per day**: 50-100
- **Concurrent users**: 10-20 per warehouse

### Performance Targets

- API response time (p95): < 200ms
- Database query time: < 100ms
- Outstanding calculation: < 50ms
- Daily stale check: < 500ms

### Indexing Strategy

```sql
-- Critical indexes (query performance)
CREATE INDEX idx_lots_warehouseID_status ON lots(warehouseID, status);
CREATE INDEX idx_lots_lodgementDate ON lots(lodgementDate);
CREATE INDEX idx_rent_accruals_lotID_isPaid ON rent_accruals(lotID, isPaid);
CREATE INDEX idx_transaction_charges_lotID_isPaid ON transaction_charges(lotID, isPaid);

-- Audit trail
CREATE INDEX idx_audit_log_warehouseID_createdAt ON audit_log(warehouseID, createdAt DESC);
```

### Caching Considerations (v1.1)

- Warehouse settings: Cache for 1 hour (invalidate on update)
- Customer outstanding: Cache for 5 min (hit frequently)
- Lot list: No caching (changes frequently with deliveries)

---

## PART 6: SECURITY MATRIX

| Threat | Mitigation |
|--------|-----------|
| Unauthorized lot access | RLS: WHERE warehouseID = user.warehouseID |
| OPS_MANAGER views WRITTEN_OFF | RLS: WHERE status IN ('ACTIVE', 'STALE') |
| Circumvent delivery block | Backend validates role before override |
| Manipulate outstanding amount | Audit log + immutable history |
| Fake receipts | Audit log captures who recorded payment |
| SQL injection | Supabase prepared statements + Drizzle ORM |
| Replay attack | JWT expires in 24 hours, phone OTP one-time |
| Data breach | Supabase encryption at rest + HTTPS in transit |

---

## PART 7: DEPLOYMENT TOPOLOGY

```
┌─────────────────────────────────────────────────┐
│           Production Deployment                  │
├─────────────────────────────────────────────────┤
│                                                   │
│  Clients (Web, Mobile)                          │
│    ↓ HTTPS                                       │
│  CDN (Vercel / Cloudflare)                      │
│    ↓                                             │
│  API Server (Node.js, 2 instances)              │
│    • Load balancer (AWS ALB / Nginx)            │
│    • Auto-scale based on CPU/Memory             │
│    ↓                                             │
│  Supabase (Managed PostgreSQL)                  │
│    • Connection pooling (via Supabase Postgres) │
│    • Read replicas (if >100 concurrent)         │
│    • Automated backups (daily)                  │
│    ↓                                             │
│  Monitoring (Sentry, Datadog)                   │
│  Backups (S3)                                   │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## PART 8: Future Architecture (v1.1+)

### Features Requiring Architecture Changes

**Photo Proof for Deliveries**:
- Add deliveries.photoURL (Supabase Storage)
- Mobile camera integration
- Signature capture (e.g., Signature Pad library)

**Real-Time Notifications**:
- Supabase Realtime subscriptions (already infra ready)
- Delivery events → Realtime broadcast
- Collections follow-up alerts (Twilio SMS)

**Bulk Lot Import**:
- CSV upload → S3 bucket
- Background job: Parse CSV, validate, create lots
- Async status endpoint: Check import progress

**Custom Rent Adjustment**:
- POST /api/lots/:id/rent-adjustment { amount, reason }
- Owner-only action
- Log to audit_log
- Recalculate outstanding

**Multi-Warehouse Admin Dashboard**:
- Query all warehouses
- Aggregate metrics
- Compare performance across sites

---

## VERSION HISTORY & ARCHITECTURE EVOLUTION

| Version | Architecture | Key Changes |
|---------|--------------|------------|
| 1.0 MVP | Supabase + REST API | Lot mgmt, delivery blocking, payments, stale detection |
| 1.1 | + Storage, Realtime | Photo proof, SMS alerts, bulk import |
| 1.2 | + Redis caching | Performance optimization, real-time sync |
| 2.0 | + GraphQL API | Advanced queries, subscription support |

---

## APPENDIX: Tech Stack Summary

**Backend**:
- Runtime: Node.js (18+)
- Framework: Express or Hono
- ORM: Drizzle or Supabase client
- Testing: Jest, Supertest
- Deployment: Docker + AWS ECS or Vercel Functions

**Frontend (Web)**:
- Framework: React 18+
- State: Zustand + React Query
- UI: Shadcn/ui + Tailwind CSS
- Forms: React Hook Form + Zod
- Deployment: Vercel or Netlify

**Frontend (Mobile)**:
- Framework: React Native 0.71+
- Navigation: React Navigation
- State: Zustand + React Query
- Deployment: EAS Build (Expo) or Xcode/Android Studio

**Database**:
- Supabase (Managed PostgreSQL 14+)
- Auth: Supabase Auth (Phone OTP)
- Realtime: Supabase Realtime

**Monitoring**:
- Error tracking: Sentry
- Metrics: Datadog or CloudWatch
- Logs: Supabase logs + CloudWatch

