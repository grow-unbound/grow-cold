# GrowCold Stock Mobile App — Architecture Document

## Overview

Mobile-first warehouse management system for Indian cold-storage SMBs. Built with Expo + React Native + GlueStack UI, Supabase backend, offline-first architecture.

**Core Philosophy:**
- **Home = Command Center** (time-filtered analytics for Owner/Manager)
- **Stock/Money/Parties = Operational Tabs** (snapshot KPIs + searchable transaction lists for all roles)
- **Role-based defaults** (Staff lands on operational tabs, Owner checks Home daily)

---

## Navigation Structure

```
Bottom Tab Navigation (4 tabs):

┌─────────┬─────────┬─────────┬─────────┐
│  Home   │  Stock  │  Money  │ Parties │
│   🏠    │   📦    │   💰    │   👥    │
└─────────┴─────────┴─────────┴─────────┘

Home Tab:
└─ Dashboard (time-filtered analytics)

Stock Tab: (originally called Inventory)
├─ Transactions List (search + filters)
└─ Lot Details (drill-down)

Money Tab: (originally called Transactions)
├─ Transactions List (search + filters)
└─ Transaction Details (drill-down)

Parties Tab:
├─ Customer List (search + filters)
└─ Party Details (drill-down)
```

---

## Screen-by-Screen Architecture

### 1. HOME TAB

**Purpose:** Business health overview with time-filtered performance metrics

**Layout:**
```
┌─────────────────────────────────────┐
│ Home                         🔍  👤 │ ← Header (Search icon, Profile menu)
├─────────────────────────────────────┤
│ BUSINESS SNAPSHOT (Static)          │
├──────────────────┬──────────────────┤
│ 💰 Cash          │ 📦 Stock         │
│ ₹45K balance     │ 17,234 bags      │
│ ₹12K received    │ 564 lots         │
│ ₹2K paid         │ 127 stale        │
└──────────────────┴──────────────────┘
├─────────────────────────────────────┤
│ TODAY'S ACTIVITY                    │
│ ↓ 3 lodgements (145 bags)           │
│ ↑ 8 deliveries (287 bags)           │
│ ₹12,500 collected from 2 customers  │
└─────────────────────────────────────┘
├─────────────────────────────────────┤
│ ⚠️ NEEDS ATTENTION                  │
│ • MLTC: ₹2.3L rent overdue          │
│ • 127 lots aged >1 year             │
│ • ₹8.4K staff payments pending      │
└─────────────────────────────────────┘
├─────────────────────────────────────┤
│ SUMMARY                             │
│ [Today] [Yesterday] [Week] [Month]  │ ← Time filter chips
├─────────────────────────────────────┤
│ STOCK                             ▾ |
├─────────────────────────────────────┤
│ [Multi-bar graph]                   │
│ Orange = Lodged | Teal = Delivered  │
│ Apr 1   Apr 8   Apr 15  Apr 22      │
├─────────────────────────────────────┤
│ ┌─────────────┬─────────────┐       │
│ │ ↓ Lodged    │ ↑ Delivered │       │
│ │ 1,245 bags  │ 4,832 bags  │       │
│ │ 42 lots     │ 178 lots    │       │
│ │ +15%        │ +12%        │       │
│ └─────────────┴─────────────┘       │
│ ┌─────────────┬─────────────┐       │
│ │ Avg/Day     │ Active Lots │       │
│ │ 41 bags     │ 564 lots    │       │
│ │ Same        │ +3          │       │
│ └─────────────┴─────────────┘       │
├─────────────────────────────────────┤
├─────────────────────────────────────┤
│ MONEY                             ▾ │
├─────────────────────────────────────┤
│ ┌─────────────┬─────────────┐       │
│ │ Collected   │ Paid Out    │       │
│ │ ₹45,230     │ ₹18,600     │       │
│ │ +22%        │ +8%         │       │
│ └─────────────┴─────────────┘       │
│ ┌─────────────┬─────────────┐       │
│ │ Net         │ Avg/Day     │       │
│ │ +₹26,630    │ ₹1,508      │       │
│ │ +45%        │ Same        │       │
│ └─────────────┴─────────────┘       │
├─────────────────────────────────────┤
├─────────────────────────────────────┤
│ PARTIES                           ▾ │
├─────────────────────────────────────┤
│ ┌─────────────┬─────────────┐       │
│ │ Collections │ Active      │       │
│ │ ₹45,230     │ 87 customers│       │
│ │ +22%        │ +12         │       │
│ └─────────────┴─────────────┘       │
│ ┌─────────────┬─────────────┐       │
│ │ New Custs   │ Paid in Full│       │
│ │ 3           │ 12 customers│       │
│ │ -2          │ +4          │       │
│ └─────────────┴─────────────┘       │
└─────────────────────────────────────┘
```

**Scroll Behavior:**
- Header sticky on scroll
- Time filters apply across all sections (Stock/Money/Parties)

**Interactions:**
- Tap Search icon → Opens global search overlay
- Tap 👤 menu → open existing popover menu
- Tap Snapshot card → Navigates to respective tab (Cash → Money, Stock → Stock)
- Tap Alert → Navigates to relevant screen (e.g., "MLTC overdue" → Party Details)
- Time filter chips → Update graph + KPIs for that section only

**Role Visibility:**
- All roles see this screen
- Staff may not check it frequently (prefer operational tabs)

---

### 2. STOCK TAB

**Purpose:** Search/browse stock transactions, record new lodgements/deliveries

**Layout:**
```
┌─────────────────────────────────────┐
│ 🔍 Search lots, customers, products │ ← Sticky search bar
├─────────────────────────────────────┤
│ STOCK STATUS                   ▼    │ ← Collapsible (expanded by default)
│                                     │
│         17,234 bags • 564 lots      │ ← Main KPI
│                                     │
│   Fresh      Aging       Stale      │ ← Sub KPIs
│   13,550     2,556       1,128      │
│   0-6mo      6-12mo      >12mo      │
└─────────────────────────────────────┘
├─────────────────────────────────────┤
│ [All] [Lodgements] [Deliveries]     │ ← Filter chips
├─────────────────────────────────────┤
│ TRANSACTIONS                        │ ← Sticky header on scroll
├─────────────────────────────────────┤
│ TODAY ▾ (12)                        │ ← Collapsible date section (expanded)
│                                     │
│ 🌶️│ ↓ SKK • Lot 11045              │ ← Orange left border
│  │   Endo 5 Chillies 40Kg          │
│  │   120 bags lodged               │
│                                     │
│ 🍋│ ↑ MLTC • Lot 10982             │ ← Teal left border
│  │   Palta Tamarind 15Kg           │
│  │   8 bags delivered              │
├─────────────────────────────────────┤
│ YESTERDAY ▶ (8)                     │ ← Collapsed
├─────────────────────────────────────┤
│ APR 23 (WED) ▶ (15)                 │
├─────────────────────────────────────┤
│ APR 22 (TUE) ▶ (11)                 │
│                                     │
│ [Showing 42 of 220 • Scroll to load]│
└─────────────────────────────────────┘
                                   [+] ← FAB (Record transaction)
```

**Scroll Behavior:**
- Search bar sticky at top (always visible)
- Stock Status card scrolls with content (user can collapse to save space)
- Filter chips sticky below search bar
- "TRANSACTIONS" header sticky below filters
- Date sections: Collapsible (Today expanded by default, rest collapsed)
- Infinite scroll: Load next 7 days worth of transactions on scroll

**Search Behavior:**
- Tap search bar → Activates search (keyboard opens)
- Type query → Smart search across:
  - Lot number (e.g., "11045")
  - Customer code/name (e.g., "MLTC", "Ramesh")
  - Product name (e.g., "Endo 5", "Tamarind")
  - Location (e.g., "B3/28A")
- Results appear in-place (replaces transaction list)
- Shows grouped results: Lots | Customers | Products
- Tap result → Navigates to detail screen

**Filter Behavior:**
- [All] → Shows both lodgements and deliveries
- [Lodgements] → Shows only orange-bordered cards
- [Deliveries] → Shows only teal-bordered cards
- Filter persists when navigating away and back

**Card Design:**
```
┌─────────────────────────────────────┐
│ 🌶️│ ↓ SKK • Lot 11045              │ ← 4px orange left border
│  │   Endo 5 Chillies 40Kg          │    Product group emoji
│  │   120 bags lodged               │    Arrow (↓ lodged / ↑ delivered)
└─────────────────────────────────────┘    Customer code • Lot number
                                           Product name (secondary text)
                                           Trailing text (bags + action)
```

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
- Others: 📦

**Card Colors:**
- **Lodgements:** 4px solid orange (#EA580C) left border
- **Deliveries:** 4px solid teal (#0891B2) left border
- Background: White
- No card background tints (keep clean)

**Interactions:**
- Tap card → Navigate to Lot Details screen
- Tap date section header → Expand/collapse that section
- Tap FAB → Open "Record Transaction" bottom sheet
  - Toggle: [● Lodgement] [○ Delivery] (Delivery default)
  - Form fields based on selection
  - Submit → Creates transaction, adds to list with "⏳ Syncing..." indicator

**Offline Behavior:**
- Newly created transactions show with sync indicator: "⏳ Syncing..."
- Once synced → Indicator disappears
- Failed sync → "⚠️ Sync failed" with retry button
- Search works offline (searches local cached data)

**Role Visibility:**
- All roles access this screen
- Staff use this most frequently

---

### 3. MONEY TAB

**Purpose:** Track cash receipts and payments, monitor cash balance

**Layout:**
```
┌─────────────────────────────────────┐
│ 🔍 Search customers, receipts       │ ← Sticky search bar
├─────────────────────────────────────┤
│ CASH STATUS                    ▼    │ ← Collapsible (expanded by default)
│                                     │
│         ₹45,230 Balance             │ ← Main KPI (Cash Balance)
│                                     │
│   Received   Paid       Payable     │ ← Sub KPIs
│   ₹12,500    ₹2,400     ₹8,400      │
│   today      today      pending     │
└─────────────────────────────────────┘
├─────────────────────────────────────┤
│ [All] [Receipts] [Payments]         │ ← Filter chips
├─────────────────────────────────────┤
│ TRANSACTIONS                        │ ← Sticky header on scroll
├─────────────────────────────────────┤
│ TODAY ▾ (8)                         │ ← Collapsible date section
│                                     │
│ 💚│ ↓ MLTC                          │ ← Green left border (Receipt)
│  │   Rent payment • Lots: 9823     │
│  │   ₹12,500 • Cash                │
│                                     │
│ 💜│ ↑ Pandu (Driver)                │ ← Purple left border (Payment)
│  │   Hamali charges • 8 deliveries │
│  │   ₹2,400 • Cash                 │
├─────────────────────────────────────┤
│ YESTERDAY ▶ (6)                     │
├─────────────────────────────────────┤
│ APR 23 (WED) ▶ (12)                 │
└─────────────────────────────────────┘
                                   [+] ← FAB
```

**Scroll Behavior:**
- Identical to Stock tab pattern
- Search bar sticky
- Cash Status card scrolls (collapsible)
- Filters sticky
- "TRANSACTIONS" header sticky
- Date sections collapsible
- Infinite scroll

**Search Behavior:**
- Search across: Customer name, Receipt ID, Payment recipient, Amount, Notes

**Filter Behavior:**
- [All] → Both receipts and payments
- [Receipts] → Green-bordered cards only
- [Payments] → Purple-bordered cards only

**Card Colors:**
- **Receipts:** 4px solid green (#10B981) left border
- **Payments:** 4px solid purple (#7C3AED) left border

**Card Design:**
```
Receipt:
┌─────────────────────────────────────┐
│ 💚│ ↓ MLTC                          │ ← Green border, ↓ arrow
│  │   Rent payment • Lots: 9823, 9856│    Customer name
│  │   ₹12,500 • Cash                │    Purpose • Lots (if applicable)
└─────────────────────────────────────┘    Amount • Payment method

Payment:
┌─────────────────────────────────────┐
│ 💜│ ↑ Pandu (Driver)                │ ← Purple border, ↑ arrow
│  │   Hamali charges • 8 deliveries │    Recipient name (role)
│  │   ₹2,400 • Cash                 │    Purpose • Count
└─────────────────────────────────────┘    Amount • Payment method
```

**Interactions:**
- Tap card → Navigate to Transaction Details screen
- Tap FAB → Open "Record Transaction" bottom sheet
  - Toggle: [● Receipt] [○ Payment]
  - Form fields: Customer/Recipient, Amount, Method, Purpose, Notes

**Offline Behavior:**
- Same as Stock tab (sync indicators, retry logic)

---

### 4. PARTIES TAB

**Purpose:** Browse customers, check outstanding dues, contact customers

**Layout:**
```
┌─────────────────────────────────────┐
│ 🔍 Search by name, code, address    │ ← Sticky search bar
├─────────────────────────────────────┤
│ RECEIVABLES                    ▼    │ ← Collapsible (expanded by default)
│                                     │
│      ₹2,34,500 • 47 customers       │ ← Main KPI (Total receivable)
│                                     │
│  Rents      Charges     Others      │ ← Sub KPIs
│  ₹1,87,000  ₹39,200     ₹8,300      │
│  231 lots   142 lots    8 customers │
└─────────────────────────────────────┘
├─────────────────────────────────────┤
│ [All] [Active] [Pending Dues]       │ ← Filter chips
├─────────────────────────────────────┤
│ CUSTOMERS (199 active)              │ ← Sticky header
├─────────────────────────────────────┤
│ 🔴 MLTC                      ₹2.5L  │ ← Red indicator (high outstanding)
│    97 lots • 6,883 bags             │
│    📞 9848012345                     │
│                                     │
│ 🔴 GCC/Rampachodavaram      ₹1.3L  │
│    41 lots • 3,543 bags             │
│    📞 8985123456                     │
│                                     │
│ 🟡 SKK/PKL                   ₹45K   │ ← Yellow indicator (medium)
│    95 lots • 472 bags               │
│    📞 9000067890                     │
│                                     │
│ 🟢 SBC/Rajarao               ₹0     │ ← Green indicator (no dues)
│    11 lots • 151 bags               │
│    📞 9440123789                     │
│                                     │
│ [Showing 42 of 199 • Scroll to load]│
└─────────────────────────────────────┘
```

**Scroll Behavior:**
- Same sticky pattern (Search → KPI card → Filters → Header → List)

**Search Behavior:**
- Search across: Customer code, Name, Phone, Address

**Filter Behavior:**
- [All] → All 1,101 customers
- [Active] → Customers with stock OR activity in last 90 days
- [Pending Dues] → Customers with outstanding > ₹0 (sorted by amount desc)

**Card Design:**
```
┌─────────────────────────────────────┐
│ 🔴 MLTC                      ₹2.5L  │ ← Status indicator • Customer • Outstanding
│    97 lots • 6,883 bags             │    Lot count • Bag count
│    📞 9848012345                     │    Phone (tap to call/WhatsApp)
└─────────────────────────────────────┘
```

**Status Indicators:**
- 🔴 Red: Outstanding > ₹50K
- 🟡 Yellow: Outstanding ₹10K-50K
- 🟢 Green: Outstanding ₹0-10K or ₹0

**Interactions:**
- Tap card → Navigate to Party Details screen
- Tap phone icon → Opens bottom sheet (Call | WhatsApp | Cancel)
- No FAB (customer creation done via backend admin panel only)

**Sort Order:**
- [All] → Alphabetical by name
- [Active] → Recent activity first
- [Pending Dues] → Highest outstanding first

---

### 5. LOT DETAILS SCREEN

**Purpose:** View lot snapshot, delivery history, charges breakdown

**Layout:**
```
┌─────────────────────────────────────┐
│ ← Lot 11045/120             ⋮       │ ← Back button, Lot number, Menu
├─────────────────────────────────────┤
│ LOT SUMMARY                         │
├─────────────────────────────────────┤
│ Customer:  MLTC                     │ ← Use icons instead of labels (Customer, Product, etc.)
│ Product:   Endo 5 Chillies 40Kg     │
│ Location:  B3/28A                   │
│                                     │
│ Lodged:    120 bags (Apr 12, 2024)  │
│ Delivered: 97 bags (12 deliveries)  │
│ Balance:   23 bags                  │
│                                     │
│ Status:    ⚠️ Stale (579 days)      │
└─────────────────────────────────────┘
├─────────────────────────────────────┤
│ [Deliveries] [Charges] [Rents]      │ ← Tab navigation
├─────────────────────────────────────┤
│ DELIVERIES (12)                ▼    │ ← Collapsible (expanded by default)
├─────────────────────────────────────┤
│ Apr 20, 2024                        │ ← Use icons instead of labels (Date, Driver/Vehicle, etc.)
│ 8 bags • Driver: Pandu              │
│ Vehicle: AP05TU1118                 │
│                                     │
│ Apr 15, 2024                        │
│ 12 bags • Driver: Raju              │
│ Vehicle: AP09TZ5566                 │
│                                     │
│ ... (scroll for more)               │
├─────────────────────────────────────┤
│ CHARGES                        ▼    │ ← Collapsible (expanded by default)
├─────────────────────────────────────┤
│ Hamali:           ₹1,200  (Paid)    │
│ Kata Coolie:      ₹650    (Paid)    │
│ Platform Hamali:  ₹320    (Pending) │
│ Insurance:        ₹180    (Paid)    │
│                                     │
│ Total Charges:    ₹2,350            │
│ Collected:        ₹2,030            │
│ Pending:          ₹320              │
├─────────────────────────────────────┤
│ RENTS (Future: M1)             ▼    │ ← Collapsible (expanded by default)
│ [Placeholder for rent calculations] │
└─────────────────────────────────────┘
```

**Scroll Behavior:**
- Header sticky (Back, Lot number, Menu)
- Summary section scrolls
- Tab bar sticky below header
- Tab content scrolls

**Interactions:**
- Tap ← → Navigate back to Stock tab
- Tap ⋮ menu → Options (Edit lot, Delete lot, Generate report)
- Switch tabs → Shows different content (Deliveries | Charges | Rents)
- Tap delivery row → Expand to show full details (optional in M1)

**Status Badge Colors:**
- Fresh (0-6mo): Green border
- Aging (6-12mo): Yellow border
- Stale (>12mo): Red border

---

### 6. PARTY DETAILS SCREEN

**Purpose:** View customer snapshot, lots, receipts

**Layout:**
```
┌─────────────────────────────────────┐
│ ← MLTC                      ⋮       │ ← Back, Customer name, Menu
├─────────────────────────────────────┤
│ CUSTOMER SUMMARY                    │
├─────────────────────────────────────┤
│ Code:       MLTC                    │
│ Phone:      📞 9848012345           │ ← Tap to call/WhatsApp
│ Address:    Musheerabad, Hyderabad  │
│                                     │
│ Current Stock:  6,883 bags (97 lots)│
│ Outstanding:    ₹2,50,000           │
│   ├─ Rents:     ₹2,10,000           │
│   ├─ Charges:   ₹38,000             │
│   └─ Others:    ₹2,000              │
│                                     │
│ Last Activity:  2 days ago          │
└─────────────────────────────────────┘
├─────────────────────────────────────┤
│ [Lots] [Receipts]                   │ ← Tab navigation
├─────────────────────────────────────┤
│ LOTS (97)                      ▼    │ ← Collapsible (expanded by default)
├─────────────────────────────────────┤
│ Lot 11045 • Endo 5 Chillies         │ ← Use icons instead of labels (Date, Driver/Vehicle, etc.)
│ 120 bags lodged • 97 delivered      │
│ 23 bags remaining • 579 days ⚠️     │
│                                     │
│ Lot 10982 • Palta Tamarind          │
│ 65 bags lodged • 65 delivered       │
│ 0 bags remaining • Completed ✓      │
│                                     │
│ ... (scroll for more)               │
├─────────────────────────────────────┤
│ RECEIPTS                       ▼    │ ← Collapsible (expanded by default)
├─────────────────────────────────────┤
│ Apr 20, 2024 • ₹12,500              │ ← Use icons instead of labels (Date, Driver/Vehicle, etc.)
│ Rent payment • Lots: 9823, 9856     │
│ Cash                                │
│                                     │
│ Mar 15, 2024 • ₹8,200               │
│ Hamali charges • Lot: 10234         │
│ UPI                                 │
└─────────────────────────────────────┘
```

**Scroll Behavior:**
- Same sticky pattern (Header → Summary → Tabs → Content)

**Interactions:**
- Tap phone → Call/WhatsApp options
- Tap lot row → Navigate to Lot Details
- Tap receipt row → Navigate to Transaction Details
- Tap ⋮ menu → Options (Edit customer, View statement, Send reminder)

---

### 7. TRANSACTION DETAILS SCREEN

**Purpose:** View receipt/payment details, allocations, edit if needed

**Layout:**
```
┌─────────────────────────────────────┐
│ ← Receipt #R-1234           ⋮       │ ← Back, Receipt ID, Menu
├─────────────────────────────────────┤
│ TRANSACTION SUMMARY                 │
├─────────────────────────────────────┤
│ Type:       Receipt                 │
│ Customer:   MLTC                    │
│ Amount:     ₹12,500                 │
│ Method:     Cash                    │
│ Date:       Apr 20, 2024 2:15 PM    │
│ Recorded by: Ramesh (Staff)         │
│                                     │
│ Purpose:    Rent payment            │
│ Notes:      Partial payment for Q1  │
└─────────────────────────────────────┘
├─────────────────────────────────────┤
│ ALLOCATION                          │
├─────────────────────────────────────┤
│ Lot 9823:   ₹6,500 (Rent)           │
│ Lot 9856:   ₹6,000 (Rent)           │
│                                     │
│ Total:      ₹12,500                 │
│ Unallocated: ₹0                     │
└─────────────────────────────────────┘
```

**Scroll Behavior:**
- Header sticky
- Rest scrollable

**Interactions:**
- Tap ⋮ menu → Options (Edit, Delete, Print receipt)
- Tap lot in allocation → Navigate to Lot Details

---

## Global Components

### Search Overlay

Triggered from any tab's search bar or Home search icon.

```
┌─────────────────────────────────────┐
│ 🔍 [Search query...]        ✕       │ ← Active search input, Close button
├─────────────────────────────────────┤
│ RESULTS                             │
├─────────────────────────────────────┤
│ LOTS (13)                            │
│ Lot 11045 • MLTC • Endo 5 Chillies  │
│ Lot 10982 • SKK • Palta Tamarind    │
│ Lot 9823 • GCC • 341 Chillies       │
│ 10 more                             │
├─────────────────────────────────────┤
│ CUSTOMERS (17)                      │
│ MLTC • 97 lots • ₹2.5L pending      │
│ SKK/PKL • 95 lots • ₹45K pending    │
│ 15 more                             │
├─────────────────────────────────────┤
│ PRODUCTS (1)                        │
│ Endo 5 Chillies 40Kg                │
└─────────────────────────────────────┘
```

**Behavior:**
- Searches across all entities (lots, customers, products, transactions)
- Groups results by type (Show X more after first 5 results)
- Tap result → Navigate to detail screen
- Tap ✕ or swipe down → Close overlay
- Works offline (searches cached data)

---

### Warehouse Switcher

Triggered from 👤 menu icon in header.

```
┌─────────────────────────────────────┐
│ SELECT WAREHOUSE                    │
├─────────────────────────────────────┤
│ ✓ Musheerabad Cold Storage          │ ← Current warehouse
│   Address                           │
│                                     │
│   Secunderabad Godown               │
│   Address                           │
│                                     │
│   Kompally Warehouse (Inactive)     │
└─────────────────────────────────────┘
```

**Behavior:**
- Shows all warehouses user has access to
- Current warehouse marked with ✓
- Tap warehouse → Switch context, refresh all data
- Inactive warehouses shown but disabled

---

## Design System Integration

### Colors

**Brand Colors:**
- Primary Orange: #EA580C
- Secondary Teal: #0891B2
- Accent Purple: #7C3AED
- Success Green: #10B981
- Warning Yellow: #F59E0B
- Error Red: #DC2626

**Transaction Type Colors:**
- Lodgement border: Orange (#EA580C)
- Delivery border: Teal (#0891B2)
- Receipt border: Green (#10B981)
- Payment border: Purple (#7C3AED)

**Status Indicators:**
- 🔴 Red: High priority / Stale / High outstanding
- 🟡 Yellow: Medium priority / Aging / Medium outstanding
- 🟢 Green: Good / Fresh / Low/No outstanding

### Typography

- Hero numbers: 32px bold
- Card titles: 20px semibold
- Body text: 16px regular
- Secondary text: 14px regular
- Captions: 12px regular

### Spacing

- Card padding: 16px
- Card gap: 12px
- Section spacing: 24px
- Min tap target: 48px height

### Components

**Search Bar:**
- Height: 48px
- Border radius: 12px
- Background: Light gray (#F3F4F6)
- Icon: 20px, left-aligned
- Placeholder: 16px, gray (#9CA3AF)

**Filter Chips:**
- Height: 36px
- Border radius: 18px
- Active: Solid brand color background, white text
- Inactive: Border only, brand color text
- Tap target: 48px (padding compensation)

**Cards:**
- Border radius: 12px
- Shadow: Subtle (elevation 1)
- Left border: 4px solid (transaction type color)
- Background: White

**FAB:**
- Size: 56px diameter
- Position: Bottom-right, 16px margin
- Background: Primary orange
- Icon: White, 24px
- Shadow: Elevation 6

**KPI Cards:**
- Main metric: 24-32px bold
- Label: 14px regular, gray
- Sub-metrics: 16px regular
- Trend: 14px, with arrow (↑/↓)

---

## Offline-First Architecture

### Data Sync Strategy

**Local Storage (IndexedDB):**
- All transactions cached for last 90 days
- Customer list (full)
- Product catalog (full)
- Current stock snapshot

**Queue Management:**
- New transactions queued locally with UUID
- Sync indicator: "⏳ Syncing..."
- On success: Remove indicator, update local cache
- On failure: "⚠️ Sync failed • Tap to retry"

**Conflict Resolution:**
- Server timestamp wins (last-write-wins)
- User notified if their local change was overwritten

### Network States

**Offline:**
- Gray indicator in header: "🔴 Offline"
- Search works (local data)
- Filters work (local data)
- New transactions queued
- Graphs show cached data with "Updated X hours ago" timestamp

**Online:**
- Auto-sync queued transactions
- Refresh cached data in background
- No indicator (online is default)

**Syncing:**
- Small spinner in header: "↻ Syncing..."
- Minimal UI disruption

---

## Role-Based Visibility

### Staff Role
- Can access: Stock, Money, Parties tabs
- Cannot access: Home tab (redirected to Stock if attempted)
- Cannot edit: Customer details, delete transactions
- Can create: Transactions (lodgements, deliveries, receipts, payments)

### Manager Role
- Full access to all tabs
- Can edit: Transactions, customer details
- Can delete: Transactions (with confirmation)
- Can view: All analytics on Home

### Owner Role
- Full access + admin functions
- Can access: Backend admin panel (warehouse creation, staff invites)
- Can view: All data across all warehouses

---

## Accessibility

### WCAG 2.1 AA Compliance

- Minimum tap targets: 48px × 48px
- Color contrast: All text 4.5:1 minimum
- Focus indicators: Visible on all interactive elements
- Screen reader: All images have alt text, buttons have labels
- Keyboard navigation: Full keyboard support (for future web version)

### Localization

- Primary: English, Telugu
- Date format: DD/MM/YYYY
- Currency: ₹ (INR) with lakhs/crores notation
- Number separators: Indian style (₹2,50,000 not ₹250,000)

---

## Performance Targets

### Mobile (3G Network)
- Initial load: < 3 seconds
- Tab switch: < 500ms
- Search response: < 200ms (local cache)
- Transaction creation: < 1 second (optimistic UI)

### Offline
- All core operations functional
- Search, filters, card navigation work instantly
- New transactions saved locally, synced when online

---

## Future Enhancements (Post-M0)

- Push notifications (rent due, stale stock alerts)
- WhatsApp integration (send receipts, reminders)
- Multi-language (Hindi, Tamil, Bengali)
- Advanced analytics (predictive stale stock, customer churn)
- Rent auto-calculation and invoicing
- Receipt allocation to lots/charges
- Export reports (PDF, Excel)

---

## End of Architecture Document