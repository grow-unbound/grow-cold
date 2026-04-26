# Cursor Prompt: Component Sizing Reset to Industry Standards

> **2026-04 (canonical sizing):** Web uses **standard platform UI** metrics: **44px** minimum control height (`min-h-11` / `min-h-touch`), `py-2.5 px-3.5` on primary buttons and inputs, **16px** font on real inputs, and the **H1/H2/H3** scale in [`COMPONENT_SPECS.md`](./COMPONENT_SPECS.md). There is **no separate “accessibility sizing”** layer. Older 48px / “comfort” paragraphs below are **archival**; implement from [`apps/web/tailwind.config.ts`](../apps/web/tailwind.config.ts) and `COMPONENT_SPECS.md`.

Copy this entire prompt and paste it into Cursor. It will fix sizing inconsistencies and update the design system.

---

## SIZING RESET: Fix Component & Font Scale to Industry Standards

**Problem:** Components are inconsistently sized. Padding is too small, buttons are cramped, fonts are misaligned.

**Solution:** Align to proven standards used by WhatsApp, Telegram, iOS apps, and Material Design.

### What You Need to Do

1. **Audit current component sizes** (buttons, inputs, cards, labels)
2. **Reset to standard sizing** following the spec below
3. **Test responsive behavior** (mobile 320px, tablet 768px, desktop 1200px)
4. **Update DESIGN_SYSTEM_V1.md** with final sizes
5. **Validate all components** against the spec

---

## COMPONENT SIZING STANDARDS (Industry-Proven)

### Button Sizing

#### Touch targets (mobile)
```
Minimum height:     44px — **product default** (HIG-style minimum; same for all users)
Padding:            10px vertical × 14px horizontal (py-2.5 px-3.5)
Focus ring offset:  4px (does not change control height)
```

#### Button Dimensions (Actual) — **aligned to repo (2026)**
```
Small / chip:       min-h-10 where needed, tighter px
Regular button:     min-h-11 (44px), py-2.5 px-3.5, text-base 16px (STANDARD)
Large / emphasis:   Optional `sm:` or desktop-only extra padding

RULE: Default mobile chrome is **44px** min height — the standard, not a special mode
```

#### Implementation (Tailwind) — see `.btn-base` in config
```
.btn-primary {
  @apply px-3.5 py-2.5 min-h-11
  @apply text-base font-semibold
  @apply rounded-base transition-all
}
```

**Why 44px?** Matches common **native HIG** guidance for minimum touch height; one consistent product default.

---

### Input Field Sizing

#### Height (Mobile)
```
Input min height:   44px (min-h-11, same as button)
Padding:            py-2.5 px-3.5
Font size:          16px (CRITICAL: prevents iOS zoom on focus)
Line-height:        1.5 (24px)

RULE: **16px** on mobile inputs (platform + iOS zoom behavior)
RULE: 44px min height matches design tokens
```

#### Implementation
```
.input-base {
  @apply px-3.5 py-2.5 min-h-11
  @apply text-base font-normal
  @apply border-2 border-neutral-200
  @apply rounded-base
}

/* 16px font + 1.5 line-height within 44px min height */
```

**Why NOT smaller?**
- iPhone zoom on input if font < 16px (UX nightmare)
- Small inputs feel cheap, users distrust
- 35-60 year olds struggle with small targets
- Consistent with button height (visual harmony)

---

### Form Label & Helper Text Sizing

#### Hierarchy
```
Form Label:         14px font, 600 weight, 8px below input
                    (smaller than body, but still readable)

Help Text:          14px font, 400 weight, 4px below label
                    (same size as label, but lighter weight)

Error Message:      12px font, 400 weight, colored (red)
                    (only for secondary info, never primary)

RULE: Never use font < 12px
RULE: Label smaller than input text (contrast, hierarchy)
```

#### Implementation
```
.form-field {
  @apply flex flex-col gap-2
}

label {
  @apply text-label-lg font-semibold text-neutral-700  /* 14px, 600 */
  @apply mb-1  /* 8px below label */
}

input {
  @apply input-base text-base  /* 16px inside input */
}

.help-text {
  @apply text-label-lg text-neutral-500 font-normal  /* 14px, 400 */
  @apply mt-1  /* 4px above text */
}

.error-text {
  @apply text-sm text-danger-600 font-medium  /* 12px, 600 */
}
```

---

### Card & Container Sizing

#### Spacing Inside Cards
```
Padding:            16px (mobile), 20px (tablet), 24px (desktop)

Example card:
┌─────────────────────────────┐
│  H3 Title (20px, 600w)      │  ← 16px from top
│                             │  ← 16px gap
│  Body text (16px, 400w)     │
│  Additional info (14px)     │
│                             │  ← 16px gap
│  [48px Button]              │  ← 16px from bottom
└─────────────────────────────┘
     16px from edge
```

#### Implementation
```
.card {
  @apply bg-white rounded-base border border-neutral-200
  @apply p-4 md:p-5 lg:p-6  /* 16px mobile, 20px tablet, 24px desktop */
  @apply shadow-sm hover:shadow-lg transition-shadow
}
```

---

### Typography Sizing (Complete Reference)

#### Heading Scale (Consistent with Body)
```
H1: 32px | line-height 1.25 (40px total) | 700 weight
    Usage: Page titles
    Relation: H1 ÷ Body = 32 ÷ 16 = 2x (clear hierarchy)

H2: 24px | line-height 1.33 (32px total) | 700 weight
    Usage: Section headings
    Relation: H2 ÷ Body = 24 ÷ 16 = 1.5x

H3: 20px | line-height 1.4 (28px total) | 600 weight
    Usage: Card titles, subsections
    Relation: H3 ÷ Body = 20 ÷ 16 = 1.25x

Body: 16px | line-height 1.5 (24px total) | 400 weight
      Usage: Paragraphs, input text, button text
      NEVER SMALLER on mobile

Small: 14px | line-height 1.43 (20px total) | 400 weight
       Usage: Secondary text, descriptions
       Relation: Small ÷ Body = 14 ÷ 16 = 0.875x

Label: 12px | line-height 1.33 (16px total) | 600 weight
       Usage: Form labels, badges
       NEVER USE BELOW THIS

Caption: 11px | line-height 1.27 (14px total) | 400 weight
         Usage: Timestamps, fine print only
         AVOID on important elements
```

#### Why This Scale?
- **Base is 16px** (not 14px, not 18px — 16px is universal standard)
- **Ratios are clean:** 2x, 1.5x, 1.25x (easy to scan, clear hierarchy)
- **Min 12px** for labels (legibility on secondary chrome)
- **Line-height >= 1.5** (generous, not cramped)
- **WhatsApp uses similar scale** (16px body, 14px labels, 20px headings)

---

### Spacing System (8px Base Unit)

#### Spacing Scale
```
2px:    Micro (dividers, borders)
4px:    Tight (component internal gaps)
8px:    Base unit
12px:   Small spacing
16px:   Default spacing ← MOST COMMON
24px:   Medium spacing
32px:   Large spacing
48px:   Extra large spacing
```

#### Real Example: Form Field
```
┌─ Outer container gap-2 (8px) ───────────────┐
│                                             │
│  Label (14px)                               │
│  ─ 8px gap (mb-1, shows as 4px visually)  │
│  Input (16px text, 48px height)            │
│  ─ 4px gap (mt-1)                          │
│  Help text (14px)                          │
│                                             │
└─────────────────────────────────────────────┘
```

#### Implementation (Tailwind)
```
.form-field {
  @apply flex flex-col gap-2  /* 8px between all children */
}

label {
  @apply mb-1  /* Override: 4px below label specifically */
}

.help-text {
  @apply mt-1  /* Override: 4px above help text specifically */
}
```

---

### Button & Input: Side-by-Side Spacing

```
┌─────────────────┬────────────────┐
│  [Save Button]  │  [Skip Button]  │  ← 16px gap between
│     48px        │     48px        │
└─────────────────┴────────────────┘
      16px gap
```

#### Implementation
```
.button-group {
  @apply flex gap-4  /* 16px (Tailwind: gap-4 = 16px) */
  @apply max-w-md mx-auto  /* Limit width on desktop */
}

button {
  @apply flex-1  /* Equal width, full space */
}
```

---

## RESET STEPS (For Cursor/Your Developer)

### Step 1: Update tailwind.config.ts

```typescript
// Update typography scale in tailwind.config.ts

extend: {
  fontSize: {
    // Headings
    'h1': ['32px', { lineHeight: '1.25', fontWeight: '700' }],
    'h2': ['24px', { lineHeight: '1.33', fontWeight: '700' }],
    'h3': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
    
    // Body
    'base': ['16px', { lineHeight: '1.5', fontWeight: '400' }],      // DEFAULT
    'sm': ['14px', { lineHeight: '1.43', fontWeight: '400' }],       // Secondary
    'xs': ['12px', { lineHeight: '1.33', fontWeight: '600' }],       // Labels
    'caption': ['11px', { lineHeight: '1.27', fontWeight: '400' }],  // Fine print
  },

  minHeight: {
    'touch': '48px',  // Minimum touch target
  },

  minWidth: {
    'touch': '48px',
  }
}

// Update button utilities
plugins: [
  function ({ addComponents }) {
    addComponents({
      '.btn-primary': {
        '@apply px-4 py-3 min-h-[48px] text-base font-semibold rounded-base': '',
      },
      '.input-base': {
        '@apply px-4 py-3 min-h-[48px] text-base font-normal border-2 rounded-base': '',
      }
    })
  }
]
```

### Step 2: Audit Every Component

Go through each component and verify:

```
Button:
  ✅ Height: 48px minimum (py-3 + min-h-[48px])
  ✅ Padding: 12px vertical, 16px horizontal (px-4 py-3)
  ✅ Font: 16px base (text-base)
  ✅ Spacing to next button: 16px gap

Input:
  ✅ Height: 48px minimum (py-3 + min-h-[48px])
  ✅ Padding: 12px vertical, 16px horizontal (px-4 py-3)
  ✅ Font: 16px ALWAYS (text-base, not smaller)
  ✅ Line-height: 1.5 (24px)

Form Field:
  ✅ Label font: 14px (text-sm or text-label-lg)
  ✅ Label gap: 8px below (mb-2)
  ✅ Input height: 48px
  ✅ Help text: 14px, below input

Card:
  ✅ Padding: 16px (mobile), 20px (tablet), 24px (desktop)
  ✅ Title (H3): 20px, 600 weight
  ✅ Body: 16px, 400 weight
  ✅ Spacing inside: 16px gaps between sections

Heading Hierarchy:
  ✅ H1: 32px, 1.25 line-height
  ✅ H2: 24px, 1.33 line-height
  ✅ H3: 20px, 1.4 line-height
  ✅ Body: 16px, 1.5 line-height (baseline)
```

### Step 3: Fix Inconsistencies

Search for these anti-patterns:

```
❌ text-sm on button (14px, should be 16px)
❌ py-2 on input (8px, should be 12px = py-3)
❌ h-10 on button (40px, should be 48px = h-12)
❌ text-xs on form label (12px okay, but double-check)
❌ gap-2 between buttons (8px, should be 16px = gap-4)
❌ p-3 on card (12px, should be 16px = p-4)
```

Replace with:
```
✅ text-base on button
✅ py-3 on input
✅ min-h-[48px] on button
✅ text-sm or text-xs on labels (14px or 12px)
✅ gap-4 between buttons (16px)
✅ p-4 on card (16px mobile)
```

### Step 4: Test Responsive

On each breakpoint:

```
Mobile (320px):
  ✅ Button: 48px height, full width
  ✅ Input: 48px height, full width
  ✅ Text: 16px base, readable
  ✅ Gap between elements: 16px
  ✅ Card padding: 16px

Tablet (768px):
  ✅ Button: Still 48px height, now limited width
  ✅ Input: Still 48px height
  ✅ Text: Same sizes (no jump)
  ✅ Card padding: 20px (increased)

Desktop (1200px):
  ✅ Button: 48px height still (or 56px for emphasis)
  ✅ Input: 48px height still (or 44px if needed)
  ✅ Text: Same sizes
  ✅ Card padding: 24px (max)
```

---

## UPDATE DESIGN_SYSTEM_V1.md

After making changes, update the spec:

```markdown
## UPDATED: Component Sizing (platform standard)

### Button Sizing
- **Height:** 44px minimum (`min-h-11` / `min-h-touch`)
- **Padding:** 10px vertical × 14px horizontal (py-2.5 px-3.5)
- **Font:** 16px base (text-base on labels)
- **Standard reference:** Apple HIG minimum touch, common native app density

### Input Field Sizing
- **Height:** 44px minimum (same as button)
- **Padding:** py-2.5 px-3.5
- **Font:** 16px (`text-base` on `<input>` — iOS does not zoom on focus)
- **Line-height:** 1.5

### Form Field Structure
- **Label:** 14px, 600 weight (text-sm or text-label-lg)
- **Label-to-input gap:** 8px (mb-2)
- **Input:** 44px min height, 16px font
- **Input-to-help gap:** 4px (mt-1)
- **Help text:** 14px, 400 weight (text-sm)
- **Error text:** 12px, 600 weight, red (text-xs, text-danger-600)

### Card & Container Padding
- **Mobile (320-480px):** 16px (p-4)
- **Tablet (481-1024px):** 20px (p-5)
- **Desktop (1025px+):** 24px (p-6)
- **Responsive:** p-4 md:p-5 lg:p-6

### Typography Scale (Complete)
- **H1:** 32px, line-height 1.25
- **H2:** 24px, line-height 1.33
- **H3:** 20px, line-height 1.4
- **Body:** 16px, line-height 1.5 (baseline)
- **Small:** 14px, line-height 1.43
- **Label:** 12px, line-height 1.33
- **Caption:** 11px, line-height 1.27 (rare use)

### Spacing System (8px base unit)
- **Base:** 8px
- **Common:** 16px (gap between buttons, card padding mobile)
- **Increased:** 24px (section spacing)
- **Max:** 32px-48px (major section breaks)

### Industry Standards Referenced
- **iOS Human Interface Guidelines:** 44px minimum, 16px font
- **Material Design:** 48px recommended, 16px base font
- **WhatsApp:** Similar scale (16px body, 14px labels, 48px buttons)
- **Telegram:** 48px buttons, 16px input font
- **Standard Practice:** All major apps use similar proportions
```

---

## VALIDATION CHECKLIST

Run through this after making changes:

```
Design System Alignment:
  [ ] All buttons: 48px height
  [ ] All inputs: 48px height, 16px font
  [ ] Button/Input spacing: 16px gap
  [ ] Form labels: 14px
  [ ] Form label-to-input gap: 8px
  [ ] Card padding: 16px/20px/24px by breakpoint
  [ ] Typography scale: H1 32, H2 24, H3 20, Body 16, Small 14, Label 12
  [ ] No font sizes < 12px (except caption, rare)
  [ ] No touch targets < 44px on mobile

Responsive Testing:
  [ ] Mobile (320px): Buttons full-width, 48px height, 16px font
  [ ] Tablet (768px): Buttons limited width, still 48px, same font
  [ ] Desktop (1200px): Buttons wider, same sizing, card padding 24px

Visual Consistency:
  [ ] All buttons same height (48px)
  [ ] All inputs same height (48px)
  [ ] Form labels aligned (same font size)
  [ ] Card padding consistent by breakpoint
  [ ] No "odd" text sizing (text smaller than container padding)

Accessibility:
  [ ] Color contrast: 4.5:1 minimum (already in spec)
  [ ] Font size: >= 14px for body text, >= 12px for labels
  [ ] Touch targets: 48px minimum
  [ ] Line-height: >= 1.5 for readability
  [ ] Focus indicators: Visible (2px outline, 4px offset)
```

---

## TESTING COMMAND

After reset, test with:

```bash
# Build tailwind CSS
npm run build:tailwind

# Or if using Next.js
npm run dev

# Check button/input appearance
# Look for:
# ✅ Buttons: Comfortable padding, readable text, 48px height
# ✅ Inputs: Text inside, not cramped, 48px height
# ✅ Forms: Label → gap → Input → gap → Help (clear hierarchy)
# ✅ Cards: Generous padding, breathing room
# ✅ Text: Readable, not too big, not too small, hierarchy clear
```

---

## SUMMARY

**What changed:**
- Button height: 48px (minimum industry standard)
- Input height: 48px (consistent with button)
- Input font: 16px always (prevents iOS zoom)
- Form label: 14px (smaller than input text, clear hierarchy)
- Card padding: 16px mobile, 20px tablet, 24px desktop (scales by breakpoint)
- Typography: Clear ratios (32, 24, 20, 16, 14, 12 — easy to remember)

**Why:**
- **48px buttons/inputs:** Industry standard (Material, iOS, WhatsApp, Telegram)
- **16px input font:** Prevents iOS zoom bug, improves UX
- **14px labels:** Smaller than input (visual hierarchy), still readable
- **Scaled padding:** Responsive, breathing room on all devices
- **Clear ratios:** 2x, 1.5x, 1.25x makes hierarchy obvious

**Test:**
- Mobile: Buttons full-width, 48px, readable
- Tablet: Buttons limited width, same sizing, card padding 20px
- Desktop: Buttons normal width, card padding 24px
- Responsive: No size jump between breakpoints (text stays 16px)

**Result:** Professional, accessible, consistent with every major app.

---

**After reset, everything should feel comfortable. Not cramped, not oversized. Just right.** ✅