# HOME TAB — Implementation Prompt

## Context
You are implementing the Home tab (Dashboard) for GrowCold Stock mobile app. This is the command center where owners/managers check business health with time-filtered analytics.

---

## Component Structure

```
HomeScreen/
├─ index.tsx (main screen component)
├─ components/
│  ├─ BusinessSnapshot.tsx (Cash + Stock cards)
│  ├─ TodaysActivity.tsx (lodgements/deliveries summary)
│  ├─ AlertsSection.tsx (needs attention items)
│  ├─ StockPerformance.tsx (graph + 4 KPIs)
│  ├─ MoneyPerformance.tsx (4 KPIs)
│  ├─ PartiesPerformance.tsx (4 KPIs)
│  └─ PerformanceGraph.tsx (reusable multi-bar chart)
```

---

## Screen Layout

### Header
- Fixed at top (never scrolls)
- Left: "Home" title (20px semibold)
- Right: Search icon (tap → global search overlay) + Warehouse menu (≡)
- Background: White
- Border bottom: 1px light gray

### Business Snapshot (Static)
- Two cards side-by-side (equal width, 8px gap)
- **Cash Card:**
  - Icon: 💰 (24px)
  - Balance: ₹45,230 (24px bold)
  - Received today: ₹12,500 (14px gray)
  - Paid today: ₹2,400 (14px gray)
- **Stock Card:**
  - Icon: 📦 (24px)
  - Total bags: 17,234 (24px bold)
  - Total lots: 564 (14px gray)
  - Stale lots: 127 (14px red)
- Tap card → Navigate to respective tab

### Today's Activity
- Single card, full width
- Title: "TODAY'S ACTIVITY" (14px uppercase gray)
- Three lines:
  - ↓ 3 lodgements (145 bags)
  - ↑ 8 deliveries (287 bags)
  - ₹12,500 collected from 2 customers
- Icons: Orange ↓, Teal ↑, Green ₹
- Font: 16px regular

### Alerts Section
- Title: "⚠️ NEEDS ATTENTION" (14px uppercase red)
- List of alert items (max 5 shown)
- Each item: Bullet point, 16px text, tap to navigate
- If no alerts: Show "✓ All good! No urgent items" (gray)

### Performance
- Title: "SUMMARY"
- Time filter chips: [Today] [Yesterday] [This Week] [This Month]
  - Height: 36px, border-radius: 18px
  - Active: Orange background, white text
  - Inactive: Orange border, orange text

### Stock Performance
- Title: "STOCK" (16px semibold)
- Multi-bar graph:
  - X-axis: Time periods (dates/days)
  - Y-axis: Bag count
  - Orange bars: Lodged
  - Teal bars: Delivered
  - Side-by-side bars per period
  - Height: 200px
- 4 KPI cards (2×2 grid): - During the selected time period
  - **Lodged:** Bags, Lots, % vs last period
  - **Delivered:** Bags, Lots, % vs last period
  - **Avg/Day:** Bags per day, comparison (AVG of Bags In and Out together)
  - **Active Lots:** Count, comparison (Lots in active state)
  - Card height: 100px
  - Main metric: 20px bold
  - Secondary: 14px regular
  - Trend: 14px with ↑/↓ arrow

### Money Performance
- Same structure as Stock Performance
- 4 KPI cards:
  - **Collected:** Amount, % vs last period
  - **Paid Out:** Amount, % vs last period
  - **Net:** Amount, % vs last period
  - **Avg/Day:** Amount per day, comparison

### Parties Performance
- Same structure as Stock Performance
- 4 KPI cards:
  - **Collections:** Amount, % vs last period
  - **Active:** Customer count, comparison
  - **New Customers:** Count, comparison
  - **Paid in Full:** Customer count, comparison

---

## Scroll Behavior

- Header: Sticky at top (never scrolls)
- Everything else: Scrolls normally
- No sticky sections within Performance areas

---

## Time Filter Logic

Each Performance section (Stock/Money/Parties) has **independent** time filter state.

**Filter Options:**
- Today: Last 24 hours
- Yesterday: Previous 24 hours
- This Week: Current calendar week (Mon-Sun)
- This Month: Current calendar month

**Comparison Periods:**
- Today vs Yesterday
- Yesterday vs Day before yesterday
- This Week vs Last week (same days)
- This Month vs Last month (same calendar month)

**State Persistence:**
- Each section's filter persists independently
- Stored in local state (not navigation params)

---

## Data Requirements

Fetch from Supabase (let Cursor determine exact queries based on schema):

**Business Snapshot:**
- Current cash balance (total collected - total paid)
- Today's receipts sum
- Today's payments sum
- Total bags in stock
- Total lots count (where lot.status IN 'ACTIVE', 'STALE', 'DELIVERED')
- Stale lots count (where lot.status = 'STALE')

**Today's Activity:**
- Lodgements count + bags sum (today)
- Deliveries count + bags sum (today)
- Receipts sum + customer count (today)

**Alerts:**
- Customers with rent overdue > 30 days (top 3)
- Lots aged > 365 days count
- Pending staff payments sum

**Stock Performance (time-filtered):**
- Lodgements: bags, lots (current period + last period for comparison)
- Deliveries: bags, lots (current period + last period for comparison)
- Graph data: Daily/weekly aggregates of lodged/delivered bags
- Active lots: Lots with transactions in period

**Money Performance (time-filtered):**
- Receipts sum (current + last period)
- Payments sum (current + last period)
- Net calculation
- Avg per day calculation

**Parties Performance (time-filtered):**
- Total collections (current + last period)
- Active customers count (with transactions in period)
- New customers count (first transaction in period)
- Customers paid in full count (balance = 0 in period)

---

## Interactions

**Business Snapshot Cards:**
- Tap Cash card → No navigation for now
- Tap Stock card → No navigation for now

**Alert Items:**
- Tap alert → Navigate to relevant screen:
  - Customer overdue → Party Details
  - Stale lots → Stock tab with filter
  - Pending payments → Money tab with filter

**Time Filter Chips:**
- Tap chip → Update that section's graph + KPIs
- Active state visual feedback (filled background)

**Graph:**
- Static visualization (no tap interactions in M0)
- Legend at top: Orange square "Lodged" | Teal square "Delivered"

**KPI Cards:**
- Static display (no tap interactions in M0)

---

## Styling

**Colors:**
- Orange: #EA580C
- Teal: #0891B2
- Purple: #7C3AED
- Green: #10B981
- Red: #DC2626
- Gray text: #6B7280
- Light gray background: #F9FAFB

**Typography:**
- Hero numbers (32px): Business snapshot main numbers
- Card titles (20px semibold): Section headers
- Metrics (24px bold): KPI main numbers
- Body (16px): Activity items, alert text
- Secondary (14px): Subtitles, trends, labels
- Captions (12px): Graph axis labels

**Spacing:**
- Screen padding: 16px
- Card padding: 16px
- Card gap: 12px
- Section gap: 24px

**Cards:**
- Border radius: 12px
- Background: White
- Shadow: elevation-sm (subtle shadow)
- Border: None (clean cards)

**Chips:**
- Height: 36px (ensure 48px tap target with padding)
- Border radius: 18px
- Horizontal padding: 16px
- Gap between chips: 8px

---

## Offline Behavior

**Data Loading:**
- Show skeleton loaders while fetching
- Cache all data locally (IndexedDB)
- Offline indicator: Gray "🔴 Offline" badge in header
- Timestamp: "Updated 2 hours ago" below graphs

**Offline State:**
- Show cached data
- Disable real-time updates
- Filter/navigation still works
- Alert banner: "You're offline. Data may be outdated."

**Online State:**
- Auto-refresh data on app resume
- No offline indicator
- Live data updates

---

## Role-Based Visibility

**Staff Role:**
- Hide Home tab entirely (redirect to Stock tab if accessed)
- Or show simplified view with Today's Activity only (discuss with product owner)

**Manager/Owner Roles:**
- Full access to all sections
- No restrictions

---

## Accessibility

- All cards: min height 48px for tap targets
- Chips: min tap area 48px (use padding extension)
- Color contrast: All text meets WCAG AA (4.5:1)
- Alt text: Icons have accessible labels
- Focus indicators: Visible on tap
- Screen reader: Proper heading hierarchy (h1 → h2 → h3)

---

## Performance

- Lazy load graph library (only when section scrolls into view)
- Debounce filter changes (300ms) to prevent excessive queries
- Cache graph data (don't re-fetch on tab switch)
- Optimize large lists (virtualization if > 100 items)

---

## Edge Cases

**No Data:**
- New warehouse: Show empty state with illustration
- "No activity yet. Record your first transaction to see insights."

**Single Data Point:**
- Graph with 1 bar: Show bar, gray out comparison
- Comparison: "No data for last period"

**Very Large Numbers:**
- Format with K/L/Cr notation:
  - 1,500 → 1.5K
  - 1,50,000 → 1.5L
  - 1,50,00,000 → 1.5Cr

**Long Customer Names:**
- Truncate with ellipsis: "Very Long Customer N..."
- Full name on tap (detail screen)

---

## Testing Checklist

- [ ] Business snapshot cards navigate correctly
- [ ] Time filters update graphs + KPIs
- [ ] Each section's filter state is independent
- [ ] Comparison % calculated correctly
- [ ] Graph displays correctly for all time ranges
- [ ] Offline state shows cached data + indicator
- [ ] Alerts navigate to correct screens
- [ ] Role-based visibility enforced
- [ ] Skeleton loaders during data fetch
- [ ] Empty states render properly
- [ ] Large numbers formatted correctly
- [ ] Tap targets meet 48px minimum

---

## Implementation Notes

- Use GlueStack UI components where applicable
- Graph library: Use recharts or victory-native (choose based on performance)
- Time filtering: Use date-fns for date calculations
- State management: React Query for data fetching + caching
- Navigation: React Navigation stack
- Offline storage: Use Expo SQLite or IndexedDB wrapper

---

## File Structure Example

```typescript
// HomeScreen/index.tsx
export default function HomeScreen() {
  const { data: snapshot } = useBusinessSnapshot();
  const { data: activity } = useTodaysActivity();
  const { data: alerts } = useAlerts();
  
  const [stockFilter, setStockFilter] = useState('month');
  const [moneyFilter, setMoneyFilter] = useState('month');
  const [partiesFilter, setPartiesFilter] = useState('month');
  
  return (
    <ScrollView>
      <Header />
      <BusinessSnapshot data={snapshot} />
      <TodaysActivity data={activity} />
      <AlertsSection data={alerts} />
      <StockPerformance 
        filter={stockFilter}
        onFilterChange={setStockFilter}
      />
      <MoneyPerformance 
        filter={moneyFilter}
        onFilterChange={setMoneyFilter}
      />
      <PartiesPerformance 
        filter={partiesFilter}
        onFilterChange={setPartiesFilter}
      />
    </ScrollView>
  );
}
```

---

## Completion Criteria

Home tab is complete when:
1. All sections render with real data
2. Time filters work independently
3. Navigation from cards/alerts works
4. Graphs display correctly for all time ranges
5. Offline mode shows cached data
6. Role-based access enforced
7. Performance targets met (< 3s initial load)
8. Accessibility requirements met

---

END OF PROMPT