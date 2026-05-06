# GrowCold — Form & CRUD Design Best Practices

> Reference doc before designing individual screens. Apply these patterns consistently across all 6 use cases.

---

## 1. Core Philosophy: Confidence Over Completeness

This audience does not fill forms — they do jobs. Every form must feel like the next obvious step in a physical workflow they already do (writing in a register, handing a token, collecting cash). 

**The test:** "If Raju, 52 yrs, Guntur, who uses WhatsApp daily, can complete this without asking anyone — it passes."

**Three rules that govern everything:**
- Show only what is needed *right now*
- Never ask for something you can derive or default
- When in doubt, do less and let them add more later

---

## 2. Navigation Pattern: Full-Screen Stack (Non-Negotiable)

All create/edit forms are full-screen push screens on the navigation stack.

**Why:** Bottom sheets require understanding of layers. Modals have unfamiliar dismiss gestures. Full screen = familiar, like opening a new page. Back button = undo/cancel. This maps to how Android users already think.

**Header anatomy (every form):**
```
[← Back]   "New Lot"             [Save]
```
- Back (left): discard without saving — no confirmation unless >1 field is filled
- Title (center): action verb + entity name. e.g. "New Lot", "Record Delivery", "Collect Payment"
- Save (right): primary action, always text not icon, disabled until minimum required fields are filled

**On desktop (web):** Same full-screen pattern. Max-width 640px, centered. Do not make it wider — these forms aren't spreadsheets.

---

## 3. Form Anatomy: The Two-Zone Model

Every form has exactly two zones. This is the universal structure.

### Zone 1 — Essential (always visible)
The 3–5 fields that must be filled to create the record. No optional fields here. This is what the user fills 80% of the time.

### Zone 2 — Additional Details (collapsed by default)
Behind a `+ Add details` tappable row at the bottom of Zone 1. Expands inline (no navigation). This is where driver name, notes, vehicle number, etc. live.

```
┌─────────────────────────────────┐
│  [← Back]   New Lot    [Save]   │
├─────────────────────────────────┤
│  Customer *                     │
│  [Search: Raju Cold Store ▼]    │
│                                 │
│  Product *                      │
│  [Select product ▼]             │
│                                 │
│  No. of Bags *                  │
│  [____] bags                    │
│                                 │
│  Lot Number *                   │
│  [GC-2024-047] ✏ suggested      │
│                                 │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│  + Add details (optional)       │
└─────────────────────────────────┘
```

**Save button behavior:**
- Disabled (greyed) until all Zone 1 required fields are filled
- On tap: optimistic save → navigate back → show toast "Lot saved"
- Never show a spinner that blocks the form. Navigate away, sync in background.

---

## 4. Input Patterns

### Selectors (Customer, Product, Lot)

Never use a native `<select>` dropdown for lists that grow. Use a **full-screen search picker**:
- Tap field → pushes new "Select Customer" screen
- Shows recent/top items immediately (no typing needed for common use)
- Search bar at top with large text
- Each list item: primary text (name) + secondary text (code or count)
- Tap to select → auto-navigate back

```
[← Cancel]   Select Customer
[🔍 Search parties...          ]
─────────────────────────────
RECENT
  Raju Cold Store          RC01
  Lakshmi Traders          LT04
─────────────────────────────
ALL
  ABC Provisions           AB07
  ...
```

**Party/Customer display format:** Always `Code — Name`. e.g. `RC01 — Raju Cold Store`. Show code first because operators often know codes better than full names.

### Numeric inputs

- Always trigger numeric keypad (`keyboardType="numeric"`)
- Show unit inline: `[  47  ] bags` — the word "bags" is part of the field, not a label above
- For currency: `₹ [  4,500  ]` — prefix ₹ inside the input box
- Use `,` thousands separator in display, strip for storage
- Font size minimum 18sp for numeric values

### Date inputs

- Default: today's date, pre-filled
- Display: `DD/MM/YYYY` always
- Use native date picker on mobile (don't build a custom one)
- Show as a tappable chip: `📅 01/05/2026 ▼`

### Text inputs (notes, names)

- Use sentence case placeholder text: "Add a note..."
- No character count unless there's a hard limit
- Multiline for notes, single line for names/references

---

## 5. Validation: Inline, Forgiving, Non-Blocking

**Rules:**
- Validate on blur (when focus leaves a field), not on every keystroke
- Required field: only show error if user *tapped it and left it empty*
- Error message: one plain sentence, no jargon. "Enter number of bags" not "Bags field is required"
- Color: red border + red text below the field
- Never block form submission with a dialog. Show inline errors, scroll to first error.

**Derive don't ask:**
- Lot number: suggest incrementally from last lot of that customer/day. User can override.
- Date: default today
- Charges receivable amount: derive from #bags × rate. Show calculated amount. Allow override.

---

## 6. Selection Flows With Dependencies

Many forms have dependent selectors: Customer → Lot → Bags available.

**Pattern:** Cascade silently, don't force the user to understand the dependency explicitly.

```
Delivery Form:
  Customer: [Raju Cold Store ▼]   ← select first
  Lot: [GC-2024-047 (Apple, 200 bags) ▼]  ← filtered by customer automatically
  Bags to deliver: [__] / 200 remaining
```

If a user taps "Lot" before selecting Customer, auto-open the Customer picker first. Don't show an error like "Select customer first" — just do it for them.

For forms where Customer is not required first (Lot picker directly), show all lots with customer name as a secondary label.

---

## 7. Contextual Hints (Not Warnings)

For high-stakes actions (Delivery, Collections), show context *before* the save — but not as a warning dialog. Inline info cards that appear after the lot is selected.

**Delivery form example:**
```
[Lot selected: GC-2024-047]
─────────────────────────
⚠ Outstanding rent:   ₹ 12,400
⚠ Charges pending:    ₹  3,200
─────────────────────────
Total due before delivery: ₹ 15,600
```

This is informational. The user can still proceed. Don't block delivery — that's a business policy decision, not a UX decision.

---

## 8. Offline Behavior

All forms must work 100% offline. The user gets no degraded experience.

- Save button works offline. Shows "Saved (will sync)" toast instead of "Saved"
- A small sync status pill in the header (not intrusive): `🔄 2 pending` 
- When reconnected: auto-syncs silently, shows "Synced" for 3 seconds
- If sync conflict: show a single notification "1 item needs review" — don't interrupt current work

---

## 9. Haptics + Micro-feedback

Every action needs tactile confirmation on Android.

| Action | Feedback |
|--------|----------|
| Save successful | `Haptics.impactAsync(MEDIUM)` + green toast |
| Validation error | `Haptics.notificationAsync(ERROR)` |
| Delete / destructive | `Haptics.impactAsync(HEAVY)` |
| Selector tap | `Haptics.impactAsync(LIGHT)` |

Toast messages: bottom of screen, 2 seconds, no close button needed.

---

## 10. List → Detail → Edit Navigation

Standard pattern across all entities:

```
List screen (e.g., Lots)
  → Tap row → Detail screen (read-only, key info)
      → "Edit" button top right → Edit form (same as Create form, pre-filled)
  → FAB (bottom right +) → Create form
```

**Detail screen rule:** Show the record cleanly before allowing edit. This prevents accidental edits from tapping to view.

**FAB:** Large (56dp), primary color, bottom-right corner. Icon only (+ or relevant icon). Always visible on list screens.

---

## 11. Destructive Actions

- Delete is never on the list row (no swipe-to-delete) — too risky for fat fingers
- Delete is inside the edit form, at the bottom, as a red text link: "Delete this lot"
- Tapping delete shows a confirmation: `[Cancel]  [Yes, delete]` — not a full dialog, an inline confirmation row that replaces the button

---

## 12. Form-Specific Patterns Summary

| Form | Primary Zone Fields | Secondary Zone | Special Pattern |
|------|-------------------|----------------|-----------------|
| New Lot | Customer, Product, #Bags, Lot No. | Driver, Vehicle No., Location, Notes | Lot No. auto-suggested |
| Charges Receivable | Customer, Lot, Charge Type, #Bags | Notes | Amount derived from #bags × rate |
| Labor Charges | Lot/Delivery, Charge Type, Amount | Notes, Worker Name | Linked to stock movement |
| Delivery | Customer, Lot, #Bags | Charges receivable inline, Labor charge | Outstanding dues card shown |
| Operational Payment | Payment Type, Amount, Payment Method | Lot/Delivery ref, Recipient name+phone, Notes | Date defaults today |
| Customer Receipt | Customer, Amount, Payment Method | Reference No., Notes | Allocation panel below receipt fields |

---

## 13. Allocation Panel (Customer Receipts)

This is the most complex form. Use a two-phase approach:

**Phase 1 (always visible):** Capture the receipt — Customer, Date, Amount, Payment Method, Reference No.

**Phase 2 (expands after saving or on "Allocate" tap):** Show all outstanding accruals for that customer as a selectable list.

```
Outstanding (₹ 28,400 total)
──────────────────────────────
☐  GC-047 | Rent Aug      ₹ 4,200   [Edit amt]
☐  GC-047 | Handling      ₹   800   [Edit amt]
☐  GC-052 | Rent Aug      ₹ 6,100   [Edit amt]
──────────────────────────────
Allocated: ₹ 0 / ₹ 15,000 received
[Confirm Allocation]
```

Key rules:
- Allow partial allocation (editable amount per line)
- Running total shows allocated vs received
- Over-allocation: show error inline, not on save
- Unallocated balance is saved as "unapplied credit" automatically

---

## 14. Language & Labels

All labels in the UI should be short, plain, and in the domain language defined in CLAUDE.md. Avoid banking/English jargon.

| Use | Avoid |
|-----|-------|
| Party | Customer / Client |
| Bags | Units / Qty |
| Lot | Batch / SKU |
| ₹ Amount | Price / Value |
| Inward / Outward | Receive / Ship |
| Outstanding | Dues / Pending amount |
| Collect | Receive payment |

For bilingual labels (in future i18n pass), keep English labels short so they work as translation keys too.

---

## 15. Component Hierarchy (GlueStack UI)

Recommended GlueStack components per pattern:

| Pattern | GlueStack Component |
|---------|-------------------|
| Full-screen form | `Box` + `ScrollView` + `KeyboardAvoidingView` |
| Field label + input | `FormControl` + `Input` |
| Selector / picker | Custom search screen using `FlatList` |
| Section divider | `Divider` with `Text` label |
| Save button | `Button` variant="solid", full-width |
| Additional details toggle | `Pressable` row with `ChevronDown` icon |
| Info card (dues) | `Box` with warning color background |
| Toast | GlueStack `Toast` / `useToast()` |
| FAB | `Fab` component |

---

*v1 — May 2026. Update this doc before starting each new form implementation.*
