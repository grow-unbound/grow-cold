# GrowCold Design System v1.0

**Design Philosophy:** Simple & clear. **Grab-inspired** (not affiliated): super-app iOS feel — green brand primary, Tuna dark text, light surfaces, rounded modules. Mobile-first with progressive enhancement.

> "No more paper registers. Things just work." — Core feeling we design for. Visual language follows public Grab-style color roles (e.g. Green Haze) without copying trademark assets or illustrations.

---

## PART 1: COLOR PALETTE & VISUAL IDENTITY

### Primary Color System

```
PRIMARY:     #00B14F (Green Haze — Grab-inspired)
  └─ Usage: Primary actions, focus states, key CTAs, active tab, links (text-primary-600)
  └─ Meaning: Go, success, energy (super-app “drive”)
  └─ White text on primary buttons: AA+ on filled buttons; focus ring: rgba(0, 177, 79, 0.15)

SECONDARY:   Neutrals (e.g. border-neutral-300, text-neutral-800)
  └─ Usage: Secondary / cancel buttons (gray outline on white)
  └─ Meaning: De-emphasized actions vs green primary
  └─ “Outline” variant (green border on white) in Button for strong secondary CTAs

ACCENT:      #7BDCB5 (Bermuda mint) + extended accent scale
  └─ Usage: Alternating row types, highlights, success-adjacent chips (not the main CTA)
  └─ Meaning: Fresh, secondary brand family

DANGER:      #EF4444 (and danger scale in Tailwind)
  └─ Usage: Errors, destructive actions
  └─ Meaning: Unmistakable but not “cold” clinical red

SUCCESS:     success.* scale (e.g. #1FA85A at 500)
  └─ Usage: Status badges, positive lot states, toasts
  └─ Meaning: On-track, cleared, active storage
```

### Neutral Color System (Grays + Tuna)

```
Neutral-50:  #F7F7F8 (Page / shell canvas)
Neutral-200: #E2E4E8 (Borders, dividers)
Neutral-500: #6B7280 (Secondary text)
Neutral-700: #4A505C (Strong secondary text)
Neutral-900: #363A45 (Tuna — headings, high-emphasis body; not pure black)
```

### Status Colors (Semantic)

```
ACTIVE:      success family (e.g. #1FA85A) — in storage
STALE:       warning amber (e.g. #F59E0B)
DELIVERED:   blue (e.g. #3B82F6) — completed transport
CLEARED:     success family — fully paid
WRITTEN_OFF: neutral-400/500 — resolved loss
DISPUTED:    danger / red — needs attention
```

### Dark Mode (Future - v1.1)
When implemented, use neutral dark surfaces; keep **green** accents for primary actions (not the legacy orange look):
```
Background:  #1F2937 (Very dark gray, not black)
Surface:     #374151 (Card backgrounds)
Text:        #F3F4F6 (Light text)
Accents:     Increase saturation (colors pop on dark)
```

---

## PART 2: TYPOGRAPHY SYSTEM

### Font Stack
```
Primary Font:   -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif
Fallback:       Georgia, serif (graceful degradation)
Monospace:      'Monaco', 'Courier New', monospace (for numbers, codes)
```

**Rationale:**
- System fonts: Best readability, native feel (SF on iOS, Roboto on Android)
- Georgia fallback: optional secondary only; body stays sans-first
- No custom webfonts required: fast load, offline-friendly

### Type Scale (Mobile-First)

```
H1 (`text-h1`):     24px | line-height 1.25 | 700 | Page titles, major headers
H2 (`text-h2`):     20px | line-height 1.33 | 700 | Section headings
H3 (`text-h3`):     18px | line-height 1.40 | 600 | Card titles, form sections

Body (`text-base`): 16px | line-height 1.5 | 400 | Body copy, button text, input text (never smaller on inputs — iOS zoom)
Small (`text-body-sm`, `text-sm`): 14px | line-height 1.43 | 400 | Secondary text, help text

Field label (`text-label-lg`): 14px | 600 | `<label>` above inputs (hierarchy vs 16px field text)
Compact label (`text-label`):  12px | 600 | Badges, dense filter chips
Caption (`text-caption`):      12px | 400 | Fine print, timestamps (avoid for critical UI)

Button:             16px | 600 | `text-base`; padding `py-2.5 px-3.5`; min height 44px (`min-h-11` / `min-h-touch`)
```

### Letter-Spacing & Tracking
```
H1, H2, H3:         -0.5px (tighter, more authority)
Body:               0px (optimal readability)
Labels, Buttons:    0.25px (subtle expansion, clarity)
```

### Text Hierarchy
**Clear & scannable (super-app style) means:**
- ✅ Use weight contrast (600 for important, 400 for regular)
- ✅ Use color contrast (Tuna `neutral-900` on light surfaces; **green** for links/CTAs)
- ✅ Generous line-height (not cramped)
- ❌ No all-caps (looks corporate, harder to read)
- ❌ No italics (confuses older readers)
- ❌ No justified text (creates rivers of white space on mobile)

---

## PART 3: SPACING & LAYOUT SYSTEM

### Spacing Scale (Base Unit: 8px)

```
2px:    Micro spacing (borders, dividers)
4px:    Tight spacing (within components)
8px:    Base unit (padding, margins between elements)
12px:   Small spacing
16px:   Default spacing between sections
24px:   Medium spacing
32px:   Large spacing
48px:   Extra large spacing (section breaks)
```

### Padding Rules (Mobile-First)

```
Page:           16px (all sides on mobile)
                24px (all sides on tablet)
                32px (horizontal on desktop)

Card/Section:   16px mobile → 20px tablet → 24px desktop
                Tailwind: `p-4 md:p-5 lg:p-6` on `.card`

Button/Input:   `py-2.5 px-3.5`, min height **44px**; input `border-2`; input text **16px** always
                **16px** text on `<input>` / `<select>` (`text-base`) — prevents iOS zoom

Form Field:     Wrapper `.form-field`: `gap-2` (8px stack)
                Labels: `text-label-lg`; help: `text-sm` (14px); errors: `.error-text` / `text-xs` (12px)
```

### Margin Rules

```
Vertical rhythm: 24px between sections
Horizontal:     16px between columns
Between cards:  16px gap (use CSS grid gap, not margin)
At edges:       Never <16px on mobile, never <32px on desktop
```

### Grid System

```
MOBILE (320-480px):
  12-column grid (works better than 4-col for complex layouts)
  16px gutters
  Single-column content stack

TABLET (481-1024px):
  12-column grid
  24px gutters
  2-3 columns max

DESKTOP (1025px+):
  12-column grid
  32px gutters
  3-4 columns, with sidebar
  Max content width: 1280px (prevents eye strain on wide screens)
```

---

## PART 4: COMPONENT DESIGN PATTERNS

### 4.1 Buttons

#### Primary Button (Main CTA)
```
Background:     #00B14F (Green Haze)
Text:           White (#FFFFFF)
Padding:        10px 14px (44px height minimum, `min-h-11`)
Border-radius:  12px (Grab-style module rounding)
Font:           16px 600 weight
Transition:     200ms ease-out (all properties)

States:
├─ Default:     #00B14F
├─ Hover:       #009948
├─ Active:      #007A3A
├─ Disabled:    #D1D5DB (gray, opacity 0.5)
└─ Loading:     Show spinner inside button

Touch Target:   44px minimum (iOS HIG–style; including padding)
Tap spacing:     Buttons spaced 16px apart minimum
```

#### Secondary Button (Less important action)
```
Background:     White
Border:         2px solid #E2E4E8 (neutral-200)
Text:           #3D424D (neutral-800)
Padding:        10px 14px (44px min height with border, matches primary)

States:
├─ Default:     Gray border, dark gray text
├─ Hover:       #F7F7F8 background (neutral-50)
├─ Active:      Slightly darker gray background
└─ Disabled:    Gray border, gray text
```

Optional **green outline** (`Button` variant `outline`): `border-primary-500`, `text-primary-700`, `hover:bg-primary-50`.

#### Danger Button (Delete, write-off, etc.)
```
Background:     #EF4444 (danger-500)
Text:           White
Padding:        12px 16px
Same as Primary Button but danger red
Requires confirmation modal for destructive actions
```

#### Ghost Button (Tertiary actions)
```
Background:     Transparent
Border:         None
Text:           #009948 (primary-600) or link-style
Padding:        12px 16px
Underline on hover (not color change)
```

### 4.2 Input Fields & Forms

#### Text Input
```
Height:         44px minimum (min-h-11), all viewports
Padding:        10px 14px (py-2.5 px-3.5 in Tailwind utilities)
Border:         2px solid #E2E4E8 (light gray)
Border-radius:  12px
Font:           16px 400 weight (prevents iOS zoom on mobile)
Background:     #FFFFFF (white)

States:
├─ Default:     Gray border
├─ Focus:       2px solid #00B14F, shadow: 0 0 0 3px rgba(0, 177, 79, 0.15)
├─ Error:       2px solid #EF4444
├─ Disabled:    Background #F3F4F6, opacity 0.5
└─ Filled:      Border color darkens to #D1D5DB

Label:
├─ Position:    Above input (not floating, better for old users)
├─ Font:        14px 600 weight
├─ Color:       #374151 (dark gray)
├─ Margin:      0 0 8px 0 (8px below label)

Help Text:
├─ Font:        12px 400 weight
├─ Color:       #6B7280 (medium gray)
├─ Position:    Below input
├─ Margin:      4px 0 0 0

Error Message:
├─ Font:        12px 400 weight
├─ Color:       #DC2626 (danger-600)
├─ Icon:        ⚠ emoji or icon
├─ Position:    Below input, replaces help text
```

#### Form Field Group
```
Spacing:        24px between fields (vertical)
                16px between label and input
Related fields: 12px spacing (e.g., street + city)
Radio/Checkbox: 16px spacing between options

Accessibility:
├─ Every input has <label for="input-id">
├─ Required fields marked with * (red)
├─ Error messages linked to input via aria-describedby
```

### 4.3 Cards & Containers

#### Lot Card (Core component)
```
Background:     #FFFFFF (white)
Border:         1px solid #E2E4E8 (light gray)
Border-radius:  12px
Padding:        16px
Shadow:         0 1px 2px rgba(0,0,0,0.04) (subtle, not heavy)
Spacing:        16px gap between cards (CSS grid)

Hover State:
├─ Shadow:      0 4px 12px rgba(0,0,0,0.1) (lift effect)
├─ Transition:  200ms ease-out
├─ Cursor:      pointer (if clickable)
├─ Scale:       Optional subtle scale(1.02) but use shadow primarily

Structure:
├─ Header:      [Status Badge] [Customer Name]
├─ Body:        Product, bags, days old, outstanding
├─ Footer:      [Action Button]

Status Badge positioning:
├─ Top-right corner
├─ Padding:     4px 8px
├─ Font:        12px 600 weight
├─ Border-radius: 4px
├─ Color by status:
   ├─ ACTIVE:      Green background, white text
   ├─ STALE:       Amber background, dark text
   ├─ CLEARED:     Green background, white text
   └─ DISPUTED:    Red background, white text
```

#### Empty State
```
Illustration:   Brand green tint (primary-100) with simple line art
Heading:        "No lots yet" (H3)
Description:    "Start by adding a lot. Tap the + button."
CTA Button:     "Add Lot" (Primary button)
Spacing:        48px from top, centered
```

---

## PART 5: USER FEEL & PERCEPTION

### 5.1 Loading States & Skeletons

#### Skeleton Screen (Preferred over spinners)
```
Why: Shows structure, feels faster, less "loading" anxiety

Implementation:
├─ Use actual component shapes (LotCard skeleton, not generic box)
├─ Animate:     Subtle left-to-right gradient shimmer
│              Gradient: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)
│              Duration: 1.5s infinite
├─ Color:       #E5E7EB (light gray)
├─ Rounded:     Match final component (8px)
└─ Height:      Match real content (no layout shift)

Skeleton Example:
┌─────────────────────────────┐
│ ▌▌▌▌▌▌▌▌  [Status Badge]   │  ← Customer name skeleton
│ ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌        │  ← Product name skeleton
│ ▌▌▌▌▌▌  24 days old       │  ← Info with real data
│ Outstanding: ▌▌▌▌▌▌▌▌      │  ← Outstanding skeleton
│ [Button skeleton]          │
└─────────────────────────────┘

Show for: 200-500ms (never show skeleton briefly, feels janky)
```

#### Loading Spinner (Only for inline actions)
```
Color:       #00B14F (primary green, not generic gray)
Size:        24px (mobile), 32px (desktop)
Speed:       1200ms per rotation (not too fast)
Animation:   Smooth rotation using CSS @keyframes
Placement:   Inside buttons during submission (replace text)
Text:        "Saving..." or "Syncing..." (show context)
```

#### Progress Indicator (For multi-step processes)
```
Type:        Linear progress bar (not circular for long operations)
Height:      4px (thin, not distracting)
Color:       #00B14F gradient to #7BDCB5
Background:  #E5E7EB (light)
Rounded:     4px
Animation:   Smooth transition (no jumpy increments)
Label:       "Uploading 15 of 50 lots..." (show progress, not just %)
```

### 5.2 Haptic Feedback (Mobile)

```
Primary Action Success:    Medium haptic (HapticFeedback.impactAsync('medium'))
                          Duration: 100ms
                          Use: Delivery recorded, payment confirmed

Warning/Error:             Heavy + light pattern (impact + notification)
                          Duration: 200ms
                          Use: Cannot deliver (blocked), offline conflict

Subtle Confirmation:       Light haptic (HapticFeedback.notificationAsync('Success'))
                          Duration: 50ms
                          Use: Button press, form field complete

Don't overuse haptics:     Max 1-2 per user flow (feels gimmicky otherwise)
                          Skip on desktop (doesn't have haptics anyway)
```

### 5.3 Acknowledge-First Pattern

```
Flow: User action → Immediate acknowledgment → Process in background

Example 1: Recording Delivery
├─ User taps "Record Delivery"
├─ Immediate: ✅ "Delivery recorded!" (green toast, 2s)
├─ Background: Sync to Supabase (show progress in queue icon)
├─ If error: Retry option in offline queue UI

Example 2: Marking Write-off
├─ User taps "Write-off"
├─ Modal: "Are you sure? This lot will be archived."
├─ User confirms
├─ Immediate: Card dims, status changes to WRITTEN_OFF
├─ Acknowledgment: "Write-off recorded" (toast, 2s)
├─ Background: Sync to Supabase
├─ If error: Undo button available

Why:
├─ Makes app feel responsive (no waiting for server)
├─ Offline-friendly (works even without connection)
├─ User confidence (they see change immediately)
├─ Trust (shows us we got their action)
```

### 5.4 Perceived Speed & Transitions

#### Page Transitions
```
Fade-in:       Opacity 0→1 over 200ms
               Timing: ease-out (starts fast, ends slower)
               Don't slide or scale (confusing on mobile)

Overlay/Modal: Fade background, scale modal from 0.95→1
               Duration: 300ms
               Timing: cubic-bezier(0.4, 0, 0.2, 1)

Dismissal:     Fade out, slide down slightly
               Duration: 200ms
               Timing: ease-in (starts slow, ends fast)

Property:      All transitions should include: opacity, transform
               Never: width, height (causes layout thrash)
```

#### Skeleton-to-Content Swap
```
Strategy:      Show skeleton, load data in background
               Once data ready, fade skeleton out (100ms)
               Fade real content in (100ms)
               No layout shift (skeleton matches final size)
```

#### Stagger Effect (Lists)
```
When:          Loading list of lots (LotList component)
Skeleton cards: Show all skeletons at once (not one-by-one)
Swap timing:   Each skeleton fades to real data, staggered by 50ms
               Creates smooth cascading effect
               Total for 10 items: ~500ms (feels responsive)
```

### 5.5 Touch targets & tap feedback

#### Standard UI metrics
```
Min height:     44px primary chrome (`min-h-11` / `min-h-touch` on web)
Width:         No default min-width on text buttons; icon-only: at least 44×44px effective tappable area
Spacing:        ≥8px between adjacent targets (industry / WCAG 2.2 spacing); prefer 12px+ in dense toolbars
Button padding: py-2.5 px-3.5 with `min-h-touch` (HIG-style minimum; product default)
Input height:   `min-h-touch` with 16px (`text-base`) on form fields (iOS focus zoom rule)

Example spacing:
┌─────────────────────────────┐
│ [ Save Button ]             │  ← 44px min height
│                             │  ← ≥8px gap
│ [ Cancel Button ]           │  ← 44px min height
└─────────────────────────────┘
```

#### Visual tap feedback
```
Visual:         Slight darken or highlight (not instant, 50ms delay)
Timing:         Fade back to normal after 100ms (not held, feels laggy)
Color:          Use context (primary green darkens to #007A3A)
Animation:      background-color 100ms ease-out

Never:          0-delay instant feedback (feels unnatural)
                Long-held visual feedback (users confused if action happened)
```

#### Avoid Hover States on Mobile
```
Desktop:        :hover changes button color
Mobile:         No :hover (touch devices don't hover)
Instead:        Use :active (when finger touches down)
               And :focus (for keyboard navigation)

CSS Example:
button {
  background: #00B14F;
  transition: background 200ms ease-out;
}

button:hover {
  background: #009948;  /* Desktop only */
}

button:active {
  background: #007A3A;  /* Mobile + desktop */
}

button:focus {
  outline: 2px solid #00B14F;  /* Keyboard users */
  outline-offset: 2px;
}
```

---

## PART 6: OFFLINE-FIRST UX

### 6.1 Offline Indicator

#### Location: Top Status Bar (Persistent)
```
Online:
├─ Background:  Transparent (not shown)
├─ Status:      Hidden (assume online by default)

Offline:
├─ Background:  #FBBF24 (Warm amber, like caution)
├─ Icon:        WiFi-off icon (or plane mode emoji ✈️)
├─ Text:        "Offline - Changes saved locally" (12px, gray text)
├─ Position:    Top of screen, sticky
├─ Height:      32px (small, not obtrusive)
├─ Padding:     8px 16px
├─ Dismiss:     Auto-hide when back online (fade out, 500ms)
└─ Accessibility: aria-live="polite" (screen reader announces)

Example:
┌──────────────────────────────────────────┐
│ ✈️ Offline - Changes saved locally    │
├──────────────────────────────────────────┤
│ [Lot list continues below]               │
└──────────────────────────────────────────┘
```

### 6.2 Offline Queue UI

#### Where: Small badge in bottom-right (persistent)
```
Not visible:      When online and no pending actions

Pending:
├─ Background:    White card with #E5E7EB border
├─ Position:      Bottom-right corner, 16px margin
├─ Content:       "3 deliveries queued ↻ Syncing..."
├─ Animation:     Rotation indicator (slow spin)
├─ Tap action:    Opens queue details modal

Successful sync:
├─ Change icon:   ✅ Checkmark
├─ Text:          "3 deliveries synced"
├─ Auto-dismiss:  After 2s, fade out
├─ Duration:      200ms fade

Failed sync:
├─ Change icon:   ⚠️ Warning
├─ Background:    #FEF3C7 (light amber)
├─ Text:          "1 delivery failed to sync"
├─ Action:        "Retry" button or expand for details
├─ Stay visible:  Until user taps "Retry" or acknowledges
```

#### Queue Details Modal
```
Trigger:         Tap the queue badge
Title:           "Offline Queue (3 pending)"
Content:         List of queued actions

Per queued item:
├─ Icon:          Status (hourglass ⏳, check ✅, error ⚠️)
├─ Text:          "Delivered 50 bags to Warehouse A - 2 mins ago"
├─ Timestamp:     "Offline since 2:30 PM"
├─ Action:        Remove from queue (swipe or long-press delete)
└─ Manual retry:  "Sync now" button at bottom

Why details matter:
├─ User knows what's pending
├─ Can remove actions if needed
├─ Trust-building (transparency)
├─ Prevents "Where did my delivery go?" support tickets
```

### 6.3 Conflict Resolution UX (Rare but critical)

```
Scenario:        User records delivery offline.
                 Before syncing, manager updates lot online.
                 Conflict when app comes back online.

Flow:
├─ App detects conflict (timestamp-based)
├─ Shows modal: "This lot was updated while you were offline"
├─ Options:
│  ├─ "Use my changes" (trust user, overwrite)
│  ├─ "Use server version" (discard my changes)
│  └─ "Review both" (show both versions side-by-side)
├─ User chooses
├─ Toast: "Conflict resolved" (green)
└─ Queue syncs remaining items

UI:
┌─────────────────────────────────────────┐
│ ⚠️ Conflict Detected                   │
├─────────────────────────────────────────┤
│ Lot: Warehouse A - 50 bags              │
│                                         │
│ Your change:                            │
│   Delivered 50 bags (2:30 PM)          │
│                                         │
│ Server change:                          │
│   Write-off (2:35 PM by Manager)       │
│                                         │
│ [Use My Changes] [Use Server] [Review] │
└─────────────────────────────────────────┘

Which to trust?
├─ Generally: "Use server" (manager decision is authoritative)
├─ But: Give user choice (transparency)
├─ Log conflict to audit (for later review)
```

---

## PART 7: CONTRAST, SEMANTIC HTML & LOCALIZATION

Touch and type **dimensions** for controls live in **Part 4 (components)** and **§5.5** — standard **platform UI** metrics (44px min height, 16px on inputs), not a separate “accessibility sizing” track.

### 7.1 WCAG 2.1 AA–oriented checklist

#### Color Contrast
```
✅ Regular text:       4.5:1 contrast ratio (WCAG AAA)
✅ Large text (18px+): 3:1 contrast ratio (WCAG AA)
✅ Buttons/Links:      4.5:1 contrast ratio
✅ Disabled states:    Test with gray text (should still be readable)

Test tool: WebAIM Contrast Checker
Target palette: verify with WebAIM when changing tokens; typical checks:
  ✅ White on #00B14F (primary button):  meets contrast for large controls
  ✅ #363A45 (Tuna / neutral-900) on #FFFFFF:  strong body/heading contrast
  ✅ #6B7280 (gray) on white:          4.5:1 (AA) for secondary text
  ✅ White on #EF4444 (danger CTA):    verify 4.5:1
```

#### Typography
```
✅ Minimum font size:  14px (12px only for secondary info)
✅ Font family:        System fonts (no script fonts)
✅ Line-height:        1.5 minimum (24px for 16px text)
✅ Letter-spacing:     Normal (not condensed, not expanded too much)
✅ Line length:        50-75 characters (mobile: full width okay)
✅ Justified text:     Never (creates rivers on mobile)
✅ ALL CAPS:           Avoid (harder to read)
✅ Italics:            Avoid (confuses older readers)
```

#### Semantics & Structure
```
✅ Heading hierarchy:  H1 → H2 → H3 (no skipping levels)
✅ <label>:            Every form input has associated label
✅ ARIA:               Use aria-label for icon-only buttons
                      Use aria-describedby for error messages
                      Use aria-live for dynamic content (offline badge)
✅ Landmarks:          <main>, <nav>, <aside> (helps screen readers)
✅ Skip link:          "Skip to main content" link (first focusable element)
✅ Focus indicators:   2px outline, 4px offset (not hidden)
✅ Keyboard nav:       All interactive elements focusable (tab order)
```

#### Form Accessibility
```
✅ Labels:             Position above input (not placeholder)
✅ Required:           Mark with * (red) + aria-required="true"
✅ Error messages:     Linked to input via aria-describedby
✅ Hint text:          "e.g., +919876543210" (helps without relying on placeholder)
✅ Disabled state:     Cursor: not-allowed (shows not interactive)
✅ Success state:      Show checkmark + announce via aria-live
```

#### Images & Icons
```
✅ <img alt="">        All images have descriptive alt text
✅ Icon buttons:       <button aria-label="Add lot">+</button>
✅ Decorative icons:   aria-hidden="true" (screen reader skips)
✅ Chart/data images:  Long description on page or linked
```

#### Color Not Only Cue
```
✅ Don't rely on color alone:
  ❌ "Red items are errors" (colorblind users miss it)
  ✅ "⚠️ Red items are errors" (color + icon + text)
  
✅ Status badges:      Use icon + color + text
   E.g., "✅ CLEARED" (not just green)
   
✅ Error fields:       Red border + red icon + error message text
   (not just red background)
```

### 7.2 Localization Framework

#### Language Support (Phase 1 - MVP)
```
ENGLISH:    Default, full support
TELUGU:     Full support (Andhra Pradesh, Telangana primary market)

Ready for Phase 2:
├─ HINDI:    High priority (national reach)
├─ TAMIL:    Medium priority (Tamil Nadu)
└─ KANNADA:  Medium priority (Karnataka)
```

#### i18n Implementation
```
File structure:
packages/shared/locales/
├─ en/
│  └─ common.json        (600-800 keys)
├─ te/
│  └─ common.json        (same keys, translated)
└─ i18n.ts              (react-i18next config)

Example keys:
{
  "action.addLot": "Add Lot",
  "action.recordDelivery": "Record Delivery",
  "label.customerName": "Customer Name",
  "status.active": "Active",
  "status.stale": "Aging",
  "message.success.delivered": "Delivery recorded successfully",
  "message.error.offline": "Cannot update offline",
  "accessibility.skipLink": "Skip to main content"
}

Component usage:
import { useTranslation } from 'react-i18next';

export function LotCard({ lot }) {
  const { t } = useTranslation();
  return (
    <div>
      <h3>{lot.customerName}</h3>
      <p>{t('status.' + lot.status.toLowerCase())}</p>
      <button>{t('action.recordDelivery')}</button>
    </div>
  );
}
```

#### Language Switcher
```
Location:        Settings page (not in header - not for frequent switching)
Position:        ⚙️ Settings → Appearance → Language
Default:         Device language (if available) or English
Options:         English | తెలుగు | हिन्दी (future) | தமிழ்

Save:            localStorage + Supabase user preferences
Apply:           Immediately (no page reload needed)
Persistence:     Synced across devices (user can switch on mobile, see on web)
```

#### Translation-Friendly UI
```
✅ Avoid:
  ❌ Text embedded in images (can't translate)
  ❌ Hardcoded strings (scattered in code)
  ❌ Concatenated text ("Status: " + status)
  ❌ Placeholder text (often not translated)

✅ Do:
  ✅ All strings in JSON locale files
  ✅ Keys describe context (not "label.1" → "label.customerName")
  ✅ Prepared for 30% text expansion (Telugu/Hindi are longer than English)
  ✅ No text in CSS (use content: attr() or data attributes)
  ✅ Reserve space for longest translations
  ✅ Test with Right-to-Left languages (prepare now, implement later)
```

#### Number & Date Formatting
```
Dates:
├─ Format:       DD/MM/YYYY (Indian standard)
├─ Example:      15/04/2026
├─ Use:          new Intl.DateTimeFormat('en-IN', { ... })
├─ Never:        MM/DD/YYYY (confuses Indian users)

Currency:
├─ Format:       ₹2,50,000 (with commas for lakhs)
├─ Example:      ₹1,50,000 = 1.5 lakhs
├─ Use:          new Intl.NumberFormat('en-IN', { currency: 'INR' })
├─ Display:      "₹2,50,000" (show rupee symbol)

Time:
├─ Format:       24-hour (15:30, not 3:30 PM)
├─ Timezone:     IST (Indian Standard Time, UTC+5:30)
├─ No AM/PM:     Confusing for non-English speakers

Plurals:
├─ English:      1 lot, 2 lots
├─ Telugu:       1 లాట్, 2 లాట్‍ల (rules differ)
├─ Use:          i18next pluralization (handles automatically)
```

---

## PART 8: RESPONSIVE DESIGN & DEVICE DIFFERENTIATION

### 8.1 Breakpoints (Mobile-First)

```
MOBILE:         320px - 480px (primary)
  └─ iPhone SE, older Android, vertical orientation
  └─ Considerations: Single column, large touch targets, minimal scrolling

SMALL MOBILE:   481px - 640px (larger phones)
  └─ iPhone 12/13, modern Android phones
  └─ Still mostly single column, but can show more

TABLET:         641px - 1024px (progressive enhancement)
  └─ iPad, large phones in landscape
  └─ 2-column layouts, sidebar navigation becomes visible
  └─ Show summary + detail view side-by-side

DESKTOP:        1025px + (advanced features)
  └─ Large screens, analytics, admin dashboards
  └─ 3-4 column layouts, complex reports
  └─ Features: CSV bulk import, advanced filtering
```

### 8.2 Mobile Strategy (Core Features)

#### What's Available on Mobile
```
✅ LOGIN PAGE:        Phone OTP login
✅ HOME DASHBOARD:    Summary (10 active lots, outstanding due, pending collections)
✅ INVENTORY:         List of lots (filtered by status), tap to see details
✅ DELIVERY:          Record delivery (camera/barcode or manual entry)
✅ CUSTOMERS:         List of customers with outstanding, record payment
✅ TRANSACTIONS:      List of Payments and Receipts
✅ SEARCH/FILTER:     Find lot by name or ID, filter by status
✅ OFFLINE QUEUE:     See what's pending sync
✅ SETTINGS:          Language, warehouse selection, basic settings
✅ NOTIFICATIONS:     Simple toast/banner alerts
✅ PHONE:             Call customer, WhatsApp (integration)
```

#### What's NOT on Mobile
```
❌ ANALYTICS:         Complex graphs, trends (desktop only)
❌ BULK IMPORT:       CSV upload (desktop only)
❌ AUDIT LOGS:        Detailed history (desktop only)
❌ ADVANCED REPORTS:  Custom date ranges, exports (desktop only)
❌ ADMIN SETTINGS:    Warehouse config, user management (desktop only)
```

#### Mobile Layout Rules
```
Content width:   Full screen (16px margins)
                 No sidebars
                 Single column dominant

Navigation:      Bottom tab bar (5-7 items max)
                 OR hamburger menu
                 NOT top navbar (blocks content space)

Modals:          Full screen (not floating boxes)
                 Scroll inside modal if needed
                 Close button at top-left or -right

Lists:           Full-width cards, 16px gap
                 Infinite scroll OR load more button
                 NOT pagination (bad UX on mobile)

Forms:           One input per row
                 Full width inputs
                 Vertical layout only
                 Submit button at bottom (sticky if long form)

Gestures:        Swipe to dismiss modal (mobile convention)
                 Long-press for context menu (if needed)
                 Pinch to zoom (preserve default)
                 Scroll naturally (no overflow hidden)
```

### 8.3 Tablet Strategy (Progressive Enhancement)

#### What Changes on Tablet
```
Layout:          2-column layout becomes possible
                 ├─ Left: List of lots (half width)
                 └─ Right: Detail view (half width)

Navigation:      Sidebar navigation (left side, always visible)
                 OR larger top navbar with more space

Table layouts:   Can show more columns (now that there's space)
                 ├─ Mobile:  Customer | Status | Days old [Tap for more]
                 └─ Tablet:  Customer | Product | Bags | Days old | Outstanding

Forms:           Can use 2-column layouts for efficiency
                 ├─ Left column:  Customer info
                 └─ Right column: Lot details

Content width:   Max 1024px (prevents stretching)
                 Centered with margins
```

#### Tablet Specific Components
```
Split View:      Master-detail layout (list + detail side-by-side)
                 ├─ Left (40%): List of lots (with search/filter)
                 └─ Right (60%): Selected lot details
                 └─ Back button on detail (hides detail, shows list only)

Sidebar:         Collapsible navigation drawer
                 Position: Left side
                 Width: 240px
                 Can collapse to icons (hamburger) on smaller tablets

Floating menu:   Context menu on right-click or long-press
                 Position: Near tap target
                 Content: Duplicate (mobile) menu items
```

### 8.4 Desktop Strategy (Advanced Features)

#### What Changes on Desktop
```
Layout:          Multi-column with sidebar
                 ├─ Left:    Sidebar nav (240px)
                 ├─ Center:  Main content (auto)
                 └─ Right:   Optional sidebar (analytics, help)

Navigation:      Persistent sidebar (always visible)
                 Top navbar for user profile, logout
                 Breadcrumbs for location awareness

Tables:          Full tables with sorting, filtering, pagination
                 ├─ Columns: All relevant data
                 ├─ Actions: Multi-select, bulk actions
                 └─ Scrolling: Horizontal scroll for overflow

Forms:           2-3 column layouts possible
                 Inline validation
                 Autocomplete dropdowns
                 Keyboard shortcuts (e.g., Cmd+K for search)

Dialogs:         Floating modals (not full-screen)
                 Width: 400-600px
                 Position: Centered
                 Backdrop: Semi-transparent
                 Click-outside to close

Hover states:    Full hover effects (not on mobile)
                 Row highlight on hover
                 Tooltip previews
                 Expanded icons on nav hover
```

#### Desktop-Only Features
```
ANALYTICS DASHBOARD:
├─ 4-column layout
├─ Chart: Lots by status (pie chart)
├─ Chart: Collections trend (line chart)
├─ Table: Top debtors (sortable)
├─ KPI cards: Total stock value, outstanding amount, collection rate

BULK IMPORT:
├─ CSV upload form
├─ Preview (show 5 rows before import)
├─ Progress indicator (how many uploaded)
├─ Results (success count + errors)

AUDIT LOG VIEWER:
├─ Advanced filters (date, user, action, lot)
├─ Full history table (sortable, searchable)
├─ Export to CSV
├─ Timeline view option

ADMIN SETTINGS:
├─ Warehouse configuration
├─ User management (add/remove staff)
├─ Role-based permissions
├─ Billing settings (phase 2)
```

### 8.5 Responsive Breakpoint Usage (CSS/Tailwind)

```
/* Mobile-first */
.lot-card {
  display: block;  /* Full width */
  padding: 16px;
}

/* Tablet */
@media (min-width: 641px) {
  .lot-list {
    display: grid;
    grid-template-columns: 1fr 1fr;  /* 2 columns */
    gap: 24px;
  }
  
  .lot-detail {
    display: block;  /* Now visible on tablet */
  }
}

/* Desktop */
@media (min-width: 1025px) {
  .app-layout {
    display: grid;
    grid-template-columns: 240px 1fr;  /* Sidebar + content */
  }
  
  .lot-list {
    grid-template-columns: repeat(3, 1fr);  /* 3 columns */
  }
  
  .lot-table {
    display: table;  /* Use table layout, not cards */
  }
}
```

### 8.6 Navigation Patterns by Device

#### Mobile Navigation (Bottom Tab Bar)
```
┌────────────────────────────────┐
│         [Lot details]          │
│                                │
│                                │
├────────────────────────────────┤
│ 🏠     📦     💰     💰          ⚙️        │
│ Home   Stock  Pay  Customers  Settings  │
└────────────────────────────────┘

Tabs:
├─ Home:      Dashboard, quick stats
├─ Inventory:     Inventory list, search
├─ Customers:     Inventory list, search
├─ Transactions:       Collections, payment form
├─ Settings:  Language, warehouse, profile

Badge:        Red badge on relevant tab if action needed (e.g., "💰5" = 5 pending collections)
```

#### Tablet Navigation (Sidebar becomes visible)
```
┌─────────┬──────────────────────────┐
│ ⬚ Menu │   [Lot list + detail]     │
├─────────┤                          │
│ 🏠 Home │                          │
│ 📦 Inv  │    [Master-detail view]  │
│ 💰 Customers  │                          │
│ 💰 Transactions  │                          │
│ ⚙️ Settings                        │
│         │                          │
└─────────┴──────────────────────────┘

Sidebar:
├─ Width: 240px
├─ Icons + labels (not just icons)
├─ Current page highlighted
├─ Collapse button (hamburger to hide)
```

#### Desktop Navigation (Full Sidebar + Top Bar)
```
┌───────┬────────────────────────────────┐
│ LOGO  │ Warehouse  🔔  👤 Profile   ⤒  │
├───────┼────────────────────────────────┤
│ 🏠    │                                │
│ Home  │  [Analytics dashboard]         │
│       │                                │
│ 📦    │  [Charts, KPIs]                │
│ Inv   │                                │
│       │                                │
│ 💰    │                                │
│ Customers   │                                │
│       │                                │
│ 💰    │                                │
│ Transactions   │                                │

│ 📊    │                                │
│ Reps  │                                │
│       │                                │
│ ⚙️    │                                │
│ Adm   │                                │
│       │                                │
└───────┴────────────────────────────────┘

Top bar:
├─ Logo on left
├─ Warehouse switcher (if multi-warehouse)
├─ Notifications
├─ User profile dropdown

Sidebar:
├─ 240px width
├─ Icons + labels
├─ Collapse to icons only (hamburger)
├─ Sticky (scroll content, sidebar stays)
```

---

## PART 9: DESIGN TOKENS (Figma/Tailwind Export)

### Color Tokens
```json
{
  "color": {
    "primary": {
      "50": "#E8F8EF",
      "100": "#C4ECD4",
      "500": "#00B14F",
      "600": "#009948",
      "700": "#007A3A"
    },
    "secondary": {
      "500": "#6B7280",
      "700": "#3D4450"
    },
    "accent": {
      "300": "#7BDCB5",
      "500": "#1FB77E"
    },
    "danger": {
      "500": "#EF4444",
      "600": "#DC2626"
    },
    "success": {
      "500": "#1FA85A",
      "600": "#168A4A"
    },
    "neutral": {
      "50": "#F7F7F8",
      "200": "#E2E4E8",
      "500": "#6B7280",
      "900": "#363A45"
    }
  }
}
```

### Typography Tokens
```json
{
  "typography": {
    "h1": {
      "font-size": "24px",
      "font-weight": "700",
      "line-height": "1.25"
    },
    "h2": {
      "font-size": "24px",
      "font-weight": "700",
      "line-height": "1.33"
    },
    "body": {
      "font-size": "16px",
      "font-weight": "400",
      "line-height": "1.5"
    },
    "caption": {
      "font-size": "12px",
      "font-weight": "400",
      "line-height": "1.33"
    }
  }
}
```

### Spacing Tokens
```json
{
  "spacing": {
    "2": "2px",
    "4": "4px",
    "8": "8px",
    "12": "12px",
    "16": "16px",
    "24": "24px",
    "32": "32px",
    "48": "48px"
  }
}
```

---

## PART 10: DESIGN CHECKLIST FOR DEVS

Use this before shipping any feature:

### User Feel
- [ ] Loading state uses skeleton (not spinner)
- [ ] Buttons have :active state (not just :hover)
- [ ] Touch targets ≥40px on primary web controls; ≥8px between adjacent targets
- [ ] Transitions are 200-300ms max
- [ ] Offline indicator visible when offline
- [ ] Acknowledge-first pattern (immediate feedback before sync)

### Accessibility
- [ ] Text color contrast ≥4.5:1
- [ ] Font size ≥13px for secondary copy; **16px** on inputs; labels may use 11px where hierarchy is clear
- [ ] All inputs have labels
- [ ] Error messages linked to inputs
- [ ] Focus indicators visible (2px outline)
- [ ] Form hierarchy (H1 → H2 → H3)

### Responsiveness
- [ ] Mobile (320px) looks good
- [ ] Tablet (768px) split-view works
- [ ] Desktop (1200px) sidebar visible
- [ ] No horizontal scroll on any breakpoint
- [ ] Images responsive (max-width: 100%)
- [ ] Touch targets scale with device

### Localization
- [ ] All strings in i18n JSON (not hardcoded)
- [ ] Dates formatted as DD/MM/YYYY
- [ ] Currency shown as ₹2,50,000
- [ ] No text width assumptions (Telugu is longer)
- [ ] RTL prepared (future-proof)

### Offline
- [ ] Offline state visually indicated
- [ ] Queue visible to user
- [ ] Sync status shown (pending/success/error)
- [ ] Graceful error handling
- [ ] No server calls unless online

---

## DESIGN SYSTEM VERSION CONTROL

| Version | Date       | Changes |
|---------|-----------|---------|
| 1.0     | 2026-04-15 | Initial system (color, typography, components, responsive, offline, semantics, i18n) |
| 1.1     | TBD       | Dark mode, micro-animations library, advanced components |
| 2.0     | TBD       | Major refresh after user feedback from pilots |

---

## NEXT STEPS FOR ENGINEERING

1. **Export design tokens to Tailwind** (create tailwind.config.js with colors, spacing, typography)
2. **Build component library** using tokens (Button, Input, Card, Modal, Skeleton, etc.)
3. **Setup i18n** (react-i18next with JSON locale files)
4. **Create responsive grid** (12-column, CSS Grid or Tailwind)
5. **Test on real devices** (iPhone SE 320px, iPad 768px, desktop 1200px)
6. **Accessibility audit** (use axe DevTools, NVDA screen reader test)
7. **Performance test** (Lighthouse, target >85 score)

---

**Design System Complete. Ready for implementation.** 🎨
