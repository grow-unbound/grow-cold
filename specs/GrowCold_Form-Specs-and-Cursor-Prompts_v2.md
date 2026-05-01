# GrowCold — Form Specs & Cursor Prompts v2

> One doc per form: independent spec + requirements-level cursor prompt.  
> All forms follow `GrowCold_Form-Design-Best-Practices_v2.md`.  
> No code or schema included here — cursor prompts are requirements-level only.
>
> v2 changes from v1:
> - Form 1: Location is now multiselect from locations table (Lot); read-only location chips on Delivery
> - Form 2: Renamed "Add Charges"; pre-loaded charge type rows; rate as hint; inline labor per row; totals shown; Form 3 merged in
> - Form 3: Removed (merged into Form 2)
> - Form 3 (renumbered from 4): Delivery — charges section follows Form 2 pattern
> - Form 4 (renumbered from 5): Operational Payment — unchanged
> - Form 5 (renumbered from 6): Add Receipt — mobile 2-step flow; desktop side-by-side; responsive cards; icons + colors

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
| Party | Selector (code + name) | Required |
| Product | Selector | Required |
| No. of Bags | Numeric integer | Required, > 0 |
| Lot Number | Text, auto-suggested | Required; unique across all lots; suggest as `[incrementing 6-digit number]/[No. of Bags]`; user may override e.g. 11245/85 where the lot has 85 bags in the lodgement |
| Locations | Multiselect from locations table | Required; at least 1 location; e.g. "A1/123", "B3/125" where A1 and B1 are chamberA-1stFloor or chamberB-3rdFloor, and location number is 123 or 125 in that chamber-floor |

### Zone 2 — Optional Fields (collapsed by default)

| Field | Type | Notes |
|-------|------|-------|
| Driver Name | Text | — |
| Vehicle Number | Text | Indian vehicle number format, not validated strictly |
| Notes | Multiline text | — |

### Locations Field Behavior
- Locations are fetched from a `locations` table (warehouse-specific, pre-configured by the owner)
- On mobile: full-screen multiselect picker; shows all available locations; tap to toggle selected; selected locations shown as chips on the field
- On desktop: inline multiselect combobox with chip display
- A lot can occupy multiple locations (e.g. split across two cold rooms)
- Selected chips are removable by tapping ✕ on each chip
- Minimum 1 location required for save

### Other Behaviors
- Party selection triggers Lot Number suggestion refresh (re-run increment logic for that party)
- Lot Number shows `✏ suggested` label when auto-filled; label disappears once user edits manually
- **Edit mode**: Lot Number locked by default; unlock requires inline confirmation — "Changing lot number once created is not suggested. Confirm?"
- **Edit mode**: Party and Product locked by default; unlock requires inline confirmation - "Changing party or product once created is not suggested. Confirm?"
- On save (create): navigate back to originating screen; toast "Lot [number] created"
- On save (edit): navigate back to Lot Detail; toast "Lot updated"

### States
- Loading: skeleton on Zone 1 fields while data loads from cache
- Offline: all fields functional; Lot Number increment and locations list from local cache
- Error: stay on form, show inline error below footer

### Desktop Differences
- Party and Product use inline autocomplete combobox
- Locations use inline multiselect combobox with chip display
- Zone 2 visible by default on viewports > 768px
- No. of Bags and Lot Number render side-by-side

---

## Cursor Prompt

```
Build the New Lot / Edit Lot screen for the GrowCold mobile and web app.

Follow all patterns in GrowCold_Form-Design-Best-Practices_v2.md.

NAVIGATION
- Accessible from: Lots list FAB, Party Detail speed-dial FAB, Lot Detail ⋮ menu (edit).
- Full-screen stack. Header: back arrow + "New Lot" or "Edit Lot". No header actions.
- Sticky footer: Cancel (left) + Save (right). Save disabled until all Zone 1 required fields are filled.

ZONE 1 — REQUIRED FIELDS
1. Party: selector (code + name). Mobile: full-screen search picker with recent parties at top. Desktop: inline autocomplete combobox. Required.
2. Product: selector. Mobile: full-screen picker. Desktop: inline combobox. Required.
3. No. of Bags: numeric integer input with "bags" suffix. Required, > 0.
4. Lot Number: text input. Auto-suggested based on last lot number for the warehouse (increment sequence) and No. of bags lodged (in the format 12345/300 where 12345 is next increment and 300 bags are lodged). Show "suggested" label when auto-filled; label clears when user edits. Required. Async uniqueness check on blur — show "Lot number already exists" if taken.
5. Locations: multiselect from the warehouse's locations table.
   - Mobile: tapping opens a full-screen multiselect picker listing all available locations; tap to toggle; selected items shown as removable chips in the field.
   - Desktop: inline multiselect combobox — type to filter, select to add chip, ✕ to remove.
   - At least 1 location required.

ZONE 2 — OPTIONAL FIELDS
Behind a "+ Add details (optional)" toggle. Expands inline. Fields: Driver Name (text), Vehicle Number (text), Notes (multiline). Never block Save.

BEHAVIORS
- Selecting a Party refreshes the Lot Number suggestion.
- Edit mode: if lot has any inward or delivery records, Party and Product are read-only (greyed, lock icon; tap shows "Cannot change — lot has movements").
- Edit mode: Lot Number is locked. User taps lock icon → inline prompt "Changing lot number affects all linked records. Confirm?" with Confirm / Cancel inline. Unlocks only after Confirm.
- On successful save: navigate back to originating screen, show success toast with lot number.

VALIDATION
- Party, Product: required; error on blur if empty.
- No. of Bags: required, positive integer; error on blur.
- Lot Number: required, must be unique (async check on blur).
- Locations: at least 1 must be selected; error on blur if none.

DESKTOP DIFFERENCES
- Party, Product, Locations: inline combobox (not full-screen pickers).
- No. of Bags and Lot Number render side by side.
- Zone 2 expanded by default on viewports > 768px.

MOBILE/ANDROID
- Numeric keypad for No. of Bags.
- Haptics: medium impact on save success, error notification on validation failure.
- Sticky footer above keyboard via KeyboardAvoidingView.
```

---

---

# Form 2: Add Charges

> Covers both Charges Receivable (from customer) and Charges Paid to Labor (expense).  
> Form 3 from v1 is removed — labor charges are now inline within each charge type row.

## Spec

### Entry Points
- Lot Detail screen → "Add Charges" button
- Delivery Detail screen → "Add Charges" button

### Screen Title
"Add Charges"

### Context Header (read-only, always visible)
```
Party:    RC/AMP — Raju Cold Store    [locked]
Lot:      12345/300                   [locked]
Movement: Lodgement ▼
Date:     23/04/2026
```
Party and Lot are always auto-filled from context and locked. Movement defaults based on entry point; user can change if the lot has multiple movements. Update Date based on movement - lodgement_date or delivery_date

### Movement Field
- Label: "Movement"
- Options: **Lodgement** (inward), **Delivery** (outward)
- If "Delivery" is selected and the lot has multiple delivery events, a second selector appears: "Select delivery" — shows list of deliveries with date and bags delivered
- Auto-set to context entry point (Lodgement if from Lot Detail; Delivery if from Delivery Detail)

### Charge Rows (pre-loaded, not added one by one)
All active charge types are pre-loaded as rows. Rent is excluded. Default charge types:

| Charge Type | Applicable Bags Default | Rate Source | Labor Column |
|-------------|------------------------|-------------|--------------|
| Hamali | `lot.total_bags` | From rates table — shown as hint | Yes |
| Mamulle | `lot.total_bags` | From rates table — shown as hint | Yes |
| Kata-coolie | `0` — user must enter weighed bags | From rates table — shown as hint | Yes |
| Transport | N/A (flat amount, no bags) | — | No |

Each row has two sub-rows:
1. **Receivable**: bags (editable) → calculated amount (bags × rate, overridable)
2. **Labor paid**: amount (editable) + payment method selector

**Rate** is shown as hint text below the charge type name (e.g. `₹10/bag`) — not an editable field.

### Totals Row (always visible, below all charge rows)
```
Total Receivable:   ₹2,400
Total Paid to Labor:    ₹0
```
Recalculates live as any amount changes.

### Mobile Layout (cards)
Each charge type renders as a card:
```
┌────────────────────────────────┐
│ HAMALI                  ₹10/bag│
│ Bags                    [200]  |
| Receivable              ₹2,000 │
│ Paid      [Cash]         ₹[ 0 ]│
└────────────────────────────────┘
```
- Green ↑ indicator when receivable > paid (normal state)
- Red ↓ indicator when paid > receivable (unusual; flag to user)
- Transport card: no bags field; shows Receivable Amount input directly

### Desktop Layout (inline table)
```
Charge    | Bags  | Rate    | Receivable | Paid    | Method   | Diff
─────────────────────────────────────────────────────────────────────
Hamali    | [200] | ₹10/bag | ₹ 2,000    | ₹ [0]   | [Cash▼]  | ₹2,000 ↑
Mamulle   | [200] | ₹2/bag  | ₹ 400      | ₹ [0]   | [Cash▼]  | ₹400 ↑
Kata-cool | [  0] | ₹5/bag  | ₹ 0        | ₹ [0]   | [Cash▼]  | ₹0
Transport |   —   |    —    | ₹ [  0  ]  | -       |    —     | ₹0
─────────────────────────────────────────────────────────────────────
TOTAL                        ₹ 2,400     ₹ 0                 ₹2,400 ↑
```

### Validation
- At least one charge must have a non-zero receivable or paid amount (otherwise save is blocked: "No charges entered")
- Applicable Bags (Hamali, Mamulle): must be ≤ lot.total_bags; error shown inline on the card/row
- Kata-coolie applicable bags: must be ≤ lot.total_bags; 0 is allowed (means not charged)
- Transport amount: must be ≥ 0
- Paid amounts: must be ≥ 0 (0 is valid — means not yet paid to labor)
- Payment method required for any row where paid > 0

### States
- Loading: shimmer cards while rates load from cache
- Offline: fully functional; rates from local cache; show subtle "Rates from last sync" note
- All-zero state: Save button shows "No charges entered" tooltip until at least one amount > 0

---

## Cursor Prompt

```
Build the Add Charges screen for GrowCold.

This screen records both charges receivable from the customer and charges paid to labor, for a specific stock movement (Lodgement or Delivery). Both are handled together — labor charges are inline with each receivable charge type, not a separate form.

Follow all patterns in GrowCold_Form-Design-Best-Practices_v2.md.

NAVIGATION
- Accessible from: Lot Detail "Add Charges" button, Delivery Detail "Add Charges" button.
- Full-screen stack. Header: back arrow + "Add Charges". No header actions.
- Sticky footer: Cancel (left) + Save (right). Save disabled if all charge amounts are zero.

CONTEXT HEADER (always visible, read-only)
Show at the top of the screen before any input fields:
- Party: code + name (locked chip)
- Lot: lot number (locked chip)
- Movement: selector — options are "Lodgement" and "Delivery". Defaults based on entry point. If "Delivery" is selected and the lot has more than one delivery, show a second selector "Which delivery?" listing deliveries by date and bags delivered.

CHARGE TYPE ROWS (pre-loaded)
Do NOT use an "Add charge type" button. All charge types appear immediately as pre-loaded rows. The user fills in numbers — they do not add rows.

Pre-load the charge types from charge_types table in alphabetical order:
1. Hamali
2. Mamulle
3. Kata-coolie
4. Platform-Hamali
5. Transport

For each charge type (except Transport), show:
- Charge type name as row/card header, bold
- Rate hint below the name (e.g. "₹10/bag") — fetched from the rates table for this warehouse; shown as hint text, not an editable field
- Applicable Bags: numeric integer input
  - Hamali: pre-filled with lot.total_bags
  - Mamulle: pre-filled with lot.total_bags
  - Kata-coolie: pre-filled with 0; label is "Bags"
  - Platform-hamali: prefilled with 0: label is "Bags"
- Receivable Amount: derived = applicable_bags × rate; shown as calculated (read-only style); user can tap to override manually
- Paid to Labor: decimal input with ₹ prefix; default 0
- Payment Method: selector (Cash, UPI, Other); required only when paid > 0; otherwise greyed/hidden
- Difference indicator: Receivable − Paid; shown with green ↑ color when receivable > paid, red ↓ when paid > receivable

For Transport:
- No bags field, no rate hint
- Receivable Amount: free-entry decimal input with ₹ prefix; default 0
- No labor paid column for Transport

TOTALS SECTION (always visible, below all rows, above footer)
Show three lines, updating live:
- Total Receivable: ₹ [sum of all receivable amounts]
- Total Paid: ₹ [sum of all paid amounts]
- Net (Receivable − Paid): ₹ [difference] with green ↑ or red ↓ color indicator

MOBILE LAYOUT (cards)
Each charge type is a card. Within each card:
- Row 1: Charge type name (bold, left) + rate hint (right, muted)
- Row 2: Bags input (left) → arrow → Receivable amount (right, calculated)
- Row 3: Paid input (left) + Payment Method selector (right)
- Row 4: Diff label with color indicator (right-aligned)

DESKTOP LAYOUT (table)
Render as an inline table with columns: Charge Type | Bags | Rate | Receivable | Paid | Method | Diff.
Transport row spans the bags/rate columns with a dash. Totals row at the bottom of the table.

VALIDATION
- At least one charge must have a non-zero receivable or paid amount; otherwise show tooltip on Save "No charges entered".
- Applicable Bags: positive integer, ≤ lot.total_bags; inline error on the card/row if exceeded.
- Paid amounts: ≥ 0 (0 is valid).
- Payment Method: required if paid > 0 for that row; show inline error on blur.
- Receivable Amount (if manually overridden): must be ≥ 0.

BEHAVIORS
- Receivable amount recalculates live as bags or rate changes.
- When user manually overrides a receivable amount, show "Manual" label on that amount; tap to revert to calculated.
- Payment method field is hidden/greyed when paid = 0; becomes active when paid > 0.
- Difference updates live as either receivable or paid changes.

OFFLINE
- Rates loaded from local cache. Show subtle note "Rates from last sync" below context header if offline.
- All inputs and save work offline.
```

---

---

# Form 3: Record Delivery

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
| Party | Selector (code + name) | Required; auto-filled and locked from context |
| Lot | Selector filtered by Party | Required; shows Lot No., Product, Remaining/Total bags; auto-filled from Lot context |
| Delivered Bags | Numeric integer | Required; > 0; ≤ lot.remaining_bags |
| Locations | Multiselect (from lot.location_ids only) | Required; defaults to all of the lot's current locations; user can deselect if partial delivery from specific locations |

### Locations on Delivery
- Unlike the Lot form (which draws from the full locations table), Delivery locations are scoped to **only the locations where the lot is currently stored** (`lot.location_ids`)
- Pre-selected by default (all current lot locations)
- User can deselect to indicate which locations the bags are being removed from
- At least 1 location required

### Outstanding Dues Card (inline, after Lot selected)
Shown between Zone 1 and Zone 2. Amber background. Informational only — does not block save.
```
⚠  Outstanding — RC01 Raju Cold Store
   Rent:       ₹ 12,400
   Charges:    ₹  3,200
   Total due:  ₹ 15,600
```
Do not show if outstanding = 0.

### Zone 2 — Optional (collapsed by default)
Behind "+ Add details (optional)" toggle.

**Charges sub-section** (follows Form 2 pattern exactly):
- Pre-loaded charge type rows: Hamali, Mamulle, Kata-coolie, Transport, Platform Hamali
- Movement is auto-set to this delivery (no movement selector needed)
- Same card layout (mobile) / inline table layout (desktop) as Form 2
- Same rate hints, bags defaulting, labor paid inline, totals row

**Notes**: multiline text

### Behaviors
- Live remaining bags preview as user types: "47 of 200 remaining"
- Save disabled if lot.remaining_bags = 0 — show "Lot fully delivered" label, disable lot selector
- On save: decrement remaining bags, navigate back, toast "Delivery recorded"

### Validation
- Party, Lot: required
- Bags to Deliver: required, positive integer, ≤ lot.remaining_bags; show error on blur if exceeded
- Locations: at least 1 required
- Within charge rows (if any amount > 0): payment method required if labor paid > 0

### States
- Lot fully delivered: lot selectable but Save disabled with explanation
- Offline: fully functional; remaining bags and location data from local cache
- Deliveries are always created in "DELIVERED" status (no SCHEDULED for now)

### Desktop Differences
- Party and Lot use inline autocomplete combobox
- Locations use inline multiselect chips scoped to lot.location_ids
- Outstanding dues card renders as a side info box (right of form) on viewports > 1024px
- Bags to Deliver and remaining count on the same row
- Charges sub-section in Zone 2 uses table layout (same as Form 2 desktop)

---

## Cursor Prompt

```
Build the Record Delivery screen for GrowCold.

Follow all patterns in GrowCold_Form-Design-Best-Practices_v2.md.
The charges section within this form follows the same design as the "Add Charges" screen (Form 2) — pre-loaded rows, inline labor, rate hints, totals.

NAVIGATION
- Accessible from: Lot Detail FAB, Party Detail speed-dial FAB, Deliveries list FAB.
- Full-screen stack. Header: back arrow + "Record Delivery". No header actions.
- Sticky footer: Cancel + Save. Save disabled if lot has 0 remaining bags.

CONTEXT AUTO-FILL
- From Lot Detail: Party and Lot are pre-filled and locked.
- From Party Detail: Party is pre-filled and locked; Lot selector is filtered to that party.

ZONE 1 — REQUIRED FIELDS
1. Party: selector (code + name). Mobile: full-screen picker. Desktop: inline combobox. Auto-filled and locked from context.
2. Lot: selector filtered by party. Each row: Lot No. — Product (Remaining / Total bags). If lot has 0 remaining bags, show "Lot fully delivered" and disable Save. Mobile: full-screen picker. Desktop: inline combobox.
3. Bags to Deliver: numeric integer. Required, > 0, ≤ lot.remaining_bags. Show live label beside field: "/ [remaining] remaining". Error on blur if exceeded.
4. Locations: multiselect — scoped to lot.location_ids only (not the full locations table).
   - Pre-selected: all of the lot's current locations (default assumption: full delivery).
   - User can deselect locations to indicate partial location-specific delivery.
   - Mobile: full-screen multiselect picker showing only the lot's locations.
   - Desktop: inline multiselect chip selector scoped to lot.location_ids.
   - At least 1 location required.

OUTSTANDING DUES CARD
After Lot is selected, if outstanding accruals > 0 for the party, show an amber info card below Zone 1 with icon ⚠:
- Rent: ₹X
- Charges: ₹Y
- Total due: ₹Z
Informational only. Does not block save. Do not show if outstanding = 0.

ZONE 2 — OPTIONAL (collapsed by default)
Behind "+ Add details (optional)" toggle. Contains:

1. Charges sub-section — follows the Add Charges (Form 2) pattern:
   - Pre-loaded rows for Hamali, Mamulle, Kata-coolie, Transport (no movement selector — auto-set to this delivery).
   - Mobile: card layout. Desktop: inline table layout.
   - Rate hints, applicable bags defaulting, receivable amount calculation, inline labor paid + payment method, difference indicator — all same as Form 2.
   - Totals row (Total Receivable / Total Paid / Net) shown at bottom of the sub-section.
   - All charge amounts default to 0 and are optional; only validates payment method if labor paid > 0.

2. Notes: multiline text input.

VALIDATION
- Party, Lot, Locations: required.
- Bags to Deliver: required, positive integer, ≤ remaining bags.
- Charges (if entered): applicable bags ≤ lot.total_bags; payment method required if labor paid > 0.

BEHAVIORS
- Remaining bags preview updates live as Bags to Deliver is typed.
- On save: navigate back to originating screen; toast "Delivery recorded".

DESKTOP DIFFERENCES
- Party, Lot, Locations: inline combobox.
- Outstanding dues card renders as side panel on viewports > 1024px.
- Charges sub-section in Zone 2 uses table layout.
```

---

---

# Form 4: Operational Payment

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
| Payment Type | Selector | Required; options: load from payment_type table |
| Amount | Decimal | Required, > 0 |
| Payment Method | Selector | Required; options: use payment_method enum |
| Status | Selector | Required; Paid (default), Pending |

### Zone 2 — Optional Fields (collapsed by default)

| Field | Type | Notes |
|-------|------|-------|
| Recipient Name | Text | Person or vendor paid |
| Recipient Phone | Text | 10-digit Indian mobile |
| Lot Reference | Selector (Search/autocomplete) - follow lot-search on create Delivery | Link to a specific lot |
| Delivery Reference | Selector | Link to a delivery; filtered by Lot, require lot selection |
| Notes | Multiline text | — |

### Behaviors
- Date defaults to today on create
- Status defaults to "Paid"
- Delivery Reference scoped to selected Lot if Lot is set in Zone 2

### Desktop Differences
- Date + Payment Type side-by-side
- Amount + Payment Method side-by-side
- Lot and Delivery Reference in Zone 2 use inline combobox

---

## Cursor Prompt

```
Build the New Payment / Edit Payment (Operational Payment) screen for GrowCold.

This form records operational expenses — labor payments, transport, maintenance, miscellaneous. It is not customer billing.

Follow all patterns in GrowCold_Form-Design-Best-Practices_v2.md.

NAVIGATION
- Accessible from: Payments list FAB, optionally Lot Detail.
- Full-screen stack. Header: back arrow + "New Payment" or "Edit Payment".
- Sticky footer: Cancel + Save.

ZONE 1 — REQUIRED FIELDS
1. Date: date input, defaults to today (DD/MM/YYYY). Required.
2. Payment Type: selector — from payment_type table
3. Amount: decimal with ₹ prefix. Required, > 0.
4. Payment Method: selector — Cash, UPI, NEFT, Other. Required.
5. Status: selector — Paid (default), Pending. Required.

ZONE 2 — OPTIONAL (collapsed by default)
- Recipient Name: text.
- Recipient Phone: text, 10-digit Indian mobile.
- Lot Reference: lot selector.
- Delivery Reference: delivery selector; filtered to selected lot's deliveries if Lot Reference is set.
- Notes: multiline text.

VALIDATION
- Date, Payment Type, Payment Method, Status: required.
- Amount: required, positive decimal; error on blur.
- Recipient Phone (if entered): 10 digits; error on blur.

BEHAVIORS
- Status defaults to "Paid" on create.
- Delivery Reference is filtered to the selected Lot's deliveries when Lot Reference is filled.

DESKTOP DIFFERENCES
- Date + Payment Type side by side.
- Amount + Payment Method side by side.
- Lot and Delivery Reference use inline combobox.
```

---

---

# Form 5: Add Receipt + Allocation

## Spec

### Entry Points
- Receipts list → FAB
- Party Detail → speed-dial FAB → "Add Receipt"
- Receipt Detail → ⋮ → "Edit Receipt"

### Screen Titles
- Create: "Add Receipt" (matches FAB/button label exactly)
- Edit: "Edit Receipt"
- Allocation screen (mobile only, second step): "Allocate"

---

### Mobile Flow: Two Separate Steps

#### Step 1 — Add Receipt screen

Zone 1 (required):

| Field | Type | Validation |
|-------|------|------------|
| Date | Date (default today) | Required; DD/MM/YYYY |
| Party | Selector (code + name) | Required |
| Amount | Decimal | Required, > 0 |
| Payment Method | Selector | Required; Cash, UPI, NEFT, Cheque |

Zone 2 (optional, collapsed):

| Field | Type | Notes |
|-------|------|-------|
| Reference Number | Text | Cheque no., UPI ref, etc. |
| Notes | Multiline text | — |

On save: receipt is saved. A prompt appears:
```
┌────────────────────────────────┐
│  Receipt saved ✓               │
│  ₹ 15,000 received             │
│  Allocate against dues?        │
│  [Later]        [Allocate Now] │
└────────────────────────────────┘
```
- "Allocate Now" → navigates to Step 2 (Allocate screen)
- "Later" → navigates back; receipt shows "Allocation pending" status

#### Step 2 — Allocate screen (mobile, separate full-screen)

Header: back arrow + "Allocate" + party name subtitle

Auto-allocation (FIFO on outstanding accruals for the party):
- System pre-fills the list; user reviews and confirms
- All rows except the last partial row are fully allocated and read-only
- Last partial row (where remaining_receipt < accrual_amount): amount is editable, pre-filled with remaining balance

**Allocation list: card layout on mobile (not a table)**

Each accrual card:
```
┌──────────────────────────────────────┐
│ 📦 GC-RC01-047                       │
│    Rent  ·  Jan 2026                 │
│    Due ₹4,200    Applied ₹4,200  ✓  │
└──────────────────────────────────────┘
```
- Green ✓ with green "Applied" text = fully allocated
- Amber with editable amount field = partial (last row)
- Each icon reflects the charge type: 📦 Rent, 👷 Hamali/labor, 🚛 Transport, 💰 General

Totals section (sticky at bottom of list, above Confirm button):
```
Applied:     ₹ 14,200
Credit:      ₹    800  (saved as unapplied credit)
[Confirm Allocation]
```

On Confirm: allocation finalized; navigate back; toast "Allocation confirmed"

---

### Desktop Flow: Side-by-Side on One Screen

Left panel (560px max): Receipt form (same Zone 1 + Zone 2 as above)

Right panel: Outstanding accruals panel
- Appears as soon as Party is selected
- Shows all outstanding accruals for the party
- FIFO auto-allocation runs as soon as Amount is also filled
- List layout: more compact than mobile cards but still not a raw table — uses a list with icons and color coding
- Each row: icon + lot number + type + due amount + applied amount (color coded)
- Totals at bottom: Applied / Credit
- "Confirm Allocation" button at the bottom of the right panel
- Receipt Save (left footer) and Confirm Allocation (right panel) are independent actions

If party has no outstanding accruals: right panel shows "No outstanding dues for [party name]. Full amount will be saved as credit." in a muted state.

---

### Allocation List Design Principles
- **No raw tables on mobile** — use cards
- **On desktop** — compact list rows with icon, text, and amount columns; not a multi-column data table
- **Icons** convey type at a glance; text is secondary
- **Color coding**:
  - Green: fully applied
  - Amber: partial / last row
  - Muted grey: lot/date metadata (not actionable)
  - Red: over-allocation error state (hard block)

### Validation
- Date, Party, Amount, Payment Method: required
- Amount: positive decimal
- Allocation total must not exceed receipt amount (hard block on Confirm Allocation; inline error in totals row)
- Last partial row applied amount: > 0 and ≤ that accrual's due amount

### States
- No outstanding accruals: show message, no list/panel
- Fully covered: "Fully cleared ✓" in green after confirm
- Partially allocated: show unapplied credit amount in amber
- Offline (mobile Step 1): fully functional. Step 2: show "Accruals from last sync" subtle note; allocation still works from cache

---

## Cursor Prompt

```
Build the Add Receipt + Allocation flow for GrowCold.

Follow all patterns in GrowCold_Form-Design-Best-Practices_v2.md.

This flow has two distinct implementations: a two-step flow on mobile, and a side-by-side single-screen flow on desktop.

MOBILE FLOW — TWO STEPS

Step 1: "Add Receipt" screen
- Full-screen stack. Header: back + "Add Receipt".
- Sticky footer: Cancel + Save.
- Zone 1 (required):
  1. Date: date input, default today (DD/MM/YYYY).
  2. Party: selector (code + name). Mobile: full-screen picker. Auto-filled and locked from Party Detail context.
  3. Amount: decimal with ₹ prefix. Required, > 0.
  4. Payment Method: selector — Cash, UPI, NEFT, Cheque.
- Zone 2 (optional, collapsed): Reference Number (text), Notes (multiline).
- On save: save the receipt record. Show an inline prompt (bottom sheet or inline card — not a navigation):
    "Receipt saved ✓  ₹[amount] received
     Allocate against dues?
     [Later]    [Allocate Now]"
  - "Later": navigate back; receipt status = "Allocation pending".
  - "Allocate Now": navigate to Step 2.

Step 2: "Allocate" screen
- Full-screen stack. Header: back + "Allocate" + party name as subtitle.
- Sticky footer: [Confirm Allocation] (full width, primary button). Disabled until allocation is reviewed.
- Auto-run FIFO allocation logic on the party's outstanding accruals (sorted by accrual date, oldest first).
- Show results as a CARD LIST (not a table):
  Each card:
    - Icon representing charge type (see icon guide below) — left side
    - Lot number (bold) + charge type name + period (e.g. "Jan 2026") — center
    - Due amount (muted) + Applied amount (bold, color coded) — right side
    - Fully allocated rows: applied amount in green + ✓ icon. Read-only.
    - Last partial row (remaining_receipt < accrual_amount): applied amount is an editable input pre-filled with remaining balance. Amber color.
  Icon guide: Rent → 📦 or house icon; Hamali/Mamulle/Kata-coolie → person/worker icon; Transport → truck icon; General → coin icon.
- Totals sticky above the footer:
    Applied:  ₹ X
    Credit:   ₹ Y  (shown in amber if > 0, labelled "Saved as unapplied credit")
- On Confirm Allocation: finalize allocation records, navigate back, toast "Allocation confirmed".
- If party has no outstanding accruals: show empty state "No outstanding dues. Full ₹[amount] saved as credit." (unallocated) with Confirm button that just saves unapplied credit.

DESKTOP FLOW — SIDE BY SIDE

Single full-screen. Two-panel layout on viewports > 1024px.

Left panel (max 560px): Receipt form
- Same Zone 1 and Zone 2 as mobile Step 1.
- "Save Receipt" button in sticky footer of this panel.

Right panel: Allocation panel
- Appears as soon as Party is selected.
- Shows outstanding accruals for the party. FIFO auto-allocation runs when Amount is also filled.
- List layout: compact rows with icon (left) + lot + type + period (center) + due + applied (right).
  - Use color coding: green for fully applied rows, amber for partial row. Not a full data table.
- Totals at the bottom of the right panel: Applied / Credit.
- "Confirm Allocation" button at bottom of right panel — independent from the receipt Save.
- If no outstanding accruals: show muted message "No outstanding dues. Amount will be saved as credit."

SHARED VALIDATION
- Date, Party, Amount, Payment Method: required; errors on blur.
- Amount: positive decimal.
- Allocation total must not exceed receipt amount — show inline error in totals row; disable Confirm Allocation.
- Last partial row applied amount: > 0 and ≤ that accrual's due amount.

OFFLINE
- Receipt Save (Step 1 / left panel): fully functional offline.
- Allocation (Step 2 / right panel): uses cached accruals. Show subtle note "Accruals from last sync".

DESIGN PRINCIPLES FOR THIS SCREEN
- Title "Add Receipt" must match the button that opened this screen exactly.
- Avoid dense text in the allocation list — let icons and color carry meaning.
- Cards (mobile) and compact list rows (desktop) are preferred over data tables for the accrual list.
- Keep the two steps clearly distinct on mobile — do not attempt to show allocation before the receipt is saved.
```

---

*v2 — May 2026. Supersedes v1.*
