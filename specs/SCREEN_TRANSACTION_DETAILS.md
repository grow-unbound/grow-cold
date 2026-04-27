# TRANSACTION DETAILS SCREEN — Implementation Prompt

## Context
You are implementing the Transaction Details screen for viewing and managing individual receipts or payments.

---

## Component Structure

```
TransactionDetailsScreen/
├─ index.tsx (main screen)
├─ components/
│  ├─ TransactionSummary.tsx (transaction snapshot)
│  └─ AllocationBreakdown.tsx (lot allocation, future M1)
```

---

## Screen Layout

### Header (Sticky)
- Left: ← Back button (navigate to Money tab)
- Center: Transaction ID (e.g., "Receipt #R-1234" or "Payment #P-5678")
- Right: ⋮ Menu icon (future: Edit, Delete, Print)
- Background: White
- Border bottom: 1px light gray

### Transaction Summary Section
- Below header
- Background: Light gray card (#F9FAFB)
- Padding: 16px
- Border radius: 12px

**Summary Layout (Receipt):**
```
TRANSACTION SUMMARY

Type:       Receipt
Customer:   MLTC
Amount:     ₹12,500
Method:     Cash
Date:       Apr 20, 2024 2:15 PM
Recorded by: Ramesh (Staff)

Purpose:    Rent payment
Notes:      Partial payment for Q1
```

**Summary Layout (Payment):**
```
TRANSACTION SUMMARY

Type:       Payment
Recipient:  Pandu (Driver)
Amount:     ₹2,400
Method:     Cash
Date:       Apr 20, 2024 7:30 PM
Recorded by: Ramesh (Staff)

Purpose:    Hamali charges
Notes:      8 deliveries completed today
```

- Labels (left-aligned, 14px gray): Type, Customer/Recipient, etc.
- Values (left-aligned, 16px semibold)
- Date format: MMM DD, YYYY h:mm A (e.g., Apr 20, 2024 2:15 PM)
- Spacing: 8px between rows

**Visual Type Indicator:**
- Receipt: Green badge "RECEIPT" at top-right of card
- Payment: Purple badge "PAYMENT" at top-right of card

### Allocation Section (Future M1 Feature)
- Only shown for receipts (not payments)
- Placeholder in M0

**Allocation Placeholder:**
```
ALLOCATION

[Future Feature]

Lot-level allocation will be available in the next update.
You'll be able to allocate this receipt to specific lots
for rent and charges tracking.
```

- Gray text, centered
- Only visible for receipts (hidden for payments)

---

## Scroll Behavior

**Sticky Elements:**
- Header only (back, transaction ID, menu)

**Scrollable Content:**
- Transaction summary section
- Allocation section (future)

---

## Navigation

**Back Button:**
- Navigate to Money tab
- Preserve Money tab scroll position

**Menu Button (⋮):**
- Future M1 feature
- Options: Edit Transaction | Delete Transaction | Print Receipt
- Not implemented in M0 (button present but disabled)

---

## Data Requirements

**Transaction Summary:**
- Transaction details: type, transaction_id, customer/recipient, amount, method, date, purpose, notes
- Recorded by: user.name who created the transaction
- For receipts: customer_code, customer_name
- For payments: recipient_name (free text)

---

## Offline Behavior

- Show cached transaction data
- Offline indicator in header
- Cannot edit/delete (requires network)
- Timestamp: "Updated 2 hours ago" below summary

---

## Styling

**Colors:**
- Type badge:
  - Receipt: Green (#10B981) background, white text
  - Payment: Purple (#7C3AED) background, white text
- Amount: 
  - Receipt: Green (#10B981) if large amount
  - Payment: Black (neutral)

**Typography:**
- Transaction ID (header): 18px semibold
- Section title (TRANSACTION SUMMARY): 14px uppercase gray
- Labels: 14px regular gray
- Values: 16px semibold
- Type badge: 12px uppercase semibold

**Spacing:**
- Section padding: 16px
- Row spacing: 8px

**Type Badge:**
- Position: Top-right of summary card
- Padding: 4px 8px
- Border radius: 4px
- Font: 12px uppercase semibold

---

## Accessibility

- Back button: Min 48px tap target
- Screen reader: Announce transaction type, amount, customer

---

## Performance

- Fetch transaction data on mount
- Cache in local state
- No complex calculations

---

## Edge Cases

**No Notes:**
- Show "—" for notes field

**No Purpose:**
- Show "—" for purpose field

**System-Generated Transaction:**
- Recorded by: "System (Auto)"

**Very Long Notes:**
- Allow multi-line, no truncation
- Scroll if needed

---

## Testing Checklist

- [ ] Transaction summary displays correctly
- [ ] Type badge shows correct color (green for receipts, purple for payments)
- [ ] Date formatted correctly
- [ ] Back button navigates to Money tab
- [ ] Receipt type shows allocation placeholder
- [ ] Payment type hides allocation section
- [ ] Offline mode shows cached data
- [ ] No notes/purpose show "—"

---

END OF PROMPT