# STOCK TAB — Implementation Prompt

## Context
You are implementing the Stock tab for GrowCold mobile app. This is the primary operational screen for searching/browsing stock transactions and recording new lodgements/deliveries.

---

## Component Structure

```
StockScreen/
├─ index.tsx (main screen)
├─ components/
│  ├─ StockStatusCard.tsx (collapsible KPI summary)
│  ├─ FilterChips.tsx (All/Lodgements/Deliveries)
│  ├─ TransactionCard.tsx (individual transaction)
│  ├─ DateSection.tsx (collapsible date group)
│  └─ RecordTransactionSheet.tsx (bottom sheet FAB action)
```

---

## Screen Layout

### Search Bar (Sticky)
- Always visible at top of screen
- Height: 48px
- Placeholder: "Search lots, customers, products"
- Left icon: 🔍 (20px gray)
- Background: Light gray (#F3F4F6)
- Border radius: 12px
- Tap → Activates search (keyboard appears)
- Typing → Shows filtered results in real-time

### Stock Status Card (Collapsible)
- Positioned below search bar
- Default state: Expanded
- Header: "STOCK STATUS" + ▼/▲ chevron
- Tap header → Toggle collapse/expand

**Expanded State:**
```
STOCK STATUS                              ▼

        17,234 bags • 564 lots

  Fresh      Aging       Stale
  13,550     2,556       1,128
  0-6mo      6-12mo      >12mo
```

- Main metric: 24px bold (center-aligned)
- Sub-metrics: 16px bold (top), 12px gray (bottom)
- Three equal-width columns

**Collapsed State:**
```
STOCK STATUS                              ▶
17,234 bags • 564 lots
```
- Single line, 14px gray

### Filter Chips (Sticky)
- Below Stock Status card (or search bar if card collapsed)
- Three chips: [All] [Lodgements] [Deliveries]
- Default: [All] selected
- Active: Orange background (#EA580C), white text
- Inactive: Orange border, orange text
- Height: 36px, ensure 48px tap target with padding
- Horizontal scroll if needed (mobile)

### Transactions Header (Sticky)
- Text: "TRANSACTIONS" (14px uppercase gray)
- Below filter chips
- Background: White
- Scroll: Becomes sticky when scrolled past filters

### Transaction List
- Grouped by date (collapsible sections)
- Date sections sorted: Most recent first
- **Today section:** Expanded by default
- **All other sections:** Collapsed by default

**Date Section Header:**
```
TODAY ▾ (12)
```
- Date label: "TODAY" | "YESTERDAY" | "APR 23 (WED)"
- Chevron: ▾ (expanded) or ▶ (collapsed)
- Count: (12) = number of transactions
- Tap → Toggle expand/collapse

**Transaction Card Layout:**
```
┌─────────────────────────────────────┐
│ 🌶️│ ↓ SKK • Lot 11045              │ ← 4px orange left border
│  │   Endo 5 Chillies 40Kg          │
│  │   120 bags lodged               │
└─────────────────────────────────────┘
```

**Card Structure:**
- Left border: 4px solid (Orange for lodgements, Teal for deliveries)
- Padding: 12px
- Background: White
- Border radius: 12px
- Shadow: Subtle elevation

**Card Content:**
- Line 1: [Emoji] [Arrow] [Customer Code] • Lot [Lot Number]
  - Emoji: Product group icon (🌶️ Chillies, 🍋 Tamarind, etc.)
  - Arrow: ↓ (lodgement) or ↑ (delivery)
  - Customer code: 16px semibold
  - Lot number: 16px semibold
- Line 2: [Product Name]
  - 14px regular gray
- Line 3: [Bags] [Action]
  - 14px regular
  - Example: "120 bags lodged" or "8 bags delivered"

**Product Group Emojis:**
- Chillies: 🌶️
- Tamarind: 🍋
- Turmeric: 🟡
- Jaggery: 🍯
- Rice: 🌾
- Pulses: 🫘
- Spices: ⭐
- Seeds: 🌰
- Grains: 🌽
- Default: 📦

### FAB (Floating Action Button)
- Position: Bottom-right, 16px margin from edges
- Size: 56px diameter
- Background: Orange (#EA580C)
- Icon: + (white, 24px)
- Shadow: Elevation 6
- Tap → Opens "Record Transaction" bottom sheet

---

## Scroll Behavior

**Sticky Elements (in order from top):**
1. Search bar (always sticky)
2. Stock Status card (sticky, but can be collapsed)
3. Filter chips (sticky below search/card)
4. Transactions header (sticky below filters)

**Scrollable Content:**
- Stock Status card content (when expanded)
- Date sections
- Transaction cards

**Scroll Optimization:**
- Virtualized list (use FlashList or similar)
- Load 7 days initially (~42 transactions)
- Infinite scroll: Load next 7 days on scroll
- Collapse date sections to reduce DOM nodes

---

## Search Behavior

**Search Activation:**
- Tap search bar → Keyboard opens, cursor in input
- Search icon remains visible (left side)
- Clear button (X) appears when text entered

**Search Query:**
- Debounced (300ms) to avoid excessive filtering
- Searches across:
  - Lot number (e.g., "11045")
  - Customer code (e.g., "MLTC")
  - Customer name (e.g., "Ramesh", "Ananda Rao")
  - Product name (e.g., "Endo 5", "Tamarind")
  - Location (e.g., "B3/28A") — for future use

**Search Results:**
- Replace transaction list with filtered results
- Show count: "Showing 8 results for 'MLTC'"
- Group by entity type (optional):
  - LOTS (3)
  - DELIVERIES (5)
- Clear search → Return to full list

**No Results:**
- Show: "No results for 'xyz'"
- Suggestion: "Try searching by lot number, customer, or product"

---

## Filter Behavior

**Filter States:**
- [All]: Show both lodgements and deliveries
- [Lodgements]: Show only orange-bordered cards
- [Deliveries]: Show only teal-bordered cards

**Filter Persistence:**
- Selected filter persists in tab state
- Cleared on app restart (fresh session defaults to "All")

**Filter + Search Interaction:**
- Both active simultaneously
- Example: Filter "Lodgements" + Search "MLTC" → Shows only MLTC's lodgements

---

## Date Section Grouping

**Group Labels:**
- Today (if current day)
- Yesterday (if previous day)
- [Date] ([Weekday]) — e.g., "APR 23 (WED)"

**Collapse/Expand:**
- Tap section header → Toggle state
- Expanded: Show all transactions
- Collapsed: Hide transactions, show count only
- State persists during session (resets on app restart)

**Initial State:**
- Today: Expanded
- All others: Collapsed

---

## Transaction Card Interactions

**Tap Card:**
- Navigate to Lot Details screen
- Pass lot_id as navigation param

**Long Press (Future):**
- Show context menu: Edit | Delete | Share
- Not implemented in M0

---

## FAB Action: Record Transaction

**Full Screen Layout:**
```
┌─────────────────────────────────────┐
│ Add Stock Movement                  │ ← Screen header
├─────────────────────────────────────┤
│ [● Lodgement] [○ Delivery]          │ ← Toggle (Delivery default)
├─────────────────────────────────────┤
│ Customer *                          │
│ [Search/Select customer]            │
│                                     │
│ Product *                           │
│ [Search/Select product]             │
│                                     │
│ Bags *                              │
│ [Number input]                      │
│                                     │
│ Locations                           │
│ [Search/Multi-Select locations]     │
│                                     │
│ Notes                               │
│ [Text area]                         │
├─────────────────────────────────────┤
│ [Cancel]              [Save]        │
└─────────────────────────────────────┘
```

**Toggle Behavior:**
- Default: Delivery (86% of transactions)
- Tap Lodgement → Show lodgement-specific fields (location required)
- Tap Delivery → Show delivery-specific fields (driver, vehicle optional)

**Form Validation:**
- Required fields: Customer, Product, Bags
- Bags: Must be positive number
- Submit disabled until valid

**Save Action:**
- Optimistic UI: Add card to list immediately with "⏳ Syncing..." badge
- Background: Save to Supabase
- On success: Remove sync badge
- On failure: Show "⚠️ Sync failed • Tap to retry"

---

## Data Requirements

Fetch from Supabase (Cursor determines queries based on schema):

**Stock Status Card:**
- Total bags: SUM(lot.balance_bags)
- Total lots: COUNT(lot.id WHERE balance_bags > 0)
- Fresh bags: SUM(balance_bags WHERE lot.age_days <= 180)
- Aging bags: SUM(balance_bags WHERE lot.age_days > 180 AND <= 365)
- Stale bags: SUM(balance_bags WHERE lot.age_days > 365)
- General filter across all teh above counts: WHERE lot.status IN {ACTIVE, STALE}

**Transaction List:**
- All transactions (lodgements + deliveries)
- Order by: transaction_date DESC, created_at DESC
- Include: customer_code, customer_name, product_name, product_group, lot_number, num_bags, transfer_mode
- Pagination: Initial 20 rows, lazy load more on scroll towards the end of list (no visible loading ...)

**Search:**
- Filter locally (all data already fetched)
- Or re-query with WHERE clause (if dataset large)

**Product Groups:**
- Fetch product_group → emoji mapping
- Cache in memory

---

## Offline Behavior

**Offline Indicator:**
- Header shows: "🔴 Offline" badge
- Search/filter still works (cached data)
- New transactions queued

**Queue Display:**
- Queued transactions show "⏳ Syncing..." badge
- On reconnect: Auto-sync, remove badge
- Failed sync: "⚠️ Sync failed" with retry button

**Data Staleness:**
- Show timestamp: "Updated 2 hours ago" below Stock Status

---

## Styling

**Colors:**
- Orange border (Lodgements): #EA580C
- Teal border (Deliveries): #0891B2
- Background: #F9FAFB (screen), #FFFFFF (cards)
- Gray text: #6B7280
- Border: #E5E7EB

**Typography:**
- Customer/Lot (16px semibold): #1F2937
- Product name (14px regular): #6B7280
- Bags count (14px regular): #1F2937

**Card:**
- Border radius: 12px
- Padding: 12px
- Left border: 4px solid
- Shadow: elevation-sm

**Search Bar:**
- Height: 48px
- Padding: 12px 16px
- Border radius: 12px
- Background: #F3F4F6

---

## Accessibility

- Search bar: Label "Search lots, customers, products"
- Filter chips: Min 48px tap target
- Transaction cards: Min 48px height
- FAB: 56px size (exceeds min)
- Color contrast: Meet WCAG AA
- Screen reader: Announce date sections, card content

---

## Performance

- Use FlashList for transaction list (virtualization)
- Debounce search (300ms)
- Lazy load images (product emojis loaded on demand)
- Cache product group mappings
- Paginate transactions (7 days at a time)

---

## Edge Cases

**No Transactions:**
- Empty state: "No stock movements yet"
- Illustration + "Record your first lodgement to get started"

**Long Customer Names:**
- Truncate: "Very Long Customer Na... • Lot 11045"
- Full name on detail screen

**Large Bag Counts:**
- Format: 1,234 bags (Indian number format)

**Old Dates:**
- Group by month for dates > 30 days ago
- "MARCH 2024 ▶ (45)"

---

## Testing Checklist

- [ ] Search filters transactions correctly
- [ ] All/Lodgements/Deliveries filters work
- [ ] Date sections collapse/expand
- [ ] Transaction cards navigate to Lot Details
- [ ] FAB opens bottom sheet
- [ ] Record transaction form validates
- [ ] Optimistic UI on save
- [ ] Sync badge appears/disappears
- [ ] Offline mode works (cached data)
- [ ] Scroll performance smooth (60fps)
- [ ] Sticky headers remain sticky
- [ ] Product emojis display correctly

---

## Implementation Notes

- Use GlueStack UI for base components
- FlashList for transaction list (performance)
- React Hook Form for bottom sheet form
- React Query for data fetching/caching
- Date-fns for date formatting
- Offline storage: Expo SQLite or IndexedDB

---

END OF PROMPT