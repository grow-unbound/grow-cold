# GrowCold — Form & CRUD Design Best Practices v2

> Master reference for all form and CRUD screen design across the GrowCold app.  
> Apply consistently across all 6 operational use cases.  
> v2 — May 2026

---

## 1. Core Philosophy

This audience does not fill forms — they do jobs. Every form must feel like the next obvious step in a physical workflow they already do (writing in a register, handing a token, collecting cash).

**The test:** "If Raju, 52 yrs, Guntur, who uses WhatsApp daily, can complete this without asking anyone — it passes."

Three rules that govern everything:
- Show only what is needed *right now*
- Never ask for something you can derive or default
- When in doubt, do less and let them add more later

---

## 2. Navigation: Full-Screen Stack

All create/edit forms are full-screen push screens on the navigation stack — no bottom sheets, no modals, no overlays.

**Why:** Full screen = familiar, like opening a new page in a register. Back = cancel. This maps directly to how Android users already navigate.

**Header (mobile + desktop):**
```
[← Back]        New Lot
```
- Left: back arrow (discard). Confirm only if more than one field has been filled.
- Center: action verb + entity. e.g. "New Lot", "Record Delivery", "Collect Payment"
- Right: nothing. Edit access is via ⋮ overflow on detail screens (see §9).

**Sticky footer (mobile + desktop):**
```
[  Cancel  ]          [  Save  ]
```
- Fixed to the bottom of the viewport, above the keyboard on mobile
- Save: primary action, full-color, disabled until all Zone 1 required fields are filled
- Cancel: secondary, text-style button, same as tapping back
- On desktop: footer is part of the form layout, not floating, but still visually separated from the form fields by a top border

---

## 3. Layout: Mobile vs Desktop

### Mobile (primary)
- Full screen, single column
- `ScrollView` + `KeyboardAvoidingView` so sticky footer stays above the keyboard
- Min touch target: 48dp for all tappables
- Font: 16sp labels, 18sp input values

### Desktop (secondary)
- App has a sidebar nav — forms are left-aligned, **not centered**
- Max form width: **560px**
- Form begins at the content area's left edge (sidebar excluded)
- Sticky footer aligns to the same 560px column, not the full viewport width
- Input rows can use a 2-column grid for short paired fields (e.g. Rate + Amount side by side), but default to single column for all primary fields
- No full-screen pickers for selection — use **inline autocomplete combobox** (see §5)

```
Sidebar | [← Back]  New Lot
        |
        | Customer *
        | [Raju Cold Store (RC01)        ▼]
        |
        | Product *
        | [Apple — Fuji                  ▼]
        |
        | No. of Bags *        Location *
        | [  200  ] bags       [Row B, Rack 3]
        |
        | Lot Number *
        | [GC-RC01-047] ✏ suggested
        |
        | ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
        | + Add details (optional)
        |
        | ───────────────────────────────
        | [Cancel]              [Save]
```

---

## 4. Form Anatomy: Two-Zone Model

Every form has exactly two zones. This structure is universal across all 6 use cases.

### Zone 1 — Essential (always visible)
3–6 fields that must be filled to create a valid record. No optional fields here. This is what the user fills 80% of the time. Required fields are marked with `*`.

### Zone 2 — Additional Details (collapsed by default)
Behind a `+ Add details` tappable row at the bottom of Zone 1. **Expands inline** — no navigation, no modal. Tap again to collapse.

The toggle row:
```
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
+ Add details (optional)    ⌄
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
```

When expanded, fields slide in below. The footer sticks regardless.

**On desktop:** Zone 2 can be visible by default if screen height permits (>768px) — but still visually separated with a subtle divider and lighter label weight.

---

## 5. Selection Patterns

### Mobile: Full-Screen Search Picker
Tapping a selector field (Customer, Lot, Product) pushes a dedicated search screen:
- Search bar auto-focused at top
- Recent/frequent items shown immediately below (no typing needed)
- Each row: primary label (name) + secondary label (code or count)
- Tap to select → auto-navigate back, field populated

```
[← Cancel]   Select Party
[🔍 Search parties...         ]
─────────────────────────────
RECENT
  RC01 — Raju Cold Store
  LT04 — Lakshmi Traders
─────────────────────────────
ALL
  AB07 — ABC Provisions
```

### Desktop: Inline Autocomplete Combobox
- Text input with type-ahead dropdown
- Dropdown appears below the input, max 6 visible rows, scrollable
- Keyboard navigable (arrow + enter)
- Shows code + name in dropdown rows, displays selected value as "Code — Name"
- No navigation, no new screen

### Party/Customer display format
Always: `Code — Name`  e.g. `RC01 — Raju Cold Store`  
Codes first because floor staff often know codes better than full names.

### Dependent selectors (Customer → Lot)
- Customer must be selected before Lot picker is available
- If user taps Lot before Customer: silently open Customer picker first
- After Customer is selected, Lot list is automatically scoped to that customer
- Remaining bags shown inline in the lot row: `GC-047 — Apple Fuji (200 bags, 47 remaining)`

---

## 6. Input Patterns

### Numeric inputs
- Always trigger numeric keypad (`keyboardType="numeric"` / `inputmode="numeric"`)
- Unit shown inline as a suffix: `[  200  ] bags`
- Currency: ₹ prefix inside the input: `₹ [  4,500  ]`
- Use `,` thousands separator in display; strip for storage
- Minimum 18sp font for values

### Derived/calculated fields
- Show calculated result in a read-only styled input: grey background, lock icon
- Allow override: tap lock icon to unlock and edit manually
- Examples: Amount = #bags × rate; Lot Number = auto-incremented suggestion

### Date inputs
- Default: today's date, pre-filled
- Format: `DD/MM/YYYY` always
- Native date picker on mobile (OS picker)
- On desktop: use a date input with `DD/MM/YYYY` mask
- Display as a tappable chip: `📅 01/05/2026 ▼`

### Text inputs (notes, names)
- Sentence case placeholder: "Add a note..."
- Single line for names/codes/references
- Multiline for notes (auto-expands, no character count unless there's a hard limit)

---

## 7. Validation Rules

Validate on **field blur** (when focus leaves), not on keystroke. Do not block form submission with a dialog — show inline errors and scroll to the first error.

### Error presentation
- Red border on the field
- Short plain-language message below: "Enter number of bags" not "Bags is required"
- Haptic feedback: `Haptics.notificationAsync(ERROR)` on mobile

### Common cross-form rules
- Required fields: show error only if user tapped the field and left it empty
- Numeric fields: must be a positive integer unless explicitly a decimal (amounts)
- Amounts: must be > 0
- Bags to deliver / charge: must be ≤ remaining bags in the referenced lot
- Lot number: must be unique (validated on blur, async check)
- Phone numbers: 10-digit Indian mobile format

### Charge-specific rules
- `applicable_bags` must be > 0 and ≤ lot total bags
- For kata-coolie: `applicable_bags` is prompted separately (weighed bags, not total bags)
- For hamali / mamulle: `applicable_bags` defaults to lot total bags, editable
- Rate must be > 0; Amount = `applicable_bags × rate`, override allowed

### Delivery-specific rules
- `bags_to_deliver` > 0 and ≤ `lot.remaining_bags`
- Lot must have remaining bags > 0 (otherwise show "Lot fully delivered" and disable save)

### Allocation-specific rules
- Allocated total must not exceed receipt amount (hard block)
- Partial allocation only on the last row in FIFO sequence (see §12)

---

## 8. Contextual Info Cards

For high-stakes actions, show relevant context **inline** after a key selector is filled — never as a blocking dialog.

```
┌──────────────────────────────────┐
│ ⚠  Outstanding dues for RC01     │
│    Rent (Aug):        ₹  12,400  │
│    Charges pending:  ₹   3,200  │
│    Total due:        ₹  15,600  │
└──────────────────────────────────┘
```

Rules:
- Appears automatically after Lot is selected on the Delivery form
- Informational only — user can still proceed
- Use amber/warning background, not red
- Dismiss-able by the user

---

## 9. Edit Access: ⋮ Overflow Menu

Edit is a rare operation. Do not clutter detail screens with an Edit button in the header.

- Detail screens have a `⋮` icon in the top-right header
- Overflow menu contains: **Edit**, and if applicable, **Delete**
- Delete always has a secondary confirmation (inline row, not a modal)
- On desktop: same ⋮ menu pattern, or a right-click context menu on the record row in list views

---

## 10. FAB: Context-Aware

FABs are context-specific, not generic. Never show a generic "+" FAB.

| Screen | FAB action(s) |
|--------|--------------|
| Lots list | New Lot |
| Lot Detail | Add Delivery |
| Parties list | New Party |
| Party Detail | Speed-dial: Add Lot / Add Delivery / Add Receipt |
| Deliveries list | New Delivery |
| Payments list | New Payment |
| Receipts list | New Receipt |

**Speed-dial FAB** (Party Detail): Expands on tap into 3 labeled action buttons stacked above the FAB. Tapping anywhere else collapses it.

---

## 11. Offline Behavior

All forms must work 100% offline with no degraded experience.

- Save button always works offline
- Toast on offline save: "Saved — will sync when online" instead of "Saved"
- Subtle sync pill in the app header (not form header): `🔄 3 pending`
- On reconnect: auto-syncs silently, shows "Synced ✓" for 3 seconds
- Sync conflicts: single notification "1 item needs review" — never interrupt current work
- Selectors that depend on server data (Customer, Lot, Product) must use locally cached lists

---

## 12. Allocation: FIFO Auto-Allocation

For Customer Receipts, allocation is system-driven, not manual selection.

**Behavior:**
1. After receipt amount is entered, system runs FIFO on all outstanding accruals for that customer (oldest first by accrual date)
2. System pre-fills the allocation list — user reviews, does not build it manually
3. Each row shows: Lot No. | Type (Rent / Hamali / etc.) | Accrual Amount | Allocated Amount
4. All rows except the last are fully allocated (read-only amounts)
5. Last row: if `remaining_receipt_amount < accrual_amount`, the allocated amount is partial and editable
6. User taps **Confirm Allocation**
7. Unallocated balance (if any) is auto-saved as unapplied credit against the party

**If user changes the receipt amount** after allocation is shown: re-run FIFO and refresh the list.

---

## 13. Haptics + Micro-feedback

| Action | Haptic | Visual |
|--------|--------|--------|
| Save successful | `MEDIUM` impact | Green toast, bottom of screen, 2s |
| Validation error | `ERROR` notification | Red inline message + scroll to field |
| Destructive action | `HEAVY` impact | Inline confirmation row |
| Selector tap | `LIGHT` impact | — |
| FAB expand (speed-dial) | `LIGHT` impact | — |

Toasts: no close button, auto-dismiss in 2 seconds.

---

## 14. Domain Language in Labels

| Use | Avoid |
|-----|-------|
| Party | Customer / Client |
| Bags | Units / Qty / Pieces |
| Lot | Batch / SKU / Consignment |
| ₹ Amount | Price / Value / Sum |
| Inward / Outward | Receive / Ship |
| Delivery | Dispatch / Issue |
| Outstanding | Dues / Balance due |
| Collect | Receive payment |
| Godown / Location | Facility / Warehouse |

---

## 15. GlueStack UI Component Map

| Pattern | Component |
|---------|-----------|
| Full-screen form | `Box` + `ScrollView` + `KeyboardAvoidingView` |
| Sticky footer | `Box` with `position: absolute, bottom: 0` + safe area inset |
| Field + label | `FormControl` + `FormControlLabel` + `Input` |
| Mobile selector | Custom full-screen `FlatList` screen |
| Desktop combobox | `Input` + `Box` popover dropdown |
| Section toggle (Zone 2) | `Pressable` row with `ChevronDownIcon` |
| Info card (dues) | `Box` with `$warning100` background |
| Toast | `useToast()` |
| FAB | `Fab` component |
| Speed-dial | `Fab` + animated `VStack` of `Fab` children |
| Overflow menu | `Menu` + `MenuItem` triggered by `⋮` icon |

---

*v2 — May 2026. Supersedes v1.*
