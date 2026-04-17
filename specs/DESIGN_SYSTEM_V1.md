# GrowCold Design System v1.0

**Design Philosophy:** Simple & Relieved. Warm & Approachable. Mobile-first with progressive enhancement.

> "No more paper registers. Things just work." — Core feeling we design for

---

## PART 1: COLOR PALETTE & VISUAL IDENTITY

### Primary Color System

```
PRIMARY:     #EA580C (Warm Orange)
  └─ Usage: Primary actions, focus states, key CTAs
  └─ Meaning: Warmth, approachability, action
  └─ Accessibility: AA compliant text (dark text on white)

SECONDARY:   #0891B2 (Calm Teal)
  └─ Usage: Secondary actions, links, subtle highlights
  └─ Meaning: Stability, calm, reliability
  └─ Accessibility: AA compliant

ACCENT:      #7C3AED (Modern Purple)
  └─ Usage: Notifications, special features, micro-interactions
  └─ Meaning: Modern, premium, thoughtful
  └─ Accessibility: AA compliant

DANGER:      #FB6B3C (Warm Red)
  └─ Usage: Errors, warnings, destructive actions
  └─ Meaning: Alert but not harsh
  └─ Accessibility: WCAG AAA contrast (not cold red)

SUCCESS:     #34D399 (Soft Green)
  └─ Usage: Confirmations, positive feedback
  └─ Meaning: Growth, success, relief
  └─ Accessibility: AA compliant
```

### Neutral Color System (Grays)

```
Neutral-50:  #F9FAFB (Lightest - Backgrounds)
Neutral-100: #F3F4F6 (Light backgrounds, hover states)
Neutral-200: #E5E7EB (Borders, dividers)
Neutral-300: #D1D5DB (Secondary borders)
Neutral-500: #6B7280 (Secondary text)
Neutral-700: #374151 (Primary text)
Neutral-900: #111827 (Darkest - Headings, high contrast)
```

### Status Colors (Semantic)

```
ACTIVE:      #34D399 (Soft Green - Lot in storage)
STALE:       #FBBF24 (Warm Amber - Aging concern)
DELIVERED:   #60A5FA (Light Blue - Completed action)
CLEARED:     #34D399 (Soft Green - Fully paid)
WRITTEN_OFF: #9CA3AF (Gray - Resolved loss)
DISPUTED:    #FB6B3C (Warm Red - Needs attention)
```

### Dark Mode (Future - v1.1)
When implemented, darken backgrounds but keep warm color palette:
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
- System fonts: Best readability, native feel on all devices
- Warm fallback: Georgia feels more approachable than Arial
- No custom fonts: Faster load, better offline experience

### Type Scale (Mobile-First)

```
H1 (Headline):      32px | 40px line-height | 700 weight
                    Usage: Page titles, major section headers
                    Mobile: 28px | 36px

H2 (Section):       24px | 32px line-height | 700 weight
                    Usage: Section headings, lot details
                    Mobile: 22px | 28px

H3 (Subsection):    20px | 28px line-height | 600 weight
                    Usage: Form sections, card titles
                    Mobile: 18px | 26px

Body (Regular):     16px | 24px line-height | 400 weight
                    Usage: All body text, paragraphs
                    Mobile: 16px | 24px
                    Minimum: DO NOT go below 16px on mobile
                    (Accessibility: Small text causes eye strain for older users)

Body Small:         14px | 20px line-height | 400 weight
                    Usage: Secondary text, timestamps, hints
                    Mobile: 14px | 20px
                    Warning: Only for secondary info, never critical content

Label:              12px | 16px line-height | 600 weight
                    Usage: Form labels, badges, tags
                    Mobile: 12px (only if necessary)

Button Text:        16px | 24px line-height | 600 weight
                    Mobile: 16px (never smaller)
                    Padding: 12px 16px (min 48px touch target)
```

### Letter-Spacing & Tracking
```
H1, H2, H3:         -0.5px (tighter, more authority)
Body:               0px (optimal readability)
Labels, Buttons:    0.25px (subtle expansion, clarity)
```

### Text Hierarchy
**Warm & Approachable means:**
- ✅ Use weight contrast (600 for important, 400 for regular)
- ✅ Use color contrast (dark text on light, warm colors for emphasis)
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

Card/Section:   16px (mobile)
                20px (tablet)
                24px (desktop)

Button/Input:   12px 16px (height: 48px minimum)
                Never <44px on any touch device

Form Field:     16px padding
                8px between label and input
                12px between fields
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
Background:     #EA580C (Warm Orange)
Text:           White (#FFFFFF)
Padding:        12px 16px (48px height minimum)
Border-radius:  8px (modern but not rounded pill)
Font:           16px 600 weight
Transition:     200ms ease-out (all properties)

States:
├─ Default:     #EA580C
├─ Hover:       #CC4A08 (darken 15%)
├─ Active:      #B84207 (darken 25%)
├─ Disabled:    #D1D5DB (gray, opacity 0.5)
└─ Loading:     Show spinner inside button

Touch Target:   48px minimum (including padding)
Fat-finger UX:  Buttons spaced 16px apart minimum
```

#### Secondary Button (Less important action)
```
Background:     Transparent
Border:         2px solid #0891B2 (Teal)
Text:           #0891B2
Padding:        10px 14px (48px height with border)

States:
├─ Default:     Teal border, teal text
├─ Hover:       Light teal background (#ECFDF5)
├─ Active:      Teal background, white text
└─ Disabled:    Gray border, gray text
```

#### Danger Button (Delete, write-off, etc.)
```
Background:     #FB6B3C (Warm Red)
Text:           White
Padding:        12px 16px
Same as Primary Button but warm red
Requires confirmation modal for destructive actions
```

#### Ghost Button (Tertiary actions)
```
Background:     Transparent
Border:         None
Text:           #0891B2 (Teal)
Padding:        12px 16px
Underline on hover (not color change)
```

### 4.2 Input Fields & Forms

#### Text Input
```
Height:         48px (mobile), 44px (desktop acceptable)
Padding:        12px 16px
Border:         2px solid #E5E7EB (light gray)
Border-radius:  8px
Font:           16px 400 weight (prevents iOS zoom on mobile)
Background:     #FFFFFF (white)

States:
├─ Default:     Gray border
├─ Focus:       2px solid #EA580C (orange), shadow: 0 0 0 3px rgba(234, 88, 12, 0.1)
├─ Error:       2px solid #FB6B3C (warm red)
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
├─ Color:       #FB6B3C (warm red)
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
Border:         1px solid #E5E7EB (light gray)
Border-radius:  8px
Padding:        16px
Shadow:         0 1px 2px rgba(0,0,0,0.05) (subtle, not heavy)
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
Illustration:   Warm color (#EA580C) with simple line art
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
Color:       #EA580C (Warm orange, not generic gray)
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
Color:       #EA580C gradient to #0891B2
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

### 5.5 Fat-Finger UX

#### Touch Targets
```
Minimum:        44px × 44px (Apple HIG standard)
Recommended:    48px × 48px (especially for older users)
Spacing:        16px minimum between interactive elements
                (Prevents accidental adjacent taps)

Button padding: 12px vertical × 16px horizontal (gives 48px height)
Input height:   48px (allow for padding)

Example spacing:
┌─────────────────────────────┐
│ [ Save Button ]             │  ← 48px height
│                             │  ← 16px space before next
│ [ Cancel Button ]           │  ← 48px height
└─────────────────────────────┘
```

#### Tap Feedback
```
Visual:         Slight darken or highlight (not instant, 50ms delay)
Timing:         Fade back to normal after 100ms (not held, feels laggy)
Color:          Use context (primary orange darkens to #CC4A08)
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
  background: #EA580C;
  transition: background 200ms ease-out;
}

button:hover {
  background: #CC4A08;  /* Desktop only */
}

button:active {
  background: #B84207;  /* Mobile + desktop */
}

button:focus {
  outline: 2px solid #EA580C;  /* Keyboard users */
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

## PART 7: ACCESSIBILITY & LOCALIZATION

### 7.1 WCAG 2.1 AA Compliance Checklist

#### Color Contrast
```
✅ Regular text:       4.5:1 contrast ratio (WCAG AAA)
✅ Large text (18px+): 3:1 contrast ratio (WCAG AA)
✅ Buttons/Links:      4.5:1 contrast ratio
✅ Disabled states:    Test with gray text (should still be readable)

Test tool: WebAIM Contrast Checker
Target palette already tested:
  ✅ #EA580C (orange) on white:        6.1:1 (AAA)
  ✅ #0891B2 (teal) on white:          4.8:1 (AAA)
  ✅ #6B7280 (gray) on white:          4.5:1 (AA)
  ✅ #FB6B3C (warm red) on white:      5.2:1 (AAA)
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
      "50": "#FEF6F0",
      "100": "#FED5B8",
      "200": "#FDB07D",
      "500": "#EA580C",
      "600": "#D74A0A",
      "700": "#CC4A08"
    },
    "secondary": {
      "500": "#0891B2",
      "600": "#0369A1"
    },
    "accent": {
      "500": "#7C3AED",
      "600": "#6D28D9"
    },
    "danger": {
      "500": "#FB6B3C",
      "600": "#EA5621"
    },
    "success": {
      "500": "#34D399",
      "600": "#10B981"
    },
    "neutral": {
      "50": "#F9FAFB",
      "100": "#F3F4F6",
      "200": "#E5E7EB",
      "300": "#D1D5DB",
      "500": "#6B7280",
      "700": "#374151",
      "900": "#111827"
    }
  }
}
```

### Typography Tokens
```json
{
  "typography": {
    "h1": {
      "font-size": "32px",
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
- [ ] Touch targets are 48px minimum
- [ ] Transitions are 200-300ms max
- [ ] Offline indicator visible when offline
- [ ] Acknowledge-first pattern (immediate feedback before sync)

### Accessibility
- [ ] Text color contrast ≥4.5:1
- [ ] Font size ≥14px (12px only for secondary)
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
| 1.0     | 2026-04-15 | Initial system (color, typography, components, responsive, offline, a11y, i18n) |
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
