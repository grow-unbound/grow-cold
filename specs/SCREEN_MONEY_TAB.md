# MONEY TAB — Implementation Prompt

## Context
You are implementing the Money tab (existing Transactions) for GrowCold mobile app. This tracks cash receipts from customers and payments to staff/vendors.

---

## Component Structure

```
MoneyScreen/
├─ index.tsx (main screen)
├─ components/
│  ├─ CashStatusCard.tsx (collapsible KPI summary)
│  ├─ FilterChips.tsx (All/Receipts/Payments)
│  ├─ TransactionCard.tsx (receipt or payment card)
│  ├─ DateSection.tsx (collapsible date group)
│  └─ RecordTransactionSheet.tsx (bottom sheet FAB action)
```

---

## Screen Layout

### Search Bar (Sticky)
- Always visible at top
- Height: 48px
- Placeholder: "Search customers, receipts"
- Identical to Stock tab pattern

### Cash Status Card (Collapsible)
- Below search bar
- Default: Expanded

**Expanded State:**
```
CASH STATUS                               ▼

         ₹45,230 Balance

  Received   Paid       Payable
  ₹12,500    ₹2,400     ₹8,400
  today      today      pending
```

- Main metric: ₹45,230 (24px bold, center)
- Sub-metrics: Three columns (equal width)
  - Top: Amount (16px bold)
  - Bottom: Label (12px gray)

**Collapsed State:**
```
CASH STATUS                               ▶
₹45,230 Balance
```

### Filter Chips (Sticky)
- Three chips: [All] [Receipts] [Payments]
- Default: [All]
- Active: Green background (#10B981) for Receipts, Purple (#7C3AED) for Payments
- When [All]: Show both colors in split button (future enhancement, use green for now)

### Transactions Header (Sticky)
- Text: "TRANSACTIONS"
- Below filter chips

### Transaction List
- Same collapsible date section pattern as Stock tab
- Today expanded, rest collapsed

**Receipt Card:**
```
┌─────────────────────────────────────┐
│ 💚│ ↓ MLTC                          │ ← 4px green left border
│  │   Rent payment • Lots: 9823     │
│  │   ₹12,500 • Cash                │
└─────────────────────────────────────┘
```

**Payment Card:**
```
┌─────────────────────────────────────┐
│ 💜│ ↑ Pandu (Driver)                │ ← 4px purple left border
│  │   Hamali charges • 8 deliveries │
│  │   ₹2,400 • Cash                 │
└─────────────────────────────────────┘
```

**Card Structure:**
- Left border: 4px solid (Green for receipts, Purple for payments)
- Line 1: [Emoji] [Arrow] [Customer/Recipient Name]
  - Emoji: 💚 (receipts), 💜 (payments)
  - Arrow: ↓ (receipt/money in) or ↑ (payment/money out)
  - Name: 16px semibold
- Line 2: [Purpose] • [Context]
  - Purpose: "Rent payment", "Hamali charges", etc.
  - Context: Lot numbers or delivery count
  - 14px regular gray
- Line 3: [Amount] • [Method]
  - Amount: ₹12,500 (14px regular)
  - Method: Cash | UPI | Bank Transfer
  - 14px regular

### FAB
- Same as Stock tab (56px, orange background)
- Tap → Opens "Record Transaction" bottom sheet

---

## Scroll Behavior

Identical to Stock tab:
1. Search bar (sticky)
2. Cash Status card (sticky, collapsible)
3. Filter chips (sticky)
4. Transactions header (sticky)
5. Transaction list (scrollable)

---

## Search Behavior

**Search Across:**
- Customer name (for receipts)
- Recipient name (for payments)
- Amount (₹12,500 or 12500)
- Payment method
- Purpose/notes

**Results:**
- Show filtered cards in chronological order
- Count: "Showing 5 results for 'MLTC'"

---

## Filter Behavior

**Filter States:**
- [All]: Both receipts (green) and payments (purple)
- [Receipts]: Green-bordered cards only
- [Payments]: Purple-bordered cards only

**Filter Persistence:**
- Same as Stock tab (persists in session)

---

## FAB Action: Record Transaction

**Full Screen Layout:**
```
┌─────────────────────────────────────┐
│ Record Transaction                  │
├─────────────────────────────────────┤
│ [● Receipt] [○ Payment]             │ ← Toggle
├─────────────────────────────────────┤
│ Customer * (if Receipt)             │
│ [Search/Select customer]            │
│                                     │
│ Recipient * (if Payment)            │
│ [Text input: Name]                  │
│                                     │
│ Amount * ₹                          │
│ [Number input]                      │
│                                     │
│ Method *                            │
│ [Cash] [UPI] [Bank Transfer]        │
│                                     │
│ Purpose                             │
│ [Rent | Hamali | Charges | Other]   │
│                                     │
│ Notes                               │
│ [Text area]                         │
├─────────────────────────────────────┤
│ [Cancel]              [Save]        │
└─────────────────────────────────────┘
```

**Toggle Behavior:**
- Receipt (default): Customer field required
- Payment: Recipient field required (free text)

**Payment Method Chips:**
- Three options: Cash | UPI | Bank Transfer
- Single select
- Default: Cash

**Purpose Chips:**
- Receipts: Rent | Hamali | Charges | Other
- Payments: Hamali | Kata Coolie | Platform Hamali | Wages | Other
- Single select

**Validation:**
- Required: Customer/Recipient, Amount, Method
- Amount: Must be positive number
- Submit disabled until valid

**Save Action:**
- Optimistic UI: Add to list with "⏳ Syncing..." badge
- Background sync
- Success: Remove badge
- Failure: "⚠️ Sync failed • Tap to retry"

---

## Card Interactions

**Tap Card:**
- Navigate to Transaction Details screen
- Pass transaction_id as param

---

## Data Requirements

**Cash Status Card:**
- Cash balance: SUM(receipts.amount) - SUM(payments.amount)
- Received today: SUM(receipts.amount WHERE date = today)
- Paid today: SUM(payments.amount WHERE date = today)
- Payable: SUM(pending_payments.amount WHERE status = 'pending')

**Transaction List:**
- All receipts + payments
- Order by: transaction_date DESC
- Include: customer/recipient, amount, method, purpose, notes
- Pagination: 7 days initially

---

## Offline Behavior

Same as Stock tab:
- Offline indicator
- Queue new transactions
- Sync on reconnect
- Timestamp on stale data

---

## Styling

**Colors:**
- Green border (Receipts): #10B981
- Purple border (Payments): #7C3AED
- Background: #F9FAFB (screen), #FFFFFF (cards)

**Typography:**
- Same as Stock tab (16px semibold for names, 14px regular for details)

**Card:**
- Border radius: 12px
- Padding: 12px
- Left border: 4px solid
- Shadow: elevation-sm

---

## Accessibility

- Same standards as Stock tab
- Min 48px tap targets
- WCAG AA contrast
- Screen reader labels

---

## Performance

- FlashList for transaction list
- Debounced search (300ms)
- Paginated loading (7 days)

---

## Edge Cases

**No Transactions:**
- Empty state: "No transactions yet"
- "Record your first receipt or payment"

**Large Amounts:**
- Format: ₹2,50,000 (Indian lakhs notation)
- ₹1,50,00,000 → ₹1.5Cr

**Unallocated Receipts:**
- Future feature (M1)
- For now, all receipts saved without lot allocation

---

## Testing Checklist

- [ ] Search filters correctly
- [ ] All/Receipts/Payments filters work
- [ ] Date sections collapse/expand
- [ ] Cards navigate to Transaction Details
- [ ] FAB opens bottom sheet
- [ ] Form validates correctly
- [ ] Receipt/Payment toggle changes fields
- [ ] Optimistic UI on save
- [ ] Offline mode works
- [ ] Amount formatting correct

---

END OF PROMPT