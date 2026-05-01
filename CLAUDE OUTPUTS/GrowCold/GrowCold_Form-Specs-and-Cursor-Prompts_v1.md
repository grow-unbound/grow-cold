# GrowCold — Form Specs & Cursor Prompts

> One doc per form: independent spec + requirements-level cursor prompt.  
> All forms follow `GrowCold_Form-Design-Best-Practices_v2.md`.  
> No code or schema included here — cursor prompts are requirements-level only.

---

---

# Form 1: New Lot / Edit Lot

## Spec

### Entry Points
- Lots list screen → FAB "New Lot"
- Party Detail screen → speed-dial FAB → "Add Lot"
- Lot Detail screen → ⋮ menu → "Edit Lot"

### Screen Title
- Create: "New Lot"
- Edit: "Edit Lot"

### Zone 1 — Required Fields

| Field | Type | Validation |
|-------|------|------------|
| Party (Customer) | Selector (code + name) | Required |
| Product | Selector | Required |
| No. of Bags | Numeric integer | Required, > 0 |
| Lot Number | Text, auto-suggested | Required; unique across all lots; suggest as `[prefix]-[PartyCode]-[incrementing 3-digit number]` based on last lot for that party; user may override |
| Location | Text | Required; free text (e.g. "Row B, Rack 3"); future: structured picker |

### Zone 2 — Optional Fields (collapsed by default)

| Field | Type | Notes |
|-------|------|-------|
| Driver Name | Text | — |
| Vehicle Number | Text | Indian vehicle number format, not validated strictly |
| Notes | Multiline text | — |

### Behaviors

- **Party selection** triggers Lot Number suggestion refresh (re-run increment logic for that party)
- **Lot Number** field shows a `✏ suggested` label when auto-filled; label disappears once user edits it manually
- **Edit mode**: Lot Number field is shown but changing it requires explicit unlock (tap lock icon). Show a warning: "Changing the lot number will affect all linked records." — user must confirm inline before the field unlocks.
- **Edit mode**: Party and Product are read-only once the lot has any inward or delivery records. Show a "Cannot change — lot has movements" label if user taps.
- On save (create): navigate back to Lots list or Party Detail (whichever the entry point was), show toast "Lot GC-RC01-047 created"
- On save (edit): navigate back to Lot Detail, show toast "Lot updated"

### States
- **Loading**: skeleton on Zone 1 fields while party/product lists load from cache
- **Offline**: all fields fully functional; Lot Number increment derived from local cache
- **Error (save fails)**: stay on form, show inline error below Save button: "Could not save. Try again."
- **Edit — read-only fields**: greyed input with lock icon, tappable to see explanation

### Desktop Differences
- Party and Product use inline autocomplete combobox
- Zone 2 visible by default (no collapse) if viewport height > 768px
- No. of Bags and Location render side-by-side in a 2-column row

---

## Cursor Prompt

```
Build the New Lot / Edit Lot screen for the GrowCold mobile and web app.

Follow all patterns in GrowCold_Form-Design-Best-Practices_v2.md.

Screen requirements:

NAVIGATION
- Accessible from: Lots list FAB, Party Detail speed-dial FAB, Lot Detail ⋮ menu (edit)
- Full-screen stack screen. Header: back arrow + title ("New Lot" or "Edit Lot"). No header actions.
- Sticky footer: Cancel (left) + Save (right). Save is disabled until all Zone 1 fields are filled.

ZONE 1 — REQUIRED FIELDS
1. Party: selector showing code + name. Mobile: full-screen search picker with recent parties. Desktop: inline autocomplete combobox. Required.
2. Product: selector. Mobile: full-screen picker. Desktop: inline combobox. Required.
3. No. of Bags: numeric integer input with "bags" suffix. Required, must be > 0.
4. Lot Number: text input. Auto-suggested value based on the last lot number for the selected party (increment the sequence). Show a "suggested" label when auto-filled. User can override. Required. Must be unique — validate uniqueness on blur with an async check.
5. Location: text input (free text, e.g. "Row B, Rack 3"). Required.

ZONE 2 — OPTIONAL FIELDS
Behind a "+ Add details (optional)" toggle row that expands inline. Fields: Driver Name (text), Vehicle Number (text), Notes (multiline). These are fully optional and never block Save.

BEHAVIORS
- Selecting a Party refreshes the Lot Number suggestion (re-run increment for that party's last lot number).
- In edit mode: if the lot has any linked inward or delivery records, Party and Product fields become read-only (greyed, with a lock icon and tooltip "Cannot change — lot has movements").
- In edit mode: Lot Number field is locked by default. User must tap a lock icon to unlock it, which shows an inline warning: "Changing lot number affects all linked records. Confirm?" with inline Confirm/Cancel. Field unlocks only after Confirm.
- Save creates the lot, navigates back to the originating screen, and shows a success toast with the lot number.

VALIDATION
- Party, Product, Location: required; show error on blur if empty.
- No. of Bags: required, must be a positive integer; show error on blur.
- Lot Number: required, must be unique; async uniqueness check on blur; show error "Lot number already exists" if taken.

DESKTOP DIFFERENCES
- Party and Product use inline autocomplete combobox (not full-screen picker).
- No. of Bags and Location render side by side (2-column row).
- Zone 2 is expanded by default on viewports taller than 768px.

MOBILE/ANDROID
- Numeric keypad for No. of Bags.
- Haptic feedback: medium impact on successful save, error notification on validation failure.
- Sticky footer stays above keyboard using KeyboardAvoidingView.
```

---

---

# Form 2: Charges Receivable

## Spec

### Entry Points
- Lot Detail screen → "Add Charge"
- Delivery Detail screen → "Add Charge" (charge on stock movement)
- Charges list screen → FAB

### Screen Title
- Create: "New Charge"
- Edit: "Edit Charge"

### Zone 1 — Required Fields

| Field | Type | Validation |
|-------|------|------------|
| Party | Selector (code + name) | Required; auto-filled if entered from Lot or Delivery context |
| Lot | Selector (filtered by party) | Required; auto-filled if entered from Lot or Delivery context |
| Movement | Selector: Inward / Delivery | Required; indicates which stock movement this charge applies to; auto-filled from context |
| Charge Type | Selector | Required; options: Hamali, Mamulle, Kata-coolie, Rent, Other |
| Applicable Bags | Numeric integer | Required; default behavior by charge type (see below); must be > 0 and ≤ lot total bags |
| Rate (per bag) | Decimal | Required, > 0 |
| Amount | Decimal, derived | Derived = Applicable Bags × Rate; displayed as read-only calculated value; user can unlock to override |

### Charge Type → Applicable Bags Default Rules
- **Hamali**: defaults to lot total bags; editable
- **Mamulle**: defaults to lot total bags; editable
- **Kata-coolie**: prompts user to enter weighed bags (no default); field label changes to "Weighed Bags"
- **Rent**: not applicable here (rent is a separate accrual); if selected, show inline note "Rent is auto-accrued. Use this only for manual adjustments."
- **Other**: user enters applicable bags manually

### Zone 2 — Optional Fields

| Field | Type | Notes |
|-------|------|-------|
| Notes | Multiline text | — |

### Behaviors
- When Charge Type changes, Applicable Bags field is reset and re-defaulted per the rules above
- Amount auto-recalculates whenever Applicable Bags or Rate changes
- Amount can be manually overridden: tap lock icon → field becomes editable → label shows "Manual override"
- Context entry (from Lot or Delivery): Party, Lot, and Movement fields are pre-filled and locked; user skips directly to Charge Type
- Charge applies to a specific movement — if the lot has both an inward and one or more deliveries, Movement selector shows all applicable movement events with date and type

### States
- **Loading**: party/lot selector caches
- **Offline**: fully functional
- **Calculated amount**: visually distinct (grey background, lock icon), recalculates live

### Desktop Differences
- Party and Lot use inline autocomplete combobox
- Applicable Bags and Rate render side-by-side; Amount renders full-width below them

---

## Cursor Prompt

```
Build the New Charge / Edit Charge (Charges Receivable) screen for GrowCold.

Follow all patterns in GrowCold_Form-Design-Best-Practices_v2.md.

Screen requirements:

NAVIGATION
- Accessible from: Lot Detail "Add Charge" button, Delivery Detail "Add Charge" button, Charges list FAB.
- Full-screen stack screen. Header: back arrow + "New Charge" or "Edit Charge".
- Sticky footer: Cancel + Save (Save disabled until all Zone 1 fields are filled).

CONTEXT AUTO-FILL
When entering from a Lot Detail or Delivery Detail screen, Party, Lot, and Movement are pre-filled and locked (read-only, shown as chips). User lands directly at the Charge Type field.

ZONE 1 — REQUIRED FIELDS
1. Party: selector (code + name). Auto-filled and locked if entered from context.
2. Lot: selector filtered by selected party. Auto-filled and locked if entered from context.
3. Movement: selector showing the movement events on the lot (Inward with date, or Delivery with date). Auto-filled and locked if entered from context.
4. Charge Type: selector with options: Hamali, Mamulle, Kata-coolie, Rent, Other.
5. Applicable Bags: numeric integer. Label and default value depend on charge type:
   - Hamali / Mamulle: label "No. of Bags", defaults to lot total bags, editable.
   - Kata-coolie: label "Weighed Bags", no default, user must enter.
   - Other: label "No. of Bags", no default.
   - Rent: show an inline note "Rent is auto-accrued. Use manual adjustment only." and allow entry.
   Validation: must be > 0 and ≤ lot total bags.
6. Rate (per bag): decimal input with ₹ prefix. Required, must be > 0.
7. Amount: derived field (Applicable Bags × Rate). Shown as a read-only calculated input (grey background, lock icon). User can tap lock icon to override manually; when overridden, show "Manual override" label.

ZONE 2 — OPTIONAL
Notes: multiline text input.

BEHAVIORS
- When Charge Type changes, reset Applicable Bags and re-apply the default logic above.
- Amount recalculates live as Applicable Bags or Rate changes.
- Manual override of Amount disables live recalculation for that session; re-locking the field resumes calculation.

VALIDATION
- All Zone 1 fields required.
- Applicable Bags: positive integer, ≤ lot total bags; show error on blur.
- Rate: positive decimal; show error on blur.
- Amount (if manually overridden): must be > 0.

DESKTOP DIFFERENCES
- Party, Lot, Movement use inline autocomplete / select combobox.
- Applicable Bags and Rate render side by side; Amount renders full-width below.
```

---

---

# Form 3: Charges Paid to Labor

## Spec

### Entry Points
- Lot Detail screen → "Add Labor Charge"
- Delivery Detail screen → "Add Labor Charge"
- Operational labor charges list → FAB

### Screen Title
- Create: "Labor Charge"
- Edit: "Edit Labor Charge"

### Zone 1 — Required Fields

| Field | Type | Validation |
|-------|------|------------|
| Lot | Selector | Required; auto-filled from context |
| Movement | Selector: Inward / Delivery event | Required; shows all movement events for the lot with date; auto-filled from context |
| Charge Type | Selector | Required; options: Hamali, Mamulle, Kata-coolie, Other |
| Amount Paid | Decimal | Required, > 0 |
| Payment Method | Selector | Required; options: Cash, UPI, Other |

### Zone 2 — Optional Fields

| Field | Type | Notes |
|-------|------|-------|
| Worker / Recipient Name | Text | — |
| Notes | Multiline text | — |

### Behaviors
- Context entry (from Lot or Delivery): Lot and Movement pre-filled and locked
- This is an expense record (money going out to labor), distinct from Charges Receivable (money coming from customer)
- No rate × bags calculation — labor charges are entered as a lump amount per movement

### States
- Offline: fully functional
- Context pre-fill: user lands at Charge Type field

### Desktop Differences
- Amount and Payment Method render side-by-side
- Lot and Movement use inline combobox

---

## Cursor Prompt

```
Build the Labor Charge screen for GrowCold.

This form records payments made to labor for a specific stock movement (inward or delivery). It is distinct from Charges Receivable (which are charges billed to the customer). Labor charges are expenses paid out.

Follow all patterns in GrowCold_Form-Design-Best-Practices_v2.md.

NAVIGATION
- Accessible from: Lot Detail "Add Labor Charge" button, Delivery Detail "Add Labor Charge" button, labor charges list FAB.
- Full-screen stack. Header: back arrow + "Labor Charge" or "Edit Labor Charge".
- Sticky footer: Cancel + Save.

CONTEXT AUTO-FILL
When entering from Lot Detail or Delivery Detail, Lot and Movement are pre-filled and locked (shown as read-only chips). User lands at Charge Type.

ZONE 1 — REQUIRED FIELDS
1. Lot: selector. Auto-filled and locked from context.
2. Movement: selector showing movement events (Inward + date, or each Delivery + date) for the selected lot. Auto-filled from context.
3. Charge Type: selector — Hamali, Mamulle, Kata-coolie, Other.
4. Amount Paid: decimal input with ₹ prefix. Required, must be > 0.
5. Payment Method: selector — Cash, UPI, Other.

ZONE 2 — OPTIONAL
Worker / Recipient Name: text. Notes: multiline text.

VALIDATION
- All Zone 1 fields required.
- Amount Paid: must be a positive number; show error on blur.

DESKTOP DIFFERENCES
- Lot and Movement use inline combobox.
- Amount Paid and Payment Method render side by side.
```

---

---

# Form 4: Delivery

## Spec

### Entry Points
- Lot Detail screen → FAB "Add Delivery"
- Party Detail screen → speed-dial FAB → "Add Delivery"
- Deliveries list → FAB

### Screen Title
"Record Delivery"

### Zone 1 — Required Fields

| Field | Type | Validation |
|-------|------|------------|
| Party | Selector (code + name) | Required; auto-filled if entered from Party or Lot context |
| Lot | Selector filtered by Party | Required; shows: Lot No., Product, Total Bags, Remaining Bags; auto-filled from Lot context |
| Bags to Deliver | Numeric integer | Required; > 0; ≤ lot.remaining_bags |

### Outstanding Dues Card (inline, appears after Lot is selected)
Shown between Zone 1 and Zone 2. Not a form field — informational only.
```
Outstanding for [Party Name]
  Rent accrued:          ₹ X
  Charges pending:       ₹ Y
  Total outstanding:     ₹ Z
```
- Amber background card
- User can still proceed regardless of outstanding amount
- If outstanding = 0, do not show the card

### Zone 2 — Optional Fields (collapsed by default)

| Field | Type | Notes |
|-------|------|-------|
| Charges Receivable | Inline sub-section | Add one or more charge records for this delivery; uses the same fields as Form 2 but inline (Charge Type, Applicable Bags, Rate, Amount) |
| Labor Charges | Inline sub-section | Add one or more labor charge records; uses the same fields as Form 3 inline (Charge Type, Amount, Payment Method) |
| Notes | Multiline text | — |

### Inline Sub-sections (Zone 2)
Each sub-section has:
- A collapsed header: "+ Add charge receivable" / "+ Add labor charge"
- Tapping adds an inline row with the fields listed above
- Multiple rows can be added (one per charge type)
- Each row has a `✕` to remove it

### Behaviors
- Remaining bags in lot updates live as Bags to Deliver is entered (show preview: "47 of 200 remaining")
- Delivery is blocked (Save disabled) if lot.remaining_bags = 0 — show "Lot fully delivered" label
- After save: lot.remaining_bags is decremented; navigate back to originating screen; toast "Delivery recorded"

### States
- **Lot fully delivered**: Lot selector shows the lot but Save is disabled with explanation
- **Offline**: fully functional; remaining bags calculation uses local cache
- **Outstanding dues card**: only shown when outstanding > 0

### Desktop Differences
- Party and Lot use inline autocomplete combobox
- Outstanding dues card renders as a side panel or info box to the right of the form (not below) if viewport > 1024px; otherwise renders inline below Zone 1
- Bags to Deliver has a live remaining count label to its right: "/ 200 remaining"

---

## Cursor Prompt

```
Build the Record Delivery screen for GrowCold.

Follow all patterns in GrowCold_Form-Design-Best-Practices_v2.md.

NAVIGATION
- Accessible from: Lot Detail FAB, Party Detail speed-dial FAB, Deliveries list FAB.
- Full-screen stack. Header: back arrow + "Record Delivery".
- Sticky footer: Cancel + Save. Save is disabled if the selected lot has 0 remaining bags.

CONTEXT AUTO-FILL
- From Lot Detail: Lot and Party are pre-filled and locked.
- From Party Detail: Party is pre-filled and locked; Lot selector is filtered to that party.

ZONE 1 — REQUIRED FIELDS
1. Party: selector (code + name). Mobile: full-screen picker. Desktop: inline combobox. Auto-filled and locked from context.
2. Lot: selector filtered by party. Each row shows: Lot No. — Product (Remaining/Total bags). Mobile: full-screen picker. Desktop: inline combobox. Auto-filled from context. If the lot has 0 remaining bags, show "Lot fully delivered" inline and disable Save.
3. Bags to Deliver: numeric integer. Required, > 0, ≤ lot remaining bags. Show live label to the right of the field: "/ [remaining] remaining". Show validation error on blur if > remaining bags.

OUTSTANDING DUES CARD
After Lot is selected, if the party has any outstanding accruals (rent or charges), show an amber info card between Zone 1 and Zone 2:
- Lines: Rent accrued ₹X, Charges pending ₹Y, Total outstanding ₹Z
- Informational only — does not block save
- Do not show the card if outstanding = 0

ZONE 2 — OPTIONAL (collapsed by default)
Behind "+ Add details (optional)" toggle. Contains two inline sub-sections:

1. Charges Receivable sub-section:
   - Toggle: "+ Add charge receivable"
   - Each added row: Charge Type (selector) | Applicable Bags (numeric) | Rate (₹ decimal) | Amount (derived, overridable) | ✕ remove
   - Can add multiple rows (one per charge type)
   - Applicable Bags and Amount follow the same defaulting rules as Form 2

2. Labor Charges sub-section:
   - Toggle: "+ Add labor charge"
   - Each added row: Charge Type (selector) | Amount Paid (₹ decimal) | Payment Method (selector) | ✕ remove

3. Notes: multiline text input.

VALIDATION
- Party, Lot: required.
- Bags to Deliver: required, positive integer, ≤ lot remaining bags.
- In inline charge rows: all fields within a started row must be complete before Save is allowed.

BEHAVIORS
- Remaining bags preview updates live as Bags to Deliver is typed.
- On successful save: decrement lot remaining bags locally, navigate back, show toast "Delivery recorded".

DESKTOP DIFFERENCES
- Party and Lot: inline autocomplete combobox.
- Outstanding dues card: renders as a side info box to the right on viewports > 1024px; inline below Zone 1 on smaller.
- Bags to Deliver and remaining count label render on the same row.
```

---

---

# Form 5: Operational Payment

## Spec

### Entry Points
- Payments list → FAB
- Lot Detail → "Add Payment" (optional context link)

### Screen Title
- Create: "New Payment"
- Edit: "Edit Payment"

### Zone 1 — Required Fields

| Field | Type | Validation |
|-------|------|------------|
| Date | Date (default today) | Required; DD/MM/YYYY |
| Payment Type | Selector | Required; options: Labor – Hamali, Labor – Mamulle, Labor – Kata-coolie, Transport, Maintenance, Miscellaneous |
| Amount | Decimal | Required, > 0 |
| Payment Method | Selector | Required; options: Cash, UPI, NEFT, Other |
| Status | Selector | Required; options: Paid, Pending |

### Zone 2 — Optional Fields

| Field | Type | Notes |
|-------|------|-------|
| Recipient Name | Text | Person or vendor paid |
| Recipient Phone | Text | 10-digit Indian mobile |
| Lot Reference | Selector (Lot) | Link to a specific lot if applicable |
| Delivery Reference | Selector (Delivery) | Link to a specific delivery event if applicable |
| Notes | Multiline text | — |

### Behaviors
- Date defaults to today on create; user can change
- Status defaults to "Paid" since most payments are recorded post-facto; user can change to "Pending" for scheduled/future payments
- Lot and Delivery references in Zone 2 are independent (either or both can be set); Delivery selector shows only deliveries for the selected Lot if Lot is also set

### States
- Offline: fully functional
- Edit: all fields editable

### Desktop Differences
- Date, Payment Type render in a 2-column row
- Amount, Payment Method render in a 2-column row
- Status renders full-width

---

## Cursor Prompt

```
Build the New Payment / Edit Payment (Operational Payment) screen for GrowCold.

This form records operational expenses: payments to labor, transport, maintenance, or miscellaneous costs. It is not customer billing.

Follow all patterns in GrowCold_Form-Design-Best-Practices_v2.md.

NAVIGATION
- Accessible from: Payments list FAB, optionally from Lot Detail.
- Full-screen stack. Header: back arrow + "New Payment" or "Edit Payment".
- Sticky footer: Cancel + Save.

ZONE 1 — REQUIRED FIELDS
1. Date: date input, defaults to today (DD/MM/YYYY). Required.
2. Payment Type: selector — Labor – Hamali, Labor – Mamulle, Labor – Kata-coolie, Transport, Maintenance, Miscellaneous.
3. Amount: decimal input with ₹ prefix. Required, > 0.
4. Payment Method: selector — Cash, UPI, NEFT, Other.
5. Status: selector — Paid (default), Pending.

ZONE 2 — OPTIONAL (collapsed by default)
- Recipient Name: text input.
- Recipient Phone: text input, 10-digit Indian mobile format.
- Lot Reference: lot selector (optional link to a lot).
- Delivery Reference: delivery selector (filtered to selected lot if a lot is selected; otherwise shows all deliveries). Optional.
- Notes: multiline text.

VALIDATION
- Date: required, valid date.
- Payment Type, Payment Method, Status: required selectors.
- Amount: required, positive decimal; error on blur.
- Recipient Phone (if entered): must be 10 digits; error on blur.

BEHAVIORS
- Status defaults to "Paid" on create.
- If Lot Reference is set in Zone 2, the Delivery Reference selector is filtered to deliveries on that lot.

DESKTOP DIFFERENCES
- Date and Payment Type render side by side (2-column row).
- Amount and Payment Method render side by side.
- Status renders full-width.
- Lot and Delivery Reference in Zone 2 use inline combobox.
```

---

---

# Form 6: Customer Receipt + Allocation

## Spec

### Entry Points
- Receipts list → FAB
- Party Detail → speed-dial FAB → "Add Receipt"

### Screen Title
- Create: "Collect Payment"
- Edit: "Edit Receipt"

### Phase 1 — Receipt Capture (Zone 1)

| Field | Type | Validation |
|-------|------|------------|
| Date | Date (default today) | Required; DD/MM/YYYY |
| Party | Selector (code + name) | Required |
| Amount Received | Decimal | Required, > 0 |
| Payment Method | Selector | Required; options: Cash, UPI, NEFT, Cheque |

### Phase 1 — Optional Fields (Zone 2, collapsed)

| Field | Type | Notes |
|-------|------|-------|
| Reference Number | Text | Cheque number, UPI transaction ID, etc. |
| Notes | Multiline text | — |

### Phase 2 — Allocation Panel (appears after Party + Amount are filled)

The allocation panel renders **below Zone 2** in the same screen. It is not a separate step or navigation.

**Header row:** "Allocate ₹[amount] →  ₹[allocated] applied"

**Auto-allocation on load:**
- System fetches all outstanding accruals for the selected party
- Applies FIFO (oldest accrual date first)
- Pre-fills the list with allocated amounts
- All rows except the last (where `remaining_receipt < accrual_amount`) are fully allocated and read-only
- The last partial row: allocated amount is editable, pre-filled with the remaining receipt balance
- If the receipt covers all outstanding: all rows fully allocated, balance = 0, show "Fully cleared ✓"

**Allocation list row:**
```
Lot No.  |  Type (Rent / Hamali / ...)  |  Due: ₹X  |  Applied: ₹Y
```

**Footer of allocation panel:**
```
Total applied:   ₹ Y
Unapplied:       ₹ Z  (→ saved as unapplied credit)
[Confirm Allocation]
```

**Behaviors:**
- If the user changes Amount Received after the panel is shown: re-run FIFO and refresh the list
- If the party has no outstanding accruals: show "No outstanding dues for this party. Full amount saved as credit."
- Unapplied balance is automatically saved as unapplied credit against the party — no action needed from user
- "Confirm Allocation" is a second save step: pressing it finalizes the allocation. The receipt itself is saved on the main Save button.
- On save (receipt only, no allocation confirmed): receipt is saved, allocation remains as draft/pending
- User can return to a receipt and confirm allocation later if they exit before confirming

### Validation

- Date, Party, Amount Received, Payment Method: all required
- Amount Received: positive decimal
- Allocation total must not exceed Amount Received (hard block on Confirm Allocation)
- Partial allocation: only the last row's applied amount is editable; cannot exceed that row's due amount
- Reference Number (if entered): no format validation, free text

### States
- **No outstanding accruals**: show message, no allocation panel rows
- **Fully allocated**: show green "Fully cleared ✓" banner
- **Partially allocated**: show unapplied credit amount
- **Offline**: Phase 1 (receipt capture) fully functional. Allocation panel shows cached accruals with a note "Accruals from last sync"

### Desktop Differences
- Date and Party render side-by-side (2-column)
- Amount and Payment Method render side-by-side
- Allocation panel can render in a right-side panel on viewports > 1024px (side-by-side with the receipt form)

---

## Cursor Prompt

```
Build the Collect Payment (Customer Receipt + Allocation) screen for GrowCold.

This is the most complex form in the app. It has two phases on a single screen: capturing the receipt, then reviewing and confirming the FIFO-auto-allocated distribution against outstanding dues.

Follow all patterns in GrowCold_Form-Design-Best-Practices_v2.md.

NAVIGATION
- Accessible from: Receipts list FAB, Party Detail speed-dial FAB.
- Full-screen stack. Header: back arrow + "Collect Payment" (create) or "Edit Receipt" (edit).
- Sticky footer: Cancel + Save. Save commits the receipt record only.
- A separate "Confirm Allocation" button appears within the allocation panel (not in the footer).

PHASE 1 — RECEIPT CAPTURE

Zone 1 (required):
1. Date: date input, defaults to today (DD/MM/YYYY).
2. Party: selector (code + name). Mobile: full-screen picker. Desktop: inline combobox. Auto-filled and locked if entered from Party Detail context.
3. Amount Received: decimal input with ₹ prefix. Required, > 0.
4. Payment Method: selector — Cash, UPI, NEFT, Cheque.

Zone 2 (optional, collapsed by default):
- Reference Number: text (cheque number, UPI ref, etc.).
- Notes: multiline text.

PHASE 2 — ALLOCATION PANEL

The allocation panel appears on the same screen, below Zone 2, as soon as both Party and Amount Received are filled. It does not require saving first.

Panel header:
  "Allocate ₹[amount received]"
  Running total below: "₹[allocated] applied of ₹[amount received]"

Auto-allocation logic (run client-side using cached accruals data):
- Fetch all outstanding accruals for the selected party, sorted by accrual date ascending (FIFO).
- Walk the list: assign the full accrual amount to each row until the receipt amount is exhausted.
- The last row where remaining_receipt < accrual_amount gets a partial allocation equal to the remaining balance.
- All rows except this last partial row are fully allocated and read-only.
- The last partial row shows an editable "Applied" amount, pre-filled with the remaining balance.

Allocation list row layout (one row per accrual):
  Lot No. | Type (Rent / Hamali / Mamulle / Kata-coolie) | Due: ₹X | Applied: ₹Y [editable if last partial row]

Panel footer:
  Total applied: ₹Y
  Unapplied (credit): ₹Z
  [Confirm Allocation] button — primary, full-width within the panel

Confirm Allocation behavior:
- Validates that total allocated ≤ amount received (hard block if not).
- On confirm: finalizes allocation records, shows "Allocation confirmed ✓" replacing the panel.
- Unapplied balance is automatically recorded as unapplied credit against the party.

BEHAVIORS
- If Party or Amount changes after the panel is shown: re-run FIFO and refresh the panel.
- If party has no outstanding accruals: show "No outstanding dues. Full amount saved as credit." — no allocation rows.
- If the receipt covers all accruals exactly: show "Fully cleared ✓" after confirmation.
- User can save the receipt (Phase 1) and return later to confirm allocation. Receipt status shows "Allocation pending" until confirmed.

VALIDATION
- Date, Party, Amount Received, Payment Method: required, show errors on blur.
- Amount Received: positive decimal.
- Allocation total must not exceed Amount Received — show error inline in the panel footer if it does; disable Confirm Allocation.
- Partial row applied amount: must be > 0 and ≤ that row's due amount.

DESKTOP DIFFERENCES
- Date + Party render side by side (2-column).
- Amount Received + Payment Method render side by side.
- On viewports > 1024px: allocation panel renders as a right-side panel beside the receipt form, not below it.

OFFLINE
- Phase 1 (receipt capture) is fully functional offline.
- Allocation panel uses cached accruals. Show a subtle note: "Accruals shown from last sync."
```

---

*v1 — May 2026*
