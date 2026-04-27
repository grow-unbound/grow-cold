# LOT DETAILS SCREEN — Implementation Prompt

## Context
You are implementing the Lot Details screen that shows lot summary, delivery history, and charges breakdown.

---

## Component Structure

```
LotDetailsScreen/
├─ index.tsx (main screen)
├─ components/
│  ├─ LotSummary.tsx (lot snapshot)
│  ├─ DeliveriesList.tsx (delivery history)
│  ├─ ChargesBreakdown.tsx (charges summary)
│  └─ RentsPlaceholder.tsx (future M1 feature)
```

---

## Screen Layout

### Header (Sticky)
- Left: ← Back button (navigate back to Stock tab)
- Center: Lot number (e.g., "Lot 11045/120")
- Right: ⋮ Menu icon (future: Edit, Delete, Report)
- Background: White
- Border bottom: 1px light gray

### Lot Summary Section
- Immediately below header
- Background: Light gray card (#F9FAFB)
- Padding: 16px
- Border radius: 12px

**Summary Layout:**
```
LOT SUMMARY

Customer:  MLTC
Product:   Endo 5 Chillies 40Kg
Location:  B3/28A

Lodged:    120 bags (Apr 12, 2024)
Delivered: 97 bags (12 deliveries)
Balance:   23 bags

Status:    ⚠️ Stale (579 days)
```

- Labels (left-aligned, 14px gray): Customer, Product, Location, etc.
- Values (left-aligned, 16px semibold): MLTC, Endo 5 Chillies, etc.
- Spacing: 8px between rows

**Status Badge:**
- 🟢 Fresh (0-6 months): Green text + green border
- 🟡 Aging (6-12 months): Yellow text + yellow border  
- 🔴 Stale (>12 months): Red text + red border
- Inline badge: "[Status Emoji] [Status Text] ([Days] days)"

### Tab Navigation (Sticky)
- Below summary section
- Three tabs: [Deliveries] [Charges] [Rents]
- Default: [Deliveries] active
- Active tab: Orange underline (3px), orange text
- Inactive: Gray text
- Tab bar sticky on scroll

### Tab Content (Scrollable)

**Deliveries Tab:**
- List of all deliveries for this lot
- Sorted: Most recent first (date desc)

**Delivery Row:**
```
┌─────────────────────────────────────┐
│ Apr 20, 2024                        │ ← Date (16px semibold)
│ 8 bags • Driver: Pandu              │ ← Bags • Driver (14px gray)
│ Vehicle: AP05TU1118                 │ ← Vehicle (14px gray)
└─────────────────────────────────────┘
```

- Tap row → Expand to show more details (optional, M1 feature)
- No tap interaction in M0 (static list)

**Empty State (no deliveries yet):**
- "No deliveries yet"
- "This lot hasn't been delivered"

---

**Charges Tab:**
- Summary of all charges for this lot
- Grouped by charge type

**Charges Layout:**
```
CHARGES

Hamali:           ₹1,200  (Paid)
Kata Coolie:      ₹650    (Paid)
Platform Hamali:  ₹320    (Pending)
Insurance:        ₹180    (Paid)

────────────────────────────────────

Total Charges:    ₹2,350
Collected:        ₹2,030
Pending:          ₹320
```

- Charge rows: [Type] [Amount] [Status]
  - Type: 14px regular
  - Amount: 14px semibold
  - Status: 12px, green (Paid) or red (Pending)
- Divider line before totals
- Totals: 16px semibold

**Empty State (no charges):**
- "No charges recorded"
- "Charges will appear here when recorded"

---

**Rents Tab (Placeholder for M1):**
```
RENTS

[Future Feature]

Rent calculations will be available in the next update.
Monthly and yearly rents will be calculated automatically 
based on storage duration and product type.
```

- Gray text, centered
- Illustration (optional)

---

## Scroll Behavior

**Sticky Elements:**
1. Header (back, lot number, menu)
2. Tab bar (Deliveries | Charges | Rents)

**Scrollable Content:**
- Lot summary section
- Active tab content

---

## Navigation

**Back Button:**
- Navigates to Stock tab
- Preserves Stock tab scroll position (if possible)

**Menu Button (⋮):**
- Future M1 feature
- Options: Edit Lot | Delete Lot | Generate Report
- Not implemented in M0 (button present but disabled)

---

## Data Requirements

**Lot Summary:**
- Lot details: lot_number, customer_code, customer_name, product_name, location
- Lodgement: original_bags, lodged_date
- Deliveries: SUM(delivered_bags), COUNT(deliveries)
- Balance: original_bags - SUM(delivered_bags)
- Status: Calculate from (current_date - lodged_date)
  - Fresh: <= 180 days
  - Aging: 181-365 days
  - Stale: > 365 days

**Deliveries List:**
- All deliveries for this lot_id
- Order by: delivery_date DESC
- Include: delivery_date, num_bags, driver_name, vehicle_number

**Charges Breakdown:**
- All charges for this lot_id
- Charge types: Hamali, Kata Coolie, Platform Hamali, Mamullu, Insurance
- For each: amount_paid, amount_receivable
- Status: Paid (if amount_receivable - amount_paid == 0), else Pending

---

## Offline Behavior

- Show cached lot data
- Offline indicator in header
- Cannot edit/delete (backend operations)
- Timestamp: "Updated 2 hours ago" below summary

---

## Styling

**Colors:**
- Status badges:
  - Fresh: Green (#10B981) text + border
  - Aging: Yellow (#F59E0B) text + border
  - Stale: Red (#DC2626) text + border
- Charge status:
  - Paid: Green (#10B981)
  - Pending: Red (#DC2626)
- Tab underline: Orange (#EA580C)

**Typography:**
- Lot number (header): 18px semibold
- Section title (LOT SUMMARY, CHARGES): 14px uppercase gray
- Labels: 14px regular gray
- Values: 16px semibold
- Delivery date: 16px semibold
- Delivery details: 14px regular gray

**Spacing:**
- Section padding: 16px
- Row spacing: 8px
- Tab content padding: 16px

---

## Accessibility

- Back button: Min 48px tap target
- Tab buttons: Min 48px height
- Status badges: Accessible labels ("Fresh", "Aging", "Stale")
- Screen reader: Announce lot number, status, charges

---

## Performance

- Fetch lot data on mount
- Cache in local state
- Deliveries list: No virtualization needed (typically < 50 deliveries per lot)

---

## Edge Cases

**Completed Lot (balance = 0):**
- Status: "✓ Completed" (green)
- Deliveries tab shows full history

**Lot with No Deliveries:**
- Balance = Original bags
- Deliveries tab: Empty state

**Lot with No Charges:**
- Charges tab: Empty state

**Very Old Lot (>3 years):**
- Status: "🔴 Stale (1,234 days)"
- Suggest collection action (future feature)

---

## Testing Checklist

- [ ] Lot summary displays correctly
- [ ] Status badge shows correct color/text
- [ ] Deliveries list sorted by date desc
- [ ] Charges breakdown calculates totals correctly
- [ ] Paid/Pending status shown correctly
- [ ] Tab switching works
- [ ] Back button navigates to Stock tab
- [ ] Empty states render properly
- [ ] Offline mode shows cached data

---

END OF PROMPT