# Cold Storage MVP: Implementation Checklist & Deployment Guide

**Timeline**: 12 weeks
**Team**: 1 Backend (Supabase/SQL/Edge), 1 Frontend (React), 1 Mobile (React Native)

---

## PHASE 1: FOUNDATION (Weeks 1-2)

### Week 1: Database & Auth Setup

- [ ] **Setup Supabase Project**
  - Create Supabase project (India region)
  - Configure PostgreSQL
  - Enable Realtime (for live updates)
  - Enable Storage (for invoices/documents later)
  - [ ] Test connection from app + Supabase CLI / dashboard

- [ ] **Implement Auth System**
  - Configure Supabase Phone OTP (no email in domain)
  - On first login: create **`user_profiles`** row (`id` = `auth.users.id`) and **`user_roles`** + **`user_warehouse_assignments`** (seed or admin flow)
  - Test OTP flow: Send → Verify → JWT; **`getUser()`** on clients/Edge
  - [ ] Test login/logout flow locally

- [ ] **Database Schema Migration** (Supabase CLI / `packages/supabase`)
  - Single or staged migrations: enums, **`tenants`**, **`warehouses` (+ tenant_id)**, **`user_profiles`**, **`user_roles`**, **`user_warehouse_assignments`**, then domain tables from [`API_AND_SCHEMA_SPEC.md`](API_AND_SCHEMA_SPEC.md) (snake_case)
  - **`user_role`**: `OWNER`, `MANAGER`, `STAFF` only
  - RLS: `public.current_tenant_id()`, `public.accessible_warehouse_ids()`; **minimal triggers** (prefer joins + column DEFAULTs — see multitenancy rule)
  - [ ] Verify schema in Supabase console
  - [ ] Test constraints (e.g., balanceBags validation)

- [ ] **Seed Test Data**
  - Create 1 tenant, 1 warehouse, profile + role + assignments for test user
  - Create 5 sample customers
  - Create 10 sample products (with staleDaysLimit)
  - Create 20 sample lots (various statuses)
  - [ ] Verify data loads correctly

### Week 2: Supabase client & RLS verification (no Node API)

- [ ] **App ↔ Supabase wiring**
  - Expo + Vite apps: Supabase JS client (anon key + user JWT); env via `expo-constants` / Vite `import.meta.env`
  - [ ] Test authenticated `select` against one RLS-protected table

- [ ] **Auth session usage**
  - Use `getUser()` (or equivalent) after OTP; load **`user_profiles`** + **`user_roles`** for UI (role, tenant)
  - Persist **active `warehouse_id`** in client state (warehouse switcher in avatar menu)
  - [ ] Test: user without assignment sees no warehouse data

- [ ] **Error handling (client)**
  - Map PostgREST / Auth errors to user-visible messages (i18n)
  - [ ] Test forbidden / validation errors from RLS or checks

- [ ] **Query helpers (TS in app or `packages/shared`)**
  - Typed helpers: e.g. `getLotsForWarehouse(warehouseId)` using `.from('lots').select(...)` — RLS enforces access
  - [ ] Test with seed data

---

## PHASE 2: CORE ACCRUAL & STATUS (Weeks 3-4)

### Week 3: Lot management (Supabase / PostgREST — not a separate `/api` server)

- [ ] **List lots** (equivalent to legacy `GET /api/lots`)
  - Fetch lots with filters (status, customer, warehouse) via `.from('lots')` or a view; RLS enforced
  - Calculate: daysOld, daysUntilStale, outstanding, spoilageRiskLevel
  - Pagination support
  - [ ] Test with filters: GET /api/lots?status=ACTIVE&status=STALE
  - [ ] Verify calculations match spec

- [ ] **GET /api/lots/:id**
  - Return full lot + accrual history + delivery history
  - Include status transitions
  - [ ] Test with sample lot ID

- [ ] **POST /api/lots**
  - Create new lot with status=ACTIVE
  - Validate input (bags > 0, dates, amounts)
  - Trigger first monthly rent accrual (if applicable)
  - [ ] Test: Create lot → Verify status=ACTIVE

- [ ] **Calculate Functions (Utilities)**
  - `calculateDaysOld(lodgementDate)`
  - `calculateDaysUntilStale(lodgementDate, staleDaysLimit, blanketDefault)`
  - `calculateOutstanding(lotID)`
  - [ ] Unit test each function

### Week 4: Status Transitions & Stale Job

- [ ] **POST /api/lots/:id/written-off**
  - Validate user is OWNER (403 if not)
  - Set status=WRITTEN_OFF, chargesFrozen=true
  - Log to lot_status_history + audit_log
  - [ ] Test: Owner marks lot written-off → Verify status + log

- [ ] **POST /api/lots/:id/disputed**
  - Validate user is OWNER (403 if not)
  - Set status=DISPUTED
  - Log to lot_status_history + audit_log
  - [ ] Test: Owner marks lot disputed → Continue accruing rent

- [ ] **Daily Stale Check Job (Supabase Edge Function)**
  - Query all ACTIVE/STALE lots
  - For each lot: Calculate daysOld, compare to staleDaysLimit
  - If daysOld > staleDaysLimit AND status != STALE → Update to STALE
  - Log transitions to lot_status_history
  - Make idempotent (don't re-update)
  - [ ] Deploy as Supabase Cron job (00:00 UTC)
  - [ ] Test: Create lot → Wait 1 day (manually trigger) → Verify status=STALE

- [ ] **Accrual Stop Logic**
  - When fetching outstanding, exclude DELIVERED/CLEARED lots
  - Query: `WHERE status NOT IN ('DELIVERED', 'CLEARED', 'WRITTEN_OFF')`
  - [ ] Test: Mark lot DELIVERED → Outstanding stops accruing

---

## PHASE 3: DELIVERY VALIDATION (Weeks 5-6)

### Week 5: Delivery Blocking & Override

- [ ] **POST /api/lots/:id/delivery (with blocking)**
  - Check if `balanceBags - numBagsOut = 0` (final delivery?)
  - If final AND `customer.outstanding > 0`:
    - Return 409: FINAL_DELIVERY_BLOCKED
    - Include outstanding amount
  - If normal (not final) AND `customer.outstanding > 0`:
    - Return 200 + warning
  - If OK, record delivery, update balanceBags
  - If balanceBags = 0, set status=DELIVERED
  - [ ] Test Case A: Normal delivery with outstanding → 200 + warning
  - [ ] Test Case B: Final delivery with outstanding → 409 blocked
  - [ ] Test Case C: Final delivery, no outstanding → 200 success

- [ ] **POST /api/lots/:id/delivery/override**
  - Validate user is OWNER (403 if not)
  - Validate overrideReason is not empty
  - Create delivery record
  - Log to audit_log: action="DELIVERY_OVERRIDE", reason=overrideReason
  - Notify all ADMIN users (email or in-app notification)
  - [ ] Test: OWNER overrides blocked delivery → Verify delivery created + audit logged

- [ ] **7-Day Audit Alert (Optional for v1)**
  - Track deliveries overridden without subsequent payment
  - Flag if no payment received within 7 days
  - Alert to admins
  - [ ] Implement or defer to v1.1

### Week 6: Frontend Delivery Modal

- [ ] **React: DeliveryModal Component**
  - Input: number of bags, notes
  - Call API → handle 200 (warning) / 409 (blocked) / 200 (success)
  - Case A (warning): Show "⚠️ Customer outstanding, confirm?" + allow
  - Case B (blocked): Show "🔴 Cannot deliver - Contact owner" + override form
  - Case C (success): Close modal, show toast
  - [ ] Test: Try normal delivery with outstanding
  - [ ] Test: Try final delivery with outstanding (blocked, then override as owner)

---

## PHASE 4: PAYMENTS & COLLECTIONS (Weeks 7-8)

### Week 7: Payment Allocation

- [ ] **GET /api/customers/:id/outstanding**
  - Calculate totalOutstanding (unpaid rents + charges)
  - Calculate daysOutstanding (from lot lodgementDate)
  - Return unpaid rents + unpaid charges
  - [ ] Test: Create payment → Query outstanding → Verify decreases

- [ ] **POST /api/customers/:id/receipts**
  - Create CustomerReceipt record
  - Auto-allocate to oldest unpaid items (FIFO)
  - Mark corresponding RentAccruals / TransactionCharges as isPaid=true
  - Create ReceiptAllocations records
  - [ ] Test: Create receipt → Verify allocations FIFO order

- [ ] **Rent Accrual Logic**
  - Monthly rent: First accrual on lodgementDate + 1 day, then monthly
  - Yearly rent: First accrual on lodgementDate + 1 month, then yearly on cutoff
  - Brought forward: Manual, one-time
  - [ ] Test: Create MONTHLY lot → Verify accrual on day 2 (not day 1)
  - [ ] Test: Create YEARLY lot → Verify accrual on date + 1 month

### Week 8: Manual Reallocation & Collections

- [ ] **POST /api/customers/:id/receipts/:id/reallocate**
  - Validate total = receipt amount
  - Clear old allocations, create new ones
  - Log old + new allocation to audit_log
  - [ ] Test: Create receipt → Reallocate to different charges

- [ ] **GET /api/customers/:id/outstanding (with follow-up flag)**
  - Add: `followUpRequired` = outstanding > 0 AND daysOutstanding > FOLLOW_UP_OUTSTANDING_DAYS
  - [ ] Test: Lot > 30 days → followUpRequired=true

- [ ] **React: Payment Form**
  - Input: Receipt date, amount, payment method, reference
  - Auto-show allocations (FIFO) before submit
  - Confirm button
  - [ ] Test: Create receipt → Verify allocations displayed

---

## PHASE 5: ADMIN & SETTINGS (Week 9)

### Week 9: Settings & Role-Based Views

- [ ] **GET /api/warehouse-settings/:warehouseID**
  - Return BLANKET_STALE_DAYS, FOLLOW_UP_OUTSTANDING_DAYS, etc.
  - Validate user is ADMIN (403 if not)
  - [ ] Test: ADMIN can view settings, OPS_MANAGER gets 403

- [ ] **POST /api/warehouse-settings/:warehouseID**
  - Validate user is ADMIN (403 if not)
  - Update settings values
  - Log to audit_log
  - [ ] Test: ADMIN updates settings, others get 403

- [ ] **Role-Based API Filtering**
  - OPS_MANAGER: GET /api/lots returns only ACTIVE + STALE
  - ADMIN/OWNER: GET /api/lots returns all statuses
  - Enforce in query WHERE clause
  - [ ] Test: OPS_MANAGER sees only ACTIVE/STALE, ADMIN sees all

- [ ] **Frontend: Settings Panel (ADMIN only)**
  - Fetch settings
  - Form inputs for each setting
  - Save button → Call API
  - [ ] Test: ADMIN accesses Settings, OPS_MANAGER sees "Unauthorized"

- [ ] **Frontend: Dashboard Home**
  - Summary stats: Active, Stale, Total outstanding
  - Collections follow-up section (daysOutstanding > 30)
  - Recent deliveries list
  - [ ] Test: Display matches API response

- [ ] **Frontend: Role-Based Navigation**
  - OPS_MANAGER: Hide Settings tab, Hide Write-off/Dispute buttons
  - ADMIN/OWNER: Show all tabs, Show all buttons
  - [ ] Test: Switch users, verify UI changes

---

## PHASE 6: TESTING & HARDENING (Weeks 10-11)

### Week 10: E2E & Integration Tests

- [ ] **E2E Scenario 1: Complete Lot Lifecycle (Normal)**
  ```
  1. Create lot (ACTIVE) ✓
  2. Wait 1 day (simulated) → Verify daysOld increases
  3. Record normal delivery (not final) with customer outstanding
  4. Verify warning shown, delivery allowed ✓
  5. Record final delivery (all bags out)
  6. Verify status changes to DELIVERED ✓
  7. Create payment receipt
  8. Verify allocations FIFO ✓
  9. Verify outstanding = 0
  10. Verify status changes to CLEARED ✓
  ```

- [ ] **E2E Scenario 2: Final Delivery Blocked & Override**
  ```
  1. Create lot ✓
  2. Create outstanding rent
  3. Try final delivery with outstanding
  4. Verify 409 Conflict ✓
  5. OWNER calls override with reason ✓
  6. Verify delivery created, audit logged ✓
  7. Verify admin notified ✓
  ```

- [ ] **E2E Scenario 3: Stale Lot**
  ```
  1. Create lot with product staleDaysLimit=180 ✓
  2. Manually trigger daily stale check (or wait in test)
  3. Verify lot still ACTIVE (daysOld < 180) ✓
  4. Simulate 181 days → Trigger stale check
  5. Verify lot status = STALE ✓
  6. Verify UI shows "STALE - 181 days old (limit 180)" ✓
  ```

- [ ] **Load Testing**
  - 1000+ lots in warehouse
  - Query performance: GET /api/lots < 100ms
  - Outstanding calculation < 50ms
  - [ ] Test with Apache JMeter or k6

- [ ] **Unit Tests**
  - calculations.ts: calculateDaysOld, calculateOutstanding, getSpoilageRiskLevel
  - permissions.ts: Role checks
  - [ ] Coverage > 80%

### Week 11: Security & Compliance

- [ ] **RLS Policies Verification**
  - Users can only see their warehouse
  - Users can only perform authorized actions
  - [ ] Test: One user tries to access another warehouse → Denied

- [ ] **Audit Trail Completeness**
  - All status changes logged
  - All overrides logged
  - All settings updates logged
  - [ ] Verify audit_log populated correctly

- [ ] **Data Validation**
  - All numeric inputs have bounds checks
  - All dates validated
  - All role checks enforced
  - [ ] Test with invalid inputs

- [ ] **Error Handling**
  - No sensitive data in error messages
  - All errors logged for debugging
  - [ ] Test: Trigger various errors, verify responses

---

## PHASE 7: DEPLOYMENT (Week 12)

### Pre-Deployment Checklist

- [ ] **Code Review**
  - Backend: All endpoints reviewed
  - Frontend: Component architecture reviewed
  - Database: Schema reviewed for integrity

- [ ] **Environment Configuration**
  - Staging: .env.staging with staging Supabase project
  - Production: .env.production with production Supabase project
  - Verify secrets not committed to repo

- [ ] **Documentation**
  - API docs (Swagger/OpenAPI) generated
  - Setup guide for new developers
  - Runbook for common operations (stale job failure, payment audit)

### Deployment Steps

#### 1. Staging Deployment (Day 1)

- [ ] Deploy / verify **Supabase** staging project
  - Apply migrations; confirm RLS; deploy Edge Functions if any
  - Smoke-test PostgREST + Auth from staging app build (no separate API server)

- [ ] Deploy frontend to staging
  - Build React app
  - Deploy to staging CDN or server
  - Test login flow with staging Supabase
  - Verify all pages load

- [ ] Deploy React Native to TestFlight (iOS) / Internal Testing (Android)
  - Build app bundle
  - Upload to respective platforms
  - Test on physical devices

- [ ] Smoke Tests
  - Create lot → Deliver → Payment → Cleared
  - Verify all calculations correct
  - Check audit log populated

#### 2. Production Deployment (Day 3)

- [ ] Database Migration (Production)
  - Backup production database (Supabase handles this)
  - Run migration scripts
  - Verify schema

- [ ] Deploy Backend
  - Build Docker image
  - Deploy to production
  - Run migrations
  - Monitor logs for errors

- [ ] Deploy Frontend
  - Build React app
  - Deploy to CDN (Vercel, Netlify, etc.)
  - Verify production Supabase configured
  - Test login flow

- [ ] Deploy Mobile
  - Submit to Apple App Store
  - Submit to Google Play Store
  - (These take 24-48 hours for review)
  - Meanwhile, use TestFlight/Internal Testing

- [ ] Post-Deployment Verification
  - Test all critical paths
  - Monitor error rates (should be < 0.1%)
  - Check API response times (p95 < 200ms)

### Production Monitoring (First Week)

- [ ] **Logs & Monitoring**
  - Setup Sentry for error tracking
  - Setup Datadog/CloudWatch for metrics
  - Monitor API error rates + response times
  - Monitor database queries

- [ ] **Alerts**
  - Alert if error rate > 1%
  - Alert if stale job doesn't complete daily
  - Alert if API response time > 500ms

- [ ] **Daily Standups**
  - Review overnight logs
  - Check for user-reported issues
  - Verify stale job ran successfully

---

## PHASE 8: POST-LAUNCH (Ongoing)

### Week 13+: Iteration & Optimization

- [ ] **Collect User Feedback**
  - Ops managers: Is delivery flow intuitive?
  - Owners: Is collections follow-up helpful?
  - Admins: Are settings clear?

- [ ] **Optimize Performance**
  - Profile slow queries
  - Add caching (Redis) if needed
  - Optimize API response times

- [ ] **Feature Requests for v1.1**
  - Photo proof for deliveries
  - SMS notifications for collections
  - Bulk delivery import
  - Custom rent adjustment

---

## DEPLOYMENT CHECKLIST BEFORE GO-LIVE

- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Load tests show acceptable performance
- [ ] Security review completed
- [ ] RLS policies verified
- [ ] Audit trail working
- [ ] Runbooks written (stale job failure, emergency unlock)
- [ ] Support team trained
- [ ] Backup & recovery tested
- [ ] Monitoring & alerts configured
- [ ] Documentation complete
- [ ] Database backups automated
- [ ] Secrets not in code
- [ ] CORS configured correctly
- [ ] Rate limiting in place
- [ ] Production database seeded with test warehouse

---

## CRITICAL OPERATIONS RUNBOOK

### Stale Job Failed (Manual Trigger)

```bash
# SSH into backend server
cd /app

# Manually trigger stale check for specific warehouse
curl -X POST http://localhost:3000/api/jobs/daily-stale-check \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "warehouseID": "wh_123" }'

# If still fails, check logs
grep "stale-check" /var/log/app.log | tail -20

# If database issue, check connection
psql -h $SUPABASE_HOST -U postgres -d postgres -c "SELECT version();"
```

### Emergency: Unlock Blocked Delivery

```sql
-- If delivery accidentally blocked for non-payment reason
UPDATE lots
SET status = 'DELIVERED'
WHERE id = 'lot_123'
RETURNING *;

INSERT INTO audit_log (warehouseID, action, entityType, entityID, reason, createdAt)
VALUES ('wh_1', 'EMERGENCY_UNLOCK', 'LOT', 'lot_123', 'Override reason...', NOW());
```

### Payment Audit: Find Overrides Without Payment

```sql
SELECT
  d.id AS deliveryID,
  d.lotID,
  d.overriddenBy,
  d.overrideReason,
  d.overrideAt,
  CURRENT_DATE - d.overrideAt::date AS daysSinceOverride,
  c.id AS receiptID
FROM deliveries d
LEFT JOIN customer_receipts c ON c.customerID IN (
  SELECT customerID FROM lots WHERE id = d.lotID
)
WHERE d.overriddenBy IS NOT NULL
  AND c.receiptDate IS NULL
  AND CURRENT_DATE - d.overrideAt::date > 7;
```

---

## ROLLBACK PLAN

If critical bug in production:

1. **Frontend**: Revert to previous build on CDN (< 5 min)
2. **Backend**: Revert to previous Docker image, restart (< 10 min)
3. **Database**: Restore from backup (< 30 min, coordinated with ops)
4. **Communication**: Notify users via in-app banner

---

## POST-LAUNCH METRICS TO TRACK

- User adoption: Logins per day
- Delivery throughput: Deliveries per day
- Collections: % collected within 30 days
- System reliability: Uptime %, error rate %
- Performance: API p95 response time
- Stale lots: % of lots reaching STALE
- Override frequency: % final deliveries overridden

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Week 12 | MVP launch: Lot mgmt, delivery blocking, payments, stale detection |
| 1.1 | TBD | Photo proof, SMS alerts, bulk import |

