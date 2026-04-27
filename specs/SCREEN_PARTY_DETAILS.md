# PARTY DETAILS SCREEN — Implementation Prompt

## Context
You are implementing the Party (Customer) Details screen that shows customer summary, their lots, and receipt history.

---

## Component Structure

```
PartyDetailsScreen/
├─ index.tsx (main screen)
├─ components/
│  ├─ CustomerSummary.tsx (customer snapshot)
│  ├─ LotsList.tsx (customer's lots)
│  ├─ ReceiptsList.tsx (payment history)
│  └─ ContactSheet.tsx (Call/WhatsApp options)
```

---

## Screen Layout

### Header (Sticky)
- Left: ← Back button (navigate to Parties tab)
- Center: Customer code (e.g., "MLTC")
- Right: ⋮ Menu icon (future: Edit, Send Reminder, Statement)
- Background: White
- Border bottom: 1px light gray

### Customer Summary Section
- Below header
- Background: Light gray card (#F9FAFB)
- Padding: 16px
- Border radius: 12px

**Summary Layout:**
```
CUSTOMER SUMMARY

Code:       MLTC
Phone:      📞 9848012345
Address:    Musheerabad, Hyderabad

Current Stock:  6,883 bags (97 lots)
Outstanding:    ₹2,50,000
  ├─ Rents:     ₹2,10,000
  ├─ Charges:   ₹38,000
  └─ Others:    ₹2,000

Last Activity:  2 days ago
```

- Labels (14px gray): Code, Phone, Address, etc.
- Values (16px semibold): MLTC, phone number, address
- Phone: Tappable (blue text #0891B2)
- Outstanding breakdown: Indented tree structure
  - Main: 16px semibold
  - Sub-items: 14px regular gray, indented with tree lines (├─, └─)
- Last Activity: Relative time (2 days ago, 1 week ago, etc.)

**Phone Tap Behavior:**
- Opens Contact Sheet (bottom sheet)
- Options: Call | WhatsApp | Cancel
- Same sheet as Parties tab

### Tab Navigation (Sticky)
- Below summary section
- Two tabs: [Lots] [Receipts]
- Default: [Lots] active
- Active tab: Orange underline (3px), orange text
- Inactive: Gray text

### Tab Content (Scrollable)

**Lots Tab:**
- List of all lots for this customer
- Sorted: Most recent first (lodged_date desc)

**Lot Card:**
```
┌─────────────────────────────────────┐
│ Lot 11045 • Endo 5 Chillies         │ ← Lot number • Product (16px semibold)
│ 120 bags lodged • 97 delivered      │ ← Lodged • Delivered (14px gray)
│ 23 bags remaining • 579 days ⚠️     │ ← Remaining • Age + status (14px gray)
└─────────────────────────────────────┘
```

- Line 1: [Lot Number] • [Product Name]
- Line 2: [Original Bags] lodged • [Delivered Bags] delivered
- Line 3: [Balance Bags] remaining • [Age] days [Status Icon]
  - Status icon: 🟢 (Fresh) | 🟡 (Aging) | ⚠️ (Stale) | ✓ (Completed)

**Completed Lot (balance = 0):**
```
┌─────────────────────────────────────┐
│ Lot 10982 • Palta Tamarind          │
│ 65 bags lodged • 65 delivered       │
│ 0 bags remaining • Completed ✓      │ ← Green text
└─────────────────────────────────────┘
```

**Tap Lot Card:**
- Navigate to Lot Details screen
- Pass lot_id as param

**Empty State (no lots):**
- "No lots found"
- "This customer hasn't stored anything yet"

---

**Receipts Tab:**
- List of all receipts from this customer
- Sorted: Most recent first (date desc)

**Receipt Card:**
```
┌─────────────────────────────────────┐
│ Apr 20, 2024 • ₹12,500              │ ← Date • Amount (16px semibold)
│ Rent payment • Lots: 9823, 9856     │ ← Purpose • Lots (14px gray)
│ Cash                                │ ← Payment method (14px gray)
└─────────────────────────────────────┘
```

- Line 1: [Date] • [Amount]
- Line 2: [Purpose] • Lots: [Lot Numbers]
- Line 3: [Payment Method]

**Tap Receipt Card:**
- Navigate to Transaction Details screen
- Pass transaction_id as param

**Empty State (no receipts):**
- "No receipts yet"
- "Receipts will appear here when payments are recorded"

---

## Scroll Behavior

**Sticky Elements:**
1. Header (back, customer code, menu)
2. Tab bar (Lots | Receipts)

**Scrollable Content:**
- Customer summary section
- Active tab content

---

## Navigation

**Back Button:**
- Navigate to Parties tab
- Preserve Parties tab scroll position

**Menu Button (⋮):**
- Future M1 feature
- Options: Edit Customer | View Statement | Send Reminder
- Not implemented in M0 (button present but disabled)

---

## Data Requirements

**Customer Summary:**
- Customer details: code, name, phone, address
- Current stock: SUM(lot.balance_bags), COUNT(lots WHERE balance_bags > 0)
- Outstanding: SUM(customer.outstanding)
  - Rents: SUM(lot.rent_pending)
  - Charges: SUM(lot.charges_pending)
  - Others: customer.other_pending
- Last activity: MAX(transaction.date) for this customer

**Lots List:**
- All lots for this customer_id
- Order by: lodged_date DESC
- Include: lot_number, product_name, original_bags, delivered_bags, balance_bags, age_days, status

**Receipts List:**
- All receipts for this customer_id
- Order by: receipt_date DESC
- Include: date, amount, purpose, lot_numbers (if allocated), payment_method

---

## Offline Behavior

- Show cached customer data
- Offline indicator in header
- Cannot edit customer (backend operation)
- Cannot send reminders (requires network)
- Timestamp: "Updated 2 hours ago" below summary

---

## Styling

**Colors:**
- Phone number: Blue (#0891B2) when tappable
- Outstanding amount: Red (#DC2626) if > ₹0, Green (#10B981) if ₹0
- Status icons:
  - 🟢 Fresh: Green
  - 🟡 Aging: Yellow
  - ⚠️ Stale: Red
  - ✓ Completed: Green

**Typography:**
- Customer code (header): 18px semibold
- Section title (CUSTOMER SUMMARY): 14px uppercase gray
- Labels: 14px regular gray
- Values: 16px semibold
- Lot/Receipt cards: 16px semibold (line 1), 14px gray (lines 2-3)

**Spacing:**
- Section padding: 16px
- Row spacing: 8px
- Card gap: 12px

**Cards:**
- Border radius: 12px
- Padding: 12px
- Background: White
- Shadow: elevation-sm

---

## Accessibility

- Back button: Min 48px tap target
- Phone number: Min 48px tap target
- Tab buttons: Min 48px height
- Lot/Receipt cards: Min 48px height
- Screen reader: Announce customer code, outstanding, lot status

---

## Performance

- Fetch customer data on mount
- Lots list: Virtualize if > 100 lots (unlikely, but handle gracefully)
- Receipts list: Paginate if > 100 receipts (load 50 at a time)

---

## Edge Cases

**No Phone Number:**
- Show "—" for phone
- Phone tap disabled (gray, not tappable)

**Zero Outstanding:**
- Outstanding: ₹0 (green text)
- Sub-breakdown still shown (all ₹0)

**Customer with Only Completed Lots:**
- All lots show "Completed ✓"
- Current Stock: 0 bags (0 lots)

**Very Long Address:**
- Wrap to multiple lines (no truncation)

**Customer with 100+ Lots:**
- Virtualize list
- Show count: "LOTS (127)"

---

## Testing Checklist

- [ ] Customer summary displays correctly
- [ ] Phone tap opens Contact Sheet
- [ ] Outstanding breakdown calculates correctly
- [ ] Lots list sorted by date desc
- [ ] Lot cards show correct status icons
- [ ] Tap lot card navigates to Lot Details
- [ ] Receipts list sorted by date desc
- [ ] Tap receipt navigates to Transaction Details
- [ ] Tab switching works
- [ ] Back button navigates to Parties tab
- [ ] Empty states render properly
- [ ] Offline mode shows cached data

---

END OF PROMPT