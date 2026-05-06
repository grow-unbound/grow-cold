# PARTIES TAB — Implementation Prompt

## Context
You are implementing the Parties (Customers) tab for GrowCold mobile app. This is for browsing customers, checking outstanding dues, and contacting them.

---

## Component Structure

```
PartiesScreen/
├─ index.tsx (main screen)
├─ components/
│  ├─ ReceivablesCard.tsx (collapsible KPI summary)
│  ├─ FilterChips.tsx (All/Active/Pending Dues)
│  ├─ CustomerCard.tsx (individual customer)
│  └─ ContactSheet.tsx (Call/WhatsApp options)
```

---

## Screen Layout

### Search Bar (Sticky)
- Always visible at top
- Height: 48px
- Placeholder: "Search by name, code, address"

### Receivables Card (Collapsible)
- Below search bar
- Default: Expanded

**Expanded State:**
```
RECEIVABLES                               ▼

    ₹2,34,500 • 47 customers

  Rents      Charges     Others
  ₹1,87,000  ₹39,200     ₹8,300
  231 lots   142 lots    8 customers
```

- Main metric: ₹2,34,500 (24px bold) • 47 customers (16px regular)
- Sub-metrics: Three columns
  - Top: Amount (16px bold)
  - Bottom: Context (12px gray) - lot count or customer count

**Collapsed State:**
```
RECEIVABLES                               ▶
₹2,34,500 • 47 customers
```

### Filter Chips (Sticky)
- Three chips: [All] [Active] [Pending Dues]
- Default: [Active]
- Active chip: Orange background, white text

**Filter Definitions:**
- **All:** All 1,101 customers
- **Active:** Customers with current stock OR activity in last 90 days
- **Pending Dues:** Customers with outstanding > ₹0 (sorted by amount desc)

### Customers Header (Sticky)
- Text: "CUSTOMERS (199 active)" — count updates with filter
- Below filter chips

### Customer List
- **No date grouping** (unlike Stock/Money tabs)
- Flat list, sorted by filter logic
- Scroll to load more (pagination)

**Customer Card:**
```
┌─────────────────────────────────────┐
│ 🔴 MLTC                      ₹2.5L  │ ← Status indicator • Code • Outstanding
│    97 lots • 6,883 bags             │    Lot count • Bag count
│    📞 9848012345                     │    Phone (tappable)
└─────────────────────────────────────┘
```

**Card Structure:**
- Line 1: [Status Indicator] [Customer Code] • [Outstanding Amount]
  - Status: 🔴 Red (>₹50K) | 🟡 Yellow (₹10K-50K) | 🟢 Green (<₹10K or ₹0)
  - Code: 16px semibold
  - Amount: 16px semibold, right-aligned
- Line 2: [Lot count] • [Bag count]
  - 14px regular gray
- Line 3: [Phone icon] [Phone number]
  - 14px regular
  - Phone icon tappable

**Status Indicator Logic:**
- 🔴 Red: Outstanding ≥ ₹50,000
- 🟡 Yellow: Outstanding ₹10,000 - ₹49,999
- 🟢 Green: Outstanding < ₹10,000 or ₹0

---

## Scroll Behavior

Same sticky pattern:
1. Search bar (sticky)
2. Receivables card (sticky, collapsible)
3. Filter chips (sticky)
4. Customers header (sticky)
5. Customer list (scrollable)

---

## Search Behavior

**Search Across:**
- Customer code (MLTC, SKK, etc.)
- Customer name
- Phone number
- Address

**Results:**
- Show filtered cards
- Count: "Showing 8 customers for 'Ramesh'"

---

## Filter Behavior

**Sort Order by Filter:**
- **All:** Alphabetical by name
- **Active:** Most recent activity first (last transaction date desc)
- **Pending Dues:** Highest outstanding amount first (amount desc)

**Filter Persistence:**
- Persists in session
- Default on fresh load: [Active]

---

## Card Interactions

**Tap Card (anywhere except phone):**
- Navigate to Party Details screen
- Pass customer_id as param

**Tap Phone Icon:**
- Open Contact Sheet (bottom sheet)
- Options: Call | WhatsApp | Cancel

**Contact Sheet Layout:**
```
┌─────────────────────────────────────┐
│ Contact MLTC                        │
│ 9848012345                          │
├─────────────────────────────────────┤
│ 📞 Call                             │
│                                     │
│ 💬 WhatsApp                         │
│                                     │
│ Cancel                              │
└─────────────────────────────────────┘
```

**Contact Sheet Actions:**
- Call → Open phone dialer with number
- WhatsApp → Open WhatsApp with number (if installed)
- Cancel → Close sheet

---

## Data Requirements

**Receivables Card:**
- Total receivable: SUM(customer.outstanding)
- Customer count: COUNT(customers WHERE outstanding > 0)
- Rents receivable: SUM(lot.rent_pending)
- Rent lot count: COUNT(lots WHERE rent_pending > 0)
- Charges receivable: SUM(lot.charges_pending)
- Charges lot count: COUNT(lots WHERE charges_pending > 0)
- Others receivable: SUM(customer.other_pending)
- Others customer count: COUNT(customers WHERE other_pending > 0)

**Customer List:**
- All customers (paginated)
- Include: code, name, phone, outstanding, lot_count, bag_count, last_activity_date
- Sort by filter (see Filter Behavior above)
- Pagination: 50 customers initially, load more on scroll

---

## No FAB

- Customers are created via backend admin panel only
- Staff cannot create customers
- No FAB on this screen

---

## Offline Behavior

Same pattern:
- Offline indicator
- Search/filter works on cached data
- Cannot create customers (backend only)
- Timestamp on stale data

---

## Styling

**Colors:**
- Status indicators:
  - 🔴 Red: #DC2626
  - 🟡 Yellow: #F59E0B
  - 🟢 Green: #10B981
- Background: #F9FAFB (screen), #FFFFFF (cards)

**Typography:**
- Customer code (16px semibold): #1F2937
- Outstanding (16px semibold): #1F2937 (right-aligned)
- Lot/bag count (14px regular): #6B7280
- Phone (14px regular): #0891B2 (blue, tappable)

**Card:**
- Border radius: 12px
- Padding: 12px
- Shadow: elevation-sm
- No left border (clean card)

---

## Accessibility

- Phone icon: Min 48px tap target (add padding)
- Status indicators: Accessible labels ("High outstanding", "Medium outstanding", "No outstanding")
- Color contrast: WCAG AA
- Screen reader: Announce customer code, outstanding, status

---

## Performance

- FlashList for customer list
- Debounced search (300ms)
- Pagination: 50 at a time
- Cache customer list locally

---

## Edge Cases

**No Customers:**
- Empty state: "No customers yet"
- "Customers will appear here once you start recording transactions"

**No Phone Number:**
- Show "—" instead of phone
- Phone icon disabled/grayed out

**Very Long Names:**
- Truncate: "Very Long Customer Na..."
- Full name on Party Details screen

**Zero Outstanding:**
- Still show customer in [All] and [Active] filters
- Status: 🟢 Green, Amount: ₹0

---

## Testing Checklist

- [ ] Search filters correctly
- [ ] All/Active/Pending Dues filters work
- [ ] Sort order correct for each filter
- [ ] Status indicators show correct colors
- [ ] Tap card navigates to Party Details
- [ ] Tap phone opens Contact Sheet
- [ ] Call action opens dialer
- [ ] WhatsApp action opens app (if installed)
- [ ] Outstanding amounts formatted correctly
- [ ] Offline mode works
- [ ] Pagination loads more on scroll

---

END OF PROMPT