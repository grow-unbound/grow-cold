# GrowCold: Web-First MVP Roadmap

**Strategy:** Ship web-first PWA (mobile-responsive, installable to home screen). Native apps post-PMF.

**Tech Stack:** React + TypeScript (Next.js), Supabase (PostgreSQL + Auth + Realtime), Vercel (PWA-enabled).

**Success Metric:** 60%+ pilot → paid conversion within 30 days.

---

## ROLES & PERMISSIONS (Finalized)

### Owner
- **Full access:** All data, all actions
- Create lots, record deliveries, record payments
- Settings: BLANKET_STALE_DAYS, FOLLOW_UP_OUTSTANDING_DAYS, etc.
- Admin dashboard: Audit log, override tracking, stale job monitoring
- **Only Owner can:** Override delivery block, write-off lots, mark disputed

### Manager
- **Access:** Everything except owner-only actions
- Create lots, record deliveries (including final), record payments
- **Cannot:** Access Settings, override delivery block, write-off, mark disputed
- View: All lot statuses (ACTIVE, STALE, DELIVERED, CLEARED, WRITTEN_OFF, DISPUTED)
- Collections dashboard: Follow-up overdue list

### Staff
- **Minimal access:** Core operations only
- Create lots, record deliveries, record receipts
- **Cannot:** Override anything, access audit logs, see payment details
- View: ACTIVE + STALE lots only (not historical)
- Dashboard: Summary stats only

---

## MILESTONE 0: FOUNDATION & SKELETON APP

**Goal:** Prove tech stack. Ship a usable shell. Get first user logged in.

**Outcome:** Users can log in via phone OTP, see a list of lots, install PWA to home screen.

### Backend Setup
- [ ] Supabase project (India region if available)
- [ ] PostgreSQL schema: as per COLD_STORAGE_MVP_CTO_SPEC.md
- [ ] Indexes: as per COLD_STORAGE_MVP_CTO_SPEC.md
- [ ] RLS policies: as per COLD_STORAGE_MVP_CTO_SPEC.md
- [ ] Supabase Auth:  as per COLD_STORAGE_MVP_CTO_SPEC.md
- [ ] Test data:  as per COLD_STORAGE_MVP_CTO_SPEC.md

### Backend API
- [ ] Supabse backend
- [ ] Auth middleware: Validate JWT, extract role + warehouseID
- [ ] Error handling: Standardized response `{ success, data, error, code }`
- [ ] GET /api/lots (basic: all lots in warehouse, paginated)
- [ ] GET /api/lots/:id (single lot detail)
- [ ] POST /api/auth/login (phone OTP entry)
- [ ] POST /api/auth/verify-otp (OTP verification → JWT)
- [ ] Database helpers: Query builders (getLots, getLotDetail, getCustomer)
- [ ] Logging: Console logs (not production-ready, just for debugging)

### Frontend (React)
- [ ] Next.js + React 18 + TypeScript scaffold
- [ ] Zustand store: `useLotsStore` (lots, selectedLot, filters, pagination)
- [ ] Navigation: Tab bar (Home, Inventory, Settings) - stub pages
- [ ] Auth page: Phone input + OTP verification
- [ ] JWT storage: localStorage (accept for MVP, improve later)
- [ ] LotCard component: Display lot ID, customer, bags, status badge
- [ ] Inventory page: List of LotCards, basic filtering by status, basic sorting by staleDays, outstanding, balanceBags
- [ ] Error boundary: Catch and display errors gracefully
- [ ] Mobile responsive: Tested on 5" viewport, portrait + landscape

### PWA & Offline Setup
- [ ] Vercel deployment (auto-generates PWA manifest)
- [ ] Service Worker: Cache API responses, show "Offline" banner if no network
- [ ] IndexedDB setup: Stub for offline queue (data store setup, no sync logic yet)
- [ ] Web app manifest: Icons, theme colors, "Install to home screen" tested
- [ ] Lighthouse audit: Score >75 (target >85)

### Testing & Deployment
- [ ] Staging environment: Vercel preview + staging Supabase project
- [ ] Smoke tests: Log in → view lots → no crashes
- [ ] Performance: Initial load <3s on 3G, Lighthouse score >75
- [ ] Mobile UX: Test on 5" phone (Android Chrome, Safari)
- [ ] Git setup: Main branch protected, PR template with testing checklist

### Documentation
- [ ] README: Local setup, environment variables, deployment instructions
- [ ] .cursor/rules: Updated with Supabase auth patterns, RLS examples
- [ ] Architecture diagram: Auth flow, API structure, DB relationships

---

## MILESTONE 1: CORE INVENTORY OPS (OFFLINE + SYNC)

**Goal:** Users can record inward/outward stock entries offline, sync when online. Offline-first is real.

**Outcome:** Ops manager records 10 deliveries in field (no network), drives back to office, opens app, all sync instantly.

### Database & Schema - as per COLD_STORAGE_MVP_CTO_SPEC.md
- [ ] Add tables
- [ ] Constraints: balanceBags validation, accrual date validation
- [ ] Indexes

### Business Logic (Calculations)
- [ ] Utility functions (backend):
  - `calculateDaysOld(lodgementDate)` → number of days since lodgement
  - `calculateDaysUntilStale(lodgementDate, staleDaysLimit)` → days remaining
  - `getSpoilageRiskLevel(daysUntilStale)` → 'green' | 'yellow' | 'red'
  - `calculateOutstanding(customerID)` → sum of unpaid rents + charges
  - `isStale(lot)` → boolean
- [ ] Unit tests for all calculation functions

### Delivery Recording (With Blocking)
- [ ] POST /api/lots/:id/delivery (with validation):
  - Input: numBagsOut, deliveryNotes
  - Calculate: isFinal = (balanceBags - numBagsOut === 0)?
  - If isFinal AND customer.outstanding > 0:
    - Return 409 Conflict: `{ error, code: 'FINAL_DELIVERY_BLOCKED', outstanding, canOverride }`
  - If NOT final AND customer.outstanding > 0:
    - Return 200 + warning: `{ warning, canProceed: true }`
  - Otherwise:
    - Create delivery record, update balanceBags, check status transition (if balanceBags=0, status→DELIVERED)
    - Return 200 success
- [ ] POST /api/lots/:id/delivery/override (owner only):
  - Input: overrideReason (required, non-empty)
  - Validate: user.role === 'OWNER' (403 if not)
  - Create delivery record (same as normal flow)
  - Log to audit_log: action='DELIVERY_OVERRIDE', reason=overrideReason
  - Notify: All OWNER+ users alerted (in-app notification)
  - Return 200 with delivery ID + audit log ID
- [ ] GET /api/lots/:id (enhanced):
  - Return: daysOld, daysUntilStale, spoilageRiskLevel, outstanding, isStale
  - Include: Delivery history, accrual history, status history

### Offline Queue & Sync
- [ ] IndexedDB schema:
  - `pendingDeliveries`: id, lotID, numBagsOut, notes, timestamp, synced (boolean)
  - `syncLog`: timestamp, action, status (success/failed), errorMessage
- [ ] Client-side sync logic:
  - Record delivery locally → immediately update UI (optimistic)
  - If online: Sync to API immediately (background)
  - If offline: Store in IndexedDB, show "pending" badge, sync on reconnect
  - Conflict resolution: Timestamp-based (server wins if newer, client accepts)
  - Retry logic: Max 3 retries, then alert user
- [ ] Network detection: Listen to navigator.onLine, show banner "Offline mode"
- [ ] Sync status: Show sync icon (spinner while syncing, checkmark when done)

### Frontend Components
- [ ] DeliveryModal (new):
  - Input fields: numBagsOut (spinbutton, max = lot.balanceBags), notes (textarea)
  - Case A (normal delivery, no outstanding): Show "Confirm delivery?" + success
  - Case B (normal delivery, has outstanding): Show ⚠️ "Customer owes ₹X. Confirm?" + allow
  - Case C (final delivery, has outstanding): Show 🔴 "Cannot deliver final bags. Contact owner." + override button (if owner)
  - Case D (final delivery, no outstanding): Show ✓ "Final delivery allowed" + success
  - Optimistic UI: Show delivery created immediately, sync in background
  - Error handling: Show retry if sync fails
- [ ] LotDetailPanel (expanded):
  - Full lot info + daysOld + daysUntilStale + spoilageRiskLevel
  - Delivery history (table: date, bags out, notes)
  - Accrual history (table: date, rent amount, paid?)
  - Status transitions (timeline: when and why status changed)
- [ ] StatusBadge (color-coded):
  - ACTIVE → blue
  - STALE → red (with "⏱️ X days old")
  - DELIVERED → yellow
  - CLEARED → green
  - WRITTEN_OFF → gray
  - DISPUTED → orange
- [ ] SpoilageIndicator:
  - Green: >30 days until stale
  - Yellow: 10-30 days until stale
  - Red: <10 days until stale
  - Red (bold): STALE (show "🔴 STALE - X days old (limit Y)")
- [ ] Dashboard Home (initial):
  - Summary stats: Active lots count, Stale lots count, Total outstanding
  - Collections follow-up (if customer outstanding > 0 AND daysOutstanding > 30 days):
    - List: Customer name, outstanding amount, days outstanding, "Follow up" button
  - Recent deliveries: Last 10 deliveries (customer, product, bags, date)

### Stale Detection (Daily Job)
- [ ] Supabase Edge Function:
  - Trigger: Cron at 00:00 UTC (5:30 AM IST)
  - Logic:
    - For each lot WHERE status = 'ACTIVE' OR 'STALE':
      - daysOld = TODAY - lot.lodgementDate
      - staleDaysLimit = product.staleDaysLimit OR 180 (default)
      - If daysOld > staleDaysLimit AND status ≠ 'STALE':
        - UPDATE lot SET status = 'STALE'
        - INSERT lot_status_history: reason = "Auto: exceeded staleDaysLimit (X days)"
    - Log summary: { lotsMarkedStale, timestamp }
  - Idempotent: Don't re-update if already STALE
  - Error handling: Log failures, don't crash
  - Test: Verify in Supabase Edge Functions logs

### Role-Based Access (RLS Enforcement)
- [ ] RLS policies (database):
  - Users can see lots only in their warehouse: `WHERE warehouseID = auth.user.warehouse_id()`
  - Staff see ACTIVE + STALE only: `WHERE status IN ('ACTIVE', 'STALE') OR user.role != 'STAFF'`
  - Owner can perform all actions: No restrictions
  - Manager can perform all except override/settings
- [ ] Backend validation (every endpoint):
  - Extract user.role from JWT
  - Check permission (403 if unauthorized)
  - Log authorization checks for audit
- [ ] Frontend role-based UI:
  - Staff: Hide "Override", "Settings", "Write-off", "Disputed" buttons
  - Manager: Hide "Settings", "Override", "Write-off", "Disputed" buttons
  - Owner: Show all buttons

### Testing
- [ ] E2E scenario: Create lot → Record delivery (normal) → Delivery recorded ✓
- [ ] E2E scenario: Try final delivery with outstanding → 409 blocked → Show override modal ✓
- [ ] E2E scenario: Offline record delivery → Verify in IndexedDB → Go online → Sync ✓
- [ ] E2E scenario: Record 10 deliveries offline, come online, all sync (order preserved) ✓
- [ ] Load test: 500 lots in warehouse, GET /api/lots <100ms ✓
- [ ] Offline sync: Network drops mid-sync, reconnect, resync succeeds ✓
- [ ] Role-based: Staff tries to override delivery → 403 ✓

### Documentation
- [ ] Offline sync architecture doc (how IndexedDB + Service Worker work together)
- [ ] Delivery blocking logic flowchart (API decision tree)

---

## MILESTONE 2: COLLECTIONS & MONEY FLOW

**Goal:** Owners see customer outstanding, record payments, auto-allocate FIFO. Money-making feature.

**Outcome:** Owner records payment from customer, app auto-allocates to oldest unpaid charge. Dashboard shows "Collections due: 5 customers."

### Database Schema
- [ ] Add tables:
  - `customer_receipts` (id, customerID, warehouseID, receiptDate, totalAmount, paymentMethod, referenceNumber, recordedBy, notes, createdAt)
  - `receipt_allocations` (id, receiptID, rentAccrualID OR chargeID, amount, allocatedManually, allocatedBy, createdAt)
  - `warehouse_settings` (id, warehouseID, BLANKET_STALE_DAYS=180, FOLLOW_UP_OUTSTANDING_DAYS=30, YEARLY_RENT_CUTOFF_DATE, GRACE_PERIOD_MONTHS, createdAt, updatedAt)
  - `audit_log` (id, warehouseID, userID, entityType, entityID, action, oldValues, newValues, reason, ipAddress, createdAt)
- [ ] Constraints: receipt total = allocations total, paidDate only if isPaid=true
- [ ] Indexes: customer_receipts(customerID), receipt_allocations(receiptID), audit_log(warehouseID, createdAt DESC)

### Outstanding Calculation
- [ ] GET /api/customers/:id/outstanding:
  - Query: SUM(rent_accruals.rentalAmount WHERE isPaid=false AND lot.status ≠ 'WRITTEN_OFF')
  - Query: SUM(transaction_charges.chargeAmount WHERE isPaid=false AND lot.status ≠ 'WRITTEN_OFF')
  - Return: totalOutstanding, daysOutstanding (if > 0), unpaidRents[], unpaidCharges[]
  - Performance: <50ms even with 1000 lots

### Payment Recording & FIFO Allocation
- [ ] POST /api/customers/:id/receipts:
  - Input: receiptDate, totalAmount, paymentMethod, referenceNumber?, notes?
  - Create: CustomerReceipt record
  - Query: All unpaid rents + charges for customer, sorted by date (FIFO)
  - Allocate: Iterate through unpaid items, allocate receipt amount FIFO
  - Update: Mark corresponding rents/charges as isPaid=true, paidDate=TODAY
  - Create: ReceiptAllocations records for audit
  - Check lot status: If lot.balanceBags=0 AND lot.outstanding=0, status→'CLEARED'
  - Return: receiptID, allocations[] with allocation details
- [ ] Rent accrual logic:
  - Monthly: First accrual on lodgementDate + 1 day, then monthly thereafter
  - Yearly: First accrual on lodgementDate + 1 month, then yearly on YEARLY_RENT_CUTOFF_DATE
  - Brought forward: Manual, one-time, owner creates manually
- [ ] POST /api/customers/:id/receipts/:id/reallocate (owner/manager only):
  - Input: allocations[] = [{ rentAccrualID/chargeID, amount }]
  - Validate: Total amount = receipt.totalAmount
  - Clear old allocations, create new ones
  - Log old + new allocation to audit_log
  - Update: Mark/unmark rents/charges as isPaid

### Collections Dashboard
- [ ] GET /api/dashboard/collections:
  - Follow-up due: Customers WHERE outstanding > 0 AND daysOutstanding > FOLLOW_UP_OUTSTANDING_DAYS
  - Return: customerID, name, outstanding, daysOutstanding, lastFollowUpDate?, followUpRequired
- [ ] Collections page (new):
  - Sorted list: By daysOutstanding DESC (oldest first)
  - Each customer: Name, phone, outstanding ₹, days outstanding, last delivery date
  - Action: "Record payment" button → PaymentModal
  - Badge: If >45 days overdue, show red "URGENT"

### Payment Form Component
- [ ] PaymentModal (new):
  - Input fields:
    - Receipt date (date picker, default TODAY)
    - Amount (number input, required, >0)
    - Payment method (dropdown: CASH, BANK_TRANSFER, CHEQUE, UPI, OTHER)
    - Reference (text, optional: cheque number, UPI ref, bank ref)
    - Notes (textarea, optional)
  - Display: Proposed allocations (FIFO order) before submit
    - Table: Charge/Rent date, type, amount, allocation amount
  - Submit: "Record receipt" button (disabled if amount=0)
  - Success: Toast "Receipt recorded" + modal closes + dashboard refreshes
  - Error: Show retry if sync fails

### Audit Log
- [ ] POST /api/... triggers audit_log entry:
  - Delivery creation → action='DELIVERY_CREATED'
  - Delivery override → action='DELIVERY_OVERRIDE'
  - Receipt creation → action='RECEIPT_CREATED'
  - Receipt reallocation → action='RECEIPT_REALLOCATED'
  - Payment mark/unmark → action='PAYMENT_STATUS_CHANGED'
- [ ] Fields: userID, entityType, entityID, action, oldValues, newValues, reason, createdAt

### Frontend Components
- [ ] PaymentForm: Amount, date, method, notes, allocations preview
- [ ] CollectionsPage: Follow-up due list, sorted by daysOutstanding
- [ ] AuditLog stub: Simple table (action, user, entity, date) - full UI in MILESTONE 4

### Testing
- [ ] E2E: Create receipt → Verify FIFO allocation ✓
- [ ] E2E: Receipt allocates to oldest unpaid charge ✓
- [ ] E2E: Mark final delivery → outstanding = 0 → Status → CLEARED ✓
- [ ] E2E: Reallocate receipt manually → Verify new allocations ✓
- [ ] Collections: Lot > 30 days outstanding → Appears in follow-up due ✓
- [ ] Role-based: Staff records payment → success (allowed) ✓
- [ ] Offline: Record payment offline → Sync on reconnect ✓

---

## MILESTONE 3: STATUS TRANSITIONS & OWNER ACTIONS

**Goal:** Owners can write-off, mark disputed, override delivery blocks. Handle edge cases gracefully.

**Outcome:** Owner marks lot as spoiled → chargesFrozen=true → rent stops accruing. Or disputes lot → audits decision.

### Write-off & Disputed Lots
- [ ] POST /api/lots/:id/write-off (owner only):
  - Input: reason (required, non-empty)
  - Validate: user.role = 'OWNER' (403 if not)
  - Update: status='WRITTEN_OFF', chargesFrozen=true
  - Insert: lot_status_history with reason
  - Insert: audit_log with action='LOT_WRITTEN_OFF'
  - Return: Updated lot + audit log ID
- [ ] POST /api/lots/:id/mark-disputed (owner only):
  - Input: reason (required, non-empty)
  - Validate: user.role = 'OWNER' (403 if not)
  - Update: status='DISPUTED'
  - Insert: lot_status_history with reason
  - Insert: audit_log with action='LOT_MARKED_DISPUTED'
  - Note: Rent continues accruing (owner can manually freeze if needed)
  - Return: Updated lot + audit log ID

### Accrual Stop Logic
- [ ] When calculating outstanding:
  - Exclude WRITTEN_OFF, CLEARED lots
  - Include ACTIVE, STALE, DELIVERED, DISPUTED
  - Query: `WHERE status NOT IN ('WRITTEN_OFF', 'CLEARED')`
- [ ] When calculating rent for specific lot:
  - If chargesFrozen=true, don't accrue new rent (return 0)
  - Else: Accrue normally

### Status Transition Rules
- [ ] ACTIVE → DELIVERED (when balanceBags = 0)
- [ ] ACTIVE → STALE (when daysOld > staleDaysLimit, auto job)
- [ ] STALE → DELIVERED (when balanceBags = 0)
- [ ] DELIVERED → CLEARED (when outstanding = 0)
- [ ] ACTIVE/STALE/DELIVERED → WRITTEN_OFF (owner action)
- [ ] ACTIVE/STALE/DELIVERED → DISPUTED (owner action)
- [ ] Cannot revert from WRITTEN_OFF or DISPUTED (terminal states)

### Frontend Components
- [ ] WriteOffModal (new):
  - Input: reason (textarea, required)
  - Warning: "This cannot be undone. All pending charges frozen."
  - Confirm button with strong visual (red background)
- [ ] DisputedModal (new):
  - Input: reason (textarea, required)
  - Note: "Rent continues accruing. Resolve dispute to clear lot."
  - Buttons: "Mark disputed" + "Cancel"
- [ ] OwnerActions (conditional):
  - Show "Write-off" + "Mark disputed" buttons (owner only, not manager/staff)
  - Hide if status already WRITTEN_OFF or DISPUTED

### Testing
- [ ] E2E: Owner marks lot written-off → Status updates → chargesFrozen=true ✓
- [ ] E2E: Staff tries to mark written-off → 403 ✓
- [ ] E2E: Written-off lot → Outstanding calculated correctly (excluded) ✓
- [ ] E2E: Mark disputed → Rent continues accruing ✓

---

## MILESTONE 4: SETTINGS, LOCALIZATION & ADMIN DASHBOARD

**Goal:** Hindi/Telugu support, warehouse-specific settings, ADMIN-only controls, audit visibility.

**Outcome:** Owner launches app, sees Telugu option. All labels in regional language. Admin sees "Override audit: X overrides without payment in 7 days."

### Localization Setup
- [ ] i18n library: react-i18next (same as Expo pattern)
- [ ] Language files:
  - `en-US.json`: English (default)
  - `te-IN.json`: Telugu (primary regional language)
  - Structure: `{ "nav": { "home": "..." }, "delivery": { "bags": "..." } }`
- [ ] UI language selector: Dropdown in Settings, stores in localStorage
- [ ] Date format: DD/MM/YYYY (override locale default)
- [ ] Currency format: ₹ with lakhs notation (e.g., ₹2,50,000 not ₹250,000)
- [ ] Key translations (domain-specific):
  - "Stock" (not "Inventory")
  - "Party" / "Customer" (not "Client")
  - "Inward" / "Outward" (not "Receiving" / "Shipping")
  - "Lot" / "Batch"
  - "Godown" / "Warehouse"

### Warehouse Settings Page
- [ ] GET /api/warehouse-settings/:warehouseID:
  - Return: BLANKET_STALE_DAYS, FOLLOW_UP_OUTSTANDING_DAYS, YEARLY_RENT_CUTOFF_DATE, GRACE_PERIOD_MONTHS
  - Validate: user.role = 'OWNER' (403 if not, show "Unauthorized")
- [ ] POST /api/warehouse-settings/:warehouseID (owner only):
  - Input: BLANKET_STALE_DAYS, FOLLOW_UP_OUTSTANDING_DAYS, YEARLY_RENT_CUTOFF_DATE, GRACE_PERIOD_MONTHS
  - Validate: All > 0
  - Update: warehouse_settings record
  - Log: audit_log action='SETTINGS_UPDATED', oldValues, newValues
  - Return: Updated settings
- [ ] SettingsPanel (new):
  - Owner-only view (staff/manager see "Settings unavailable")
  - Form inputs:
    - BLANKET_STALE_DAYS (number, ≥1)
    - FOLLOW_UP_OUTSTANDING_DAYS (number, ≥1)
    - YEARLY_RENT_CUTOFF_DATE (date picker)
    - GRACE_PERIOD_MONTHS (number, ≥1)
  - Defaults displayed
  - Save button (disabled until change)
  - Confirmation before save: "Update settings?"

### Role-Based Navigation
- [ ] Navigation logic:
  - Staff: Home (summary only), Inventory (ACTIVE/STALE only), Delivery form, Payment form
  - Manager: Home (full), Inventory (all statuses), Dashboard (collections), Delivery, Payment, Audit log (read-only)
  - Owner: All tabs + Settings + Audit log + Override audit

### Admin Dashboard (Owner/Manager)
- [ ] GET /api/dashboard/home (enhanced):
  - Summary: activeLotsCount, staleLotsCount, deliveredCount, clearedCount, totalOutstanding
  - Collections follow-up: See MILESTONE 2
  - Recent deliveries: Last 10 (customer, product, bags, date, blocked?)
  - Stale job status: "Last stale check: 2 hours ago" (or "⚠️ Failed" if missed)
- [ ] GET /api/dashboard/inventory:
  - Lot list with: daysOld, daysUntilStale, spoilageRiskLevel, outstanding, status
  - Filterable by status, customer, date range
- [ ] DashboardHome page:
  - Summary stats grid (4 cards: Active, Stale, Outstanding, Blocked deliveries)
  - Collections follow-up section (if any)
  - Recent deliveries list
  - Stale job monitor badge

### Audit Log UI (Owner only)
- [ ] GET /api/audit-log (with filters):
  - Query: warehouseID, with filters: entityType, action, dateRange, userID
  - Return: Array of audit_log entries with user display names
- [ ] AuditLogPage (new):
  - Table: User, Action, Entity, Old value → New value, Date, Reason
  - Filters: Action type (dropdown), Date range (picker), User (dropdown)
  - Export: Download as CSV
  - Specific views:
    - Override audit: "DELIVERY_OVERRIDE" entries, highlight if no payment within 7 days
    - Settings changes: "SETTINGS_UPDATED" entries
    - Lot status changes: "LOT_STATUS_CHANGED" entries

### Frontend Components
- [ ] SettingsPanel: Form with BLANKET_STALE_DAYS, FOLLOW_UP_OUTSTANDING_DAYS, cutoff date, grace months
- [ ] AuditLogTable: Filter controls + sortable table
- [ ] RoleBasedNav: Conditional rendering of tabs/buttons per role

### Testing
- [ ] Language switch: English ↔ Telugu, all UI updates ✓
- [ ] Settings: Owner updates BLANKET_STALE_DAYS → Verify in audit_log ✓
- [ ] Settings: Manager tries to access → 403 (or UI hides) ✓
- [ ] Audit log: Filter by DELIVERY_OVERRIDE → Show all overrides ✓
- [ ] Audit log: 7-day override flag → Highlight overrides without payment ✓

### Documentation
- [ ] i18n setup guide (how to add new languages)
- [ ] Localization best practices (date format, currency, regional terms)

---

## MILESTONE 5: DATA UPLOAD & DATABASE JOBS

**Goal:** Seed production data efficiently. Automate recurring jobs (stale checks, rent accruals).

**Outcome:** Admin uploads CSV of 500 lots → App parses, validates, creates in DB. Stale job runs nightly, handles 10,000 lots.

### Data Upload (Bulk Lot Import)
- [ ] POST /api/data/lots/import (owner/manager):
  - Accept: CSV file with columns:
    - customerName, customerPhone, productName, originalBags, lodgementDate, rentalMode, rentalAmount, notes
  - Validation:
    - customerName & phone required
    - productName must exist in products table
    - originalBags > 0
    - lodgementDate ≤ TODAY
    - rentalMode in (MONTHLY, YEARLY, BROUGHT_FORWARD)
    - rentalAmount > 0
  - Processing:
    - For each row:
      - Lookup/create customer (by phone, unique per warehouse)
      - Lookup product (by name)
      - Create lot with status=ACTIVE
      - Insert lot_status_history (reason: "Bulk imported")
    - Rollback entire batch if any row fails
  - Return: { success, lotsCreated, errors[] (if any) }
  - Log: audit_log action='BULK_LOT_IMPORT', reason='Uploaded X lots'
- [ ] CSV template: Provide downloadable template
- [ ] Error handling:
  - Invalid phone format → error "Invalid phone: ABC"
  - Product not found → error "Product 'Garlic' not found. Add product first."
  - Duplicate (same customer + product + date) → Skip with warning "Duplicate skipped"
  - Show summary: "150 lots created. 5 skipped (duplicates). 0 errors."

### Rent Accrual Job (Scheduled)
- [ ] Supabase Edge Function: `monthly-rent-accrual` (Cron Monthend 00:15 UTC)
  - For each lot WHERE status ≠ 'CLEARED' AND staus ≠ 'WRITTEN-OFF' :
    - Check if rent accrual needed (based on rentalMode + accrualDate logic)
    - If monthly: Check if today is monthly anniversary of lodgementDate
    - If yearly: Check if today is yearly anniversary (or within grace period)
    - If Broughtforward: 
    - Create rent_accruals record with accrualDate=TODAY
  - Idempotent: Don't create duplicate accruals for same lot + date
  - Log: Edge Function logs (can inspect in Supabase)
- [ ] Testing: Manually trigger job, verify accruals created correctly

### Stale Check Job (Already in MILESTONE 1)
- [ ] Supabase Edge Function: `daily-stale-check` (Cron 00:00 UTC)
  - Already implemented, ensure it runs reliably
  - Add monitoring: If job fails 2 consecutive days, alert owner

### Audit Job (Monthly)
- [ ] Job: Archive old audit logs (>90 days) to cold storage (if needed)
  - For v1: Keep all in DB (audit_log is small volume)
  - For v2: Archive to S3 if log grows large

### Monitoring Dashboard (Owner only)
- [ ] GET /api/jobs/status:
  - Return: { lastStaleCheck, staleCheckSuccess, lastAccrualCheck, accrualCheckSuccess, importStatus }
- [ ] Display:
  - Stale job: "Last run 2 hours ago ✓" or "⚠️ Failed 18 hours ago"
  - Accrual job: "Last run 2 hours ago ✓"
  - Import: If in progress, show "Importing... 150/500"

### Data Validation Rules
- [ ] Phone: +91 XXXXXXXXXX or 10-digit number
- [ ] Email: Valid format (optional)
- [ ] Bags: Integer, >0, ≤10000 (reasonable limit)
- [ ] Amount: Decimal, >0
- [ ] Date: DD/MM/YYYY format, ≤ TODAY

### Frontend Components
- [ ] DataUploadPage (new):
  - Drag-drop zone for CSV file
  - Template download link
  - Progress bar (if large file)
  - Results: "150 lots created. 5 skipped. 0 errors."
  - Error details (collapsible): "Row 23: Product 'Lemon' not found"
- [ ] JobsMonitor (new):
  - Status badges for stale job, accrual job
  - Last run timestamp
  - Manual trigger button (for testing, owner only)

### Backend
- [ ] CSV parsing: Use `papaparse` library
- [ ] Bulk insert: Batch inserts (100 at a time) for performance
- [ ] Error handling: Detailed error messages per row
- [ ] Transaction: Wrap entire import in DB transaction (all-or-nothing)

### Testing
- [ ] E2E: Upload valid CSV → Verify lots created ✓
- [ ] E2E: Upload CSV with invalid product → Show error, roll back ✓
- [ ] E2E: Stale job runs → Verify lots marked STALE correctly ✓
- [ ] E2E: Accrual job runs → Verify rent_accruals created ✓
- [ ] Load test: 5000 lots in DB → Stale job completes <2s ✓

### Documentation
- [ ] CSV import guide (column definitions, validation rules)
- [ ] Job scheduling guide (how to test jobs locally)
- [ ] Emergency runbook: How to manually trigger stale job if automated fails

---

## MILESTONE 6: TESTING, HARDENING & PERFORMANCE

**Goal:** Production-ready quality. No crashes, fast queries, secure data.

**Outcome:** Staging deployment handles 10,000 lots, <100ms queries, 99.5% uptime, zero data leaks.

### Unit Tests
- [ ] Calculations (utilities):
  - calculateDaysOld, calculateDaysUntilStale, getSpoilageRiskLevel
  - calculateOutstanding (multiple scenarios)
  - Coverage: >90%
- [ ] Role checks: can(role, action) for all actions
- [ ] Data validation: validateCSVRow, validateDelivery, validatePayment
- [ ] Date/currency formatting: formatDate, formatCurrency (localization)

### Integration Tests
- [ ] Auth flow: Phone OTP → JWT → protected endpoint
- [ ] Lot lifecycle: Create → Deliver → Payment → Cleared
- [ ] Offline sync: Record offline → Sync online → Verify consistency
- [ ] Accrual logic: Monthly vs. yearly rent accrual timing
- [ ] Role-based: Staff tries forbidden action → 403
- [ ] Database constraints: Invalid data rejected (balanceBags validation)

### E2E Tests (Cypress)
- [ ] Scenario 1: Normal workflow (create → deliver → payment → cleared)
- [ ] Scenario 2: Blocked delivery (final delivery + outstanding → 409 → override)
- [ ] Scenario 3: Offline sync (record 10 deliveries offline → come online → all sync)
- [ ] Scenario 4: Stale detection (wait/mock 180+ days → stale job runs → status updated)
- [ ] Scenario 5: Collections (multiple lots → customer owes → payment allocated FIFO)
- [ ] Scenario 6: Role-based (staff tries settings → denied, owner can access)

### Load Testing
- [ ] Setup: 1000 lots, 50 customers per warehouse
- [ ] Queries:
  - GET /api/lots: <100ms (p95)
  - GET /api/customers/:id/outstanding: <50ms (p95)
  - POST /api/lots/:id/delivery: <200ms (p95)
- [ ] Tools: Apache JMeter or k6
- [ ] Acceptance: p95 latency acceptable, no timeouts, error rate <0.1%

### Performance Optimization
- [ ] Database:
  - Add indexes (already in MILESTONE 1)
  - Query analysis: EXPLAIN ANALYZE on slow queries
  - Connection pooling: Supabase Postgres (built-in)
- [ ] Frontend:
  - Code splitting: Lazy load pages
  - Image optimization: Compress product images
  - Bundle size: Keep <150KB gzipped
  - Lighthouse: Score >85
- [ ] API:
  - Response caching: No caching for now (data changes frequently)
  - Pagination: Always paginated (max 100 items per request)

### Security Audit
- [ ] RLS policies verified:
  - User can't access other warehouse (cross-warehouse query fails)
  - Role checks enforced (403 on unauthorized actions)
  - Delete operations cascade correctly
- [ ] JWT:
  - Expiry: 24 hours (reasonable for SMB)
  - Refresh: Use refresh tokens (Supabase provides)
  - Storage: localStorage (acceptable for now, improve in v1.1 with secure storage)
- [ ] API:
  - No sensitive data in error messages
  - Rate limiting: 100 requests/minute per user (basic)
  - CORS: Only allow growcold.app origin
- [ ] Database:
  - Passwords hashed (Supabase Auth handles)
  - No hardcoded secrets in code
  - Backup strategy: Supabase daily backups (automatic)
- [ ] Data privacy:
  - Phone numbers stored (required for OTP)
  - No email storage (keep out of DB until v1.1)
  - Audit trail: All actions logged

### Monitoring & Observability
- [ ] Error tracking: Sentry integration (capture 100% of errors)
- [ ] Analytics: Simple tracking (daily active users, feature usage)
- [ ] Logs: Supabase logs (Edge Functions, database)
- [ ] Dashboards:
  - Error rate (target: <0.1%)
  - API latency (target: p95 <200ms)
  - Uptime (target: >99.5%)
  - Daily active users (track growth)

### Mobile UX Testing
- [ ] Devices: Android (5", 6.5" screens), iOS (if possible)
- [ ] Scenarios:
  - Tap accuracy: Fat finger hits buttons reliably
  - Offline: Record delivery offline, show sync status
  - Network switch: WiFi → Mobile data → WiFi (no crashes)
  - Battery: App doesn't drain battery excessively
  - Dark mode: UI readable in dark mode (if supported)

### Deployment Readiness
- [ ] Git: Protected main branch, squash commits before merge
- [ ] CI/CD: GitHub Actions (run tests on every PR)
- [ ] Staging: Separate Supabase project, same schema as production
- [ ] Database migration: Tested on staging before production
- [ ] Rollback plan: How to revert if production breaks
- [ ] Runbook: Common operations (manual stale check, reset user, backup)

---

## MILESTONE 7: PILOT DEPLOYMENT & FEEDBACK LOOP

**Goal:** Real users, real data, real feedback. Measure PMF signals.

**Outcome:** 3-5 warehouses live. Track: Feature usage, daily active users, time-to-value (days to see benefit), conversion to paid.

### Production Setup
- [ ] Supabase:
  - Production project (separate from staging)
  - Point backups: Daily 7-day retention
  - Monitoring: Enable Supabase health dashboard
  - Alerts: Email on db connection failures
- [ ] Vercel:
  - Production deployment (growcold.app or domain)
  - Edge caching: Vercel CDN (automatic)
  - Monitoring: Vercel analytics
- [ ] Secrets:
  - Store in Vercel environment variables (not .env file)
  - Rotate JWT secret periodically
- [ ] Monitoring:
  - Sentry: Error tracking with release tags
  - Analytics: Segment or Mixpanel (simple install)
  - Database: Supabase logs retention (7 days)

### Pre-Launch Checklist
- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance benchmarks met (p95 latency, Lighthouse >85)
- [ ] Security audit passed (RLS, JWT, rate limiting)
- [ ] Documentation complete (README, runbook, API docs)
- [ ] Backup tested: Restore from backup on staging ✓
- [ ] Team trained: Support team knows common issues

### Pilot Recruitment
- [ ] Target: 3-5 warehouses (ideally mix of cold storage types)
- [ ] Outreach: Personal intro from Phani, offer free trial (30 days)
- [ ] Onboarding: Screen share + walk through first inward entry
- [ ] Support: Weekly check-ins, respond to issues <4 hours
- [ ] Incentive: Feedback session = ₹500 Amazon voucher (optional)

### Launch Day
- [ ] Communicate: Email to pilots with link + instructions
- [ ] Monitor: Watch Sentry dashboard for errors
- [ ] Support: Available for calls if users stuck
- [ ] Celebrate: Take a win! 🎉

### Feedback Collection
- [ ] Weekly calls: "What worked? What confused you?"
- [ ] In-app feedback form: Capture pain points spontaneously
- [ ] Surveys: NPS score (Net Promoter Score) weekly
- [ ] Feature tracking: What features are used vs. ignored?
- [ ] Time-to-value: When did they see first benefit (reduced shrinkage, faster collection)?

### Metrics to Track
- [ ] Adoption:
  - Daily active users (target: 100% of staff)
  - Logins per day
  - Features used per user (track which features matter)
- [ ] Usage:
  - Deliveries recorded per day (vs. paper baseline)
  - Payment receipts recorded per week
  - Settings accessed (measure if needed)
- [ ] Quality:
  - Error rate (target: <0.1%)
  - Crash rate (target: 0%)
  - API latency p95 (target: <200ms)
- [ ] Business:
  - Time to first delivery recorded (target: <10 min onboarding)
  - Conversion: Pilot → paid (target: 60%)
  - Retention: Active 30 days later (target: 80%)

### Iteration (Rapid)
- [ ] Feedback → Linear ticket → Fix → Deploy (goal: same day if possible)
- [ ] Top 5 pain points prioritized
- [ ] Quick wins (UX fixes): Ship within 24 hours
- [ ] Feature requests: Batch and ship in bi-weekly release

### Go/No-Go Decision
- [ ] After 2 weeks: Meet with team
  - Adoption >80%? (Else: Fix UX, extend pilot)
  - Conversion signals >50%? (Else: Identify blocker, iterate)
  - Any critical bugs? (Else: Safe to expand)
- [ ] Proceed to MILESTONE 8 or iterate

---

## MILESTONE 8: SCALE & MARKET READINESS

**Goal:** Proven PMF. Ready for next 10-20 pilots. Pricing, legal, support infrastructure.

**Outcome:** App launched to 15-20 warehouses. Repeatable pilot-to-paid motion. ₹2-5L MRR pipeline.

### Pricing & Packaging
- [ ] Tier 1: Starter (₹2,999/month)
  - 1 warehouse, 5 staff
  - Core features: Inward, Outward, Payment
- [ ] Tier 2: Growth (₹9,999/month)
  - 3 warehouses, 20 staff
  - All features + Audit, Settings, Bulk import
- [ ] Tier 3: Enterprise (Custom)
  - Unlimited warehouses + custom integrations
- [ ] Billing: Supabase (use Stripe integration, Supabase handles)
- [ ] Free trial: 30 days (auto-cancel, remind before charge)

### Product Documentation
- [ ] In-app tutorial: First 5 steps (inward entry, delivery, payment)
- [ ] Help center: Knowledge base (How-to guides, FAQ)
- [ ] Video tutorials: Quick <2 min videos (how to record delivery, payment)
- [ ] Support chat: Crisp support AI (or Intercom) during business hours

### Legal & Compliance
- [ ] Terms of Service: Standard (Supabase T&C + custom for cold storage)
- [ ] Privacy Policy: GDPR + India privacy laws
- [ ] Refund policy: 7-day money-back guarantee (builds trust)
- [ ] Data residency: Confirm Supabase India region (if available)

### Sales Enablement
- [ ] Sales deck: 5-slide pitch (problem, solution, proof, pricing, CTA)
- [ ] Case study: 1 pilot success story (conversion, revenue impact)
- [ ] Demo video: 3-min walk-through
- [ ] Landing page: growcold.app website (simple, conversion-focused)

### Support Infrastructure
- [ ] Support email: support@growcold.app (monitor daily)
- [ ] Response SLA: <4 hours for critical issues
- [ ] Common issues: Create runbook (password reset, stale job restart, etc.)
- [ ] Escalation: Know when to involve Phani vs. support team

### Expansion Strategy (Post-PMF)
- [ ] Add features based on pilot feedback:
  - Photo proof for deliveries (most requested)
  - SMS alerts (collections follow-up)
  - Bulk delivery import
  - Custom rent adjustments
- [ ] Geographic expansion: Target 5-10 more regions
- [ ] Vertical expansion: Dry storage (not just cold storage)

---

## NON-FUNCTIONAL REQUIREMENTS (All Milestones)

### Offline-First (Enforced every milestone)
- [ ] Core operations work without network:
  - Create lots ✓
  - Record deliveries ✓
  - Record payments ✓
  - View cached inventory ✓
- [ ] Sync: When online, queue processed, timestamp-based conflict resolution
- [ ] User feedback: Show sync status (spinner, checkmark, retry button)

### Localization (All UI, every milestone)
- [ ] English (default) + Telugu (priority)
- [ ] Date: DD/MM/YYYY
- [ ] Currency: ₹ with lakhs notation
- [ ] Domain terms: "Stock", "Party", "Inward", "Outward", "Lot"
- [ ] Pluralization: Handle "1 bag" vs "2 bags"

### Mobile-Responsive (Every component)
- [ ] 5" viewport (minimum): Touch targets ≥40px primary chrome, readable text (16px on inputs)
- [ ] 6.5" viewport: Optimal layout
- [ ] Landscape mode: Functional (not hidden)
- [ ] No horizontal scroll (acceptable: tables, minor exceptions)
- [ ] Haptic feedback: Confirm button taps (on supported devices)

### Accessibility (Minimum bar)
- [ ] Color blind safe: Don't rely on color alone (add icons, text)
- [ ] Touch targets: ≥40px for primary buttons (`min-h-touch`)
- [ ] Text contrast: WCAG AA standard (4.5:1 for body text)
- [ ] No keyboard traps: All interactive elements keyboard accessible

### Performance (Every milestone)
- [ ] Initial load: <3s on 3G
- [ ] API response (p95): <200ms
- [ ] Database query: <100ms for list (1000 items)
- [ ] Bundle size: <200KB gzipped
- [ ] Lighthouse: >80 (target >85)

### Security (All milestones)
- [ ] RLS: Enforced on every endpoint (database + backend validation)
- [ ] JWT: 24-hour expiry, refresh token strategy
- [ ] Secrets: Never in code, use .env + Vercel environment variables
- [ ] CORS: Only growcold.app origin
- [ ] Rate limiting: 100 req/min per user
- [ ] Audit trail: All mutations logged

---

## QUICK REFERENCE: DELIVERABLES BY MILESTONE

| Milestone | Deliverable | Success Signal |
|-----------|------------|---|
| 0 | Skeleton app (login + lot list) | User can log in, see lots, install to home screen |
| 1 | Offline-capable delivery recording | Record 10 deliveries offline, sync all on reconnect |
| 2 | Collections flow (payment FIFO) | Owner records payment, auto-allocated, dashboard shows follow-up due |
| 3 | Owner actions (write-off, dispute) | Owner marks lot written-off, rent stops accruing |
| 4 | Hindi/Telugu + Settings + Audit | Owner switches to Telugu, adjusts stale days, views audit log |
| 5 | Bulk data upload + Jobs | Import 500 lots from CSV, stale job runs nightly |
| 6 | Testing, hardening, monitoring | Staging: 1000 lots, <100ms queries, 99.5% uptime |
| 7 | 3-5 pilots live, feedback loop | Track: Daily active users, feature usage, conversion intent |
| 8 | Pricing, legal, sales-ready | 15-20 pilots, repeatable sales motion, ₹2-5L MRR pipeline |

---

## CRITICAL PATH (Fastest Route to PMF)

**Do these first, in order. Everything else is optional until PMF confirmed:**

1. **MILESTONE 0 + 1 (Foundation + Offline Delivery)** - Get to "users can record stock offline"
2. **MILESTONE 2 (Collections)** - Get to "owner sees money flow"
3. **MILESTONE 7 (Pilot)** - Ship to real users, measure conversion
4. **Iterate** - Only then add MILESTONE 3/4/5 based on what pilots ask for

**Skip if not critical for MVP:**
- Dark mode (users won't care)
- Advanced analytics (later)
- Native apps (not until PMF)
- Multi-warehouse UI (v1.1)

---

## ASSUMPTIONS & RISKS

### Assumptions
- Supabase RLS reliable for multi-tenant isolation (verified: mature product)
- Service Worker offline sync sufficient (vs. native app) ✓
- Warehouse owners will accept web PWA instead of app store (critical assumption - validate in pilot)
- Telugu localization is sufficient (vs. all 4 languages at once)

### Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Pilot doesn't convert to paid | App doesn't fit actual workflow | User interviews before building features; iterate fast |
| Stale job fails silently | Lots not marked stale, revenue hit | Monitor job, alert if missed, manual trigger available |
| Offline sync loses data | User frustration | Test edge cases (network drops, clock skew), transparent error messages |
| RLS misconfiguration | Data leakage across warehouses | Comprehensive RLS tests, code review before deploy |
| Payment allocation FIFO wrong | Collections broken, revenue hit | Unit test allocation logic, E2E test with real payment flow |

---

## SUCCESS CRITERIA

App is successful when:

1. ✅ **Adoption:** 100% of pilot warehouse staff use app daily (zero paper registers)
2. ✅ **Offline:** App works 4+ hours offline, syncs flawlessly when online
3. ✅ **PMF:** 60%+ pilots convert to paid within 30 days
4. ✅ **Onboarding:** New user can record first delivery in <10 minutes (self-serve, no demo call)
5. ✅ **Performance:** <2s initial load on 3G, <100ms API queries, <0.1% error rate
6. ✅ **Localization:** Users prefer Telugu UI, no "switch back to English" complaints
7. ✅ **Collections:** Owners see tangible impact (faster collections, reduced shrinkage) in first 15 days

---

## HOW TO USE THIS ROADMAP

1. **Copy milestones to Linear:** Create Epic per milestone, Tasks per checkbox
2. **Assign ownership:** Backend dev → API/jobs, Frontend dev → UI/components
3. **Weekly sprints:** 2 developers = 2 tasks per dev per week
4. **Standups:** What shipped? What's blocked? Ahead/behind?
5. **Iterate:** Feedback → Linear ticket → Fix → Deploy (daily if possible)
6. **Track metrics:** After MILESTONE 7, track adoption + conversion intent

**Goal: Reach MILESTONE 7 (Pilot) in 12-14 weeks, then decide next phase based on PMF signals.**