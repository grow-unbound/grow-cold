# GrowCold — Design System Reset Spec
*Audited: 26 Apr 2026 | Reference: Grab mobile app*

---

## TL;DR — Priority Fix Order

| # | Issue | Effort | Impact |
|---|---|---|---|
| 1 | Unify active/selected color (green everywhere, kill orange) | Low | Highest |
| 2 | Reset button/chip heights to visual scale, not accessibility scale | Medium | High |
| 3 | Collapse to 1 border radius system | Low | High |
| 4 | Collapse text colors to 3 | Low | Medium |
| 5 | Fix modal design inconsistency | Medium | Medium |
| 6 | Remove/integrate the "N" debug badge | Low | Medium |
| 7 | Fix desktop sidebar proportions | Low | Low |

---

## 1. Color Tokens — The Only Colors You Should Use

### Brand Colors (replace all current orange active states)
```
Primary Green:     #00B14F   (bg-[#00B14F])        — FAB, primary CTA, active states
Primary Green Dark:#00913F   (hover state)
Light Green BG:    #E8F8EF   (bg-[#E8F8EF])         — selected chip bg, nav active bg
Green Text:        #006030   (text-[#006030])        — links, highlights

DELETE:  #F97316 (orange-500) — currently used for active chips, toggles, tab underlines
DELETE:  #10B981 (emerald-500) — rogue green, not brand
```

### Neutral Scale
```
Text Primary:      #1A1A1A   (text-[#1A1A1A])       — headings, values
Text Secondary:    #6B7280   (text-gray-500)         — labels, metadata
Text Disabled:     #9CA3AF   (text-gray-400)         — placeholders, disabled
Border:            #E5E7EB   (border-gray-200)
Background:        #F7F7F8   (bg-[#F7F7F8])          — page bg
Card BG:           #FFFFFF   (bg-white)

DELETE all variants: #363A45, #5C637O, #9A9CAD, #141413, #4A505C, #74505C
— replace everything with the 3 text values above
```

### Semantic Colors
```
Danger/Overdue:    #DC2626   (text-red-600)
Warning:           #D97706   (text-amber-600)
Success:           #16A34A   (text-green-600)
```

---

## 2. Typography Scale — 3 Sizes Only

Replace the current 6-size mess (11/12/14/16/18/20px) with:

```css
/* In your tailwind.config.js, define these custom sizes or use these Tailwind classes */

.text-xs    → 11px / line-height: 16px  — metadata only (timestamps, updated at)
.text-sm    → 13px / line-height: 20px  — labels, secondary info, filter chip text
.text-base  → 15px / line-height: 22px  — body, list items, form fields  ← ADD THIS SIZE
.text-lg    → 18px / line-height: 26px  — section values (₹12,75,304), card titles
.text-xl    → 22px / line-height: 30px  — screen titles (use sparingly)
```

**Font weights — keep only 2:**
- `font-medium` (500) — body, labels
- `font-semibold` (600) — values, CTAs, active states

**DELETE** `font-bold` (700) — nothing needs to be that heavy at these sizes.

### Section Header Pattern (replace ALL CAPS)
```jsx
// BEFORE:
<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">TODAY'S ACTIVITY</p>

// AFTER:
<p className="text-sm font-semibold text-gray-500">Today's activity</p>
```
Drop ALL CAPS. Use sentence case with `font-semibold` at `text-sm`. Reserve uppercase for single-letter codes/abbreviations.

---

## 3. Spacing & Sizing System

### Touch Target Rule
The minimum tap area is 44×44px (Apple HIG) but the **visual height** should match the component's role:

```
Touch target: min 44px (use padding on a wrapper, not min-h on the visual element)
Visual chip/tag: 28–32px
Visual button (secondary): 36px
Visual button (primary): 44px
Visual input field: 44px
Bottom nav item: 48px touch area (current is correct)
FAB: 52px (can go to 56px, current is fine)
```

### Implementation Pattern
```jsx
// WRONG — forces visual bloat:
<button className="min-h-touch rounded-full px-4 py-2 text-sm">All</button>
// Results in 48px visual height for a chip label

// RIGHT — separates tap area from visual size:
<button className="relative px-3 py-1.5 rounded-full text-sm
                   before:absolute before:inset-x-0 before:-inset-y-2">
  All
</button>
// Visual: ~28px. Tap area: ~44px via pseudo-element expansion
```

---

## 4. Border Radius System — 3 Values Only

```
Chips / Pills / Avatars:   rounded-full (9999px)  — filter chips, status badges, nav pills
Cards / Modals / Drawers:  rounded-xl  (12px)     — all cards and modal containers
Inputs / Buttons:          rounded-lg  (8px)       — form fields, primary/secondary buttons

DELETE: rounded-[18px], rounded-[16px] — not part of the system
```

---

## 5. Button Hierarchy — Unified Spec

### Primary CTA (Save, Submit, Add)
```jsx
<button className="h-11 px-6 rounded-lg bg-[#00B14F] text-white text-base font-semibold
                   active:bg-[#00913F] disabled:opacity-40">
  Save
</button>
```

### Secondary CTA (Cancel, Back)
```jsx
<button className="h-11 px-6 rounded-lg border border-gray-200 bg-white text-[#1A1A1A]
                   text-base font-medium active:bg-gray-50">
  Cancel
</button>
```
**Note:** Cancel and Save must be the **same height**. Currently Cancel is 52px and Save is ~40px — this is wrong.

### Filter Chip (All / Lodgements / Active)
```jsx
// Unselected:
<button className="px-3 py-1.5 rounded-full border border-gray-200 bg-white
                   text-sm font-medium text-gray-600">
  Lodgements
</button>

// Selected — GREEN, not orange:
<button className="px-3 py-1.5 rounded-full bg-[#00B14F] border border-[#00B14F]
                   text-sm font-medium text-white">
  All
</button>
```

### Modal Toggle (Lodgement/Delivery, Receipt/Payment)
```jsx
// Container:
<div className="flex rounded-lg bg-gray-100 p-1 gap-1">

  // Active tab — GREEN:
  <button className="flex-1 h-9 rounded-md bg-[#00B14F] text-white text-sm font-semibold">
    Delivery
  </button>

  // Inactive tab:
  <button className="flex-1 h-9 rounded-md bg-transparent text-gray-500 text-sm font-medium">
    Lodgement
  </button>
</div>
```

### Payment Method Chips (CASH / UPI / CHEQUE)
Same pattern as Filter Chip above. Remove the `border-neutral-800` filled variant for CASH — use the green selected state instead.

---

## 6. Tab Underline Pattern (Lots / Receipts)

```jsx
// Container:
<div className="flex border-b border-gray-100">

  // Active — green underline, NOT orange:
  <button className="flex-1 py-3 text-sm font-semibold text-[#00B14F]
                     border-b-2 border-[#00B14F]">
    Lots
  </button>

  // Inactive:
  <button className="flex-1 py-3 text-sm font-medium text-gray-400 border-b-2 border-transparent">
    Receipts
  </button>
</div>
```

---

## 7. Bottom Nav — Mobile

Current is mostly fine. Two changes:

1. **Active pill background**: Change from the current wide pill that wraps both icon+text to a narrower pill that wraps the icon only (like Grab). The label goes below, always visible whether active or not.

```jsx
// CURRENT: wide pill wraps icon + text label
// TARGET:

<button className="flex flex-col items-center gap-0.5 min-w-[56px] py-2">
  {/* Active: icon gets a pill bg */}
  <span className={cn(
    "flex items-center justify-center w-12 h-7 rounded-full",
    isActive ? "bg-[#E8F8EF]" : ""
  )}>
    <HomeIcon className={isActive ? "text-[#00B14F]" : "text-gray-400"} size={20} />
  </span>
  <span className={cn("text-xs", isActive ? "text-[#00B14F] font-semibold" : "text-gray-400 font-medium")}>
    Home
  </span>
</button>
```

2. **"Transactions" label is too long** — it clips on 320px screens. Shorten to "Payments" or abbreviate.

---

## 8. Desktop Sidebar

The sidebar is scaled like a mobile nav dropped into a column. Tighten it:

```jsx
// Sidebar width: 160px (currently ~190px)
// Nav item height: 36px (currently ~48px)
// Font size: text-sm (currently text-base/18px)
// Active state: left accent bar + light green bg — NOT the wide pill

<a className={cn(
  "flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm font-medium mx-2",
  isActive
    ? "bg-[#E8F8EF] text-[#00B14F] font-semibold"
    : "text-gray-600 hover:bg-gray-50"
)}>
  <Icon size={16} />
  Home
</a>
```

---

## 9. "N" Badge — Action Required

The persistent dark "N" circle in the bottom-left appears on every screen and overlaps the bottom nav. Likely an offline sync indicator from the service worker.

**If it's an offline indicator:** Replace with an unobtrusive top banner that only appears when actually offline:
```jsx
// Only show when offline:
{!isOnline && (
  <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-xs text-center py-1.5 font-medium">
    No internet — changes will sync when connected
  </div>
)}
```

**If it's a debug artifact:** Remove entirely from production build.

---

## 10. Section Headers — Consolidate Style

```jsx
// One pattern for all section labels:
<h3 className="text-sm font-semibold text-gray-500 mb-3">Today's activity</h3>

// "Needs Attention" — use a colored left border, not red-orange uppercase text:
<div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border-l-4 border-red-500">
  <AlertIcon size={16} className="text-red-500 mt-0.5 shrink-0" />
  <div>
    <p className="text-sm font-semibold text-red-700">Needs attention</p>
    <p className="text-sm text-red-600 mt-0.5">3229 lots aged over 1 year</p>
  </div>
</div>
```

---

## Summary Diff — What Tailwind Classes to Find & Replace

| Find | Replace With | Where |
|---|---|---|
| `bg-orange-500` / `bg-[#F97316]` | `bg-[#00B14F]` | Active chips, toggles |
| `border-orange-500` / `border-[#F97316]` | `border-[#00B14F]` | Active chip borders |
| `text-orange-600` | `text-[#00B14F]` | Active tab text |
| `border-b-2 border-orange-500` | `border-b-2 border-[#00B14F]` | Underline tabs |
| `min-h-touch` on chips | `py-1.5` with larger tap area | Filter chips, payment chips |
| `rounded-[18px]` / `rounded-[16px]` | `rounded-xl` (12px) or `rounded-lg` (8px) | Cards, buttons |
| `font-bold` | `font-semibold` | Everywhere |
| `text-xs uppercase tracking-wide` | `text-sm font-semibold text-gray-500` | Section headers |
| `bg-neutral-800 text-white` on CASH chip | Green selected state above | Payment method chips |

---

*End of spec. Implement Priority 1 (color unification) first — it'll deliver 60% of the visual improvement for 15% of the effort.*
