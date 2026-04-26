# Component Sizing Fix: What You Need to Do

**Problem:** Elements are oddly sized — buttons/inputs too small, text too big relative to padding, inconsistent spacing.

**Root Cause:** No clear sizing standard when Cursor implemented design system. Each component ended up different (40px button, 44px input, 14px button text, etc.).

**Solution:** Reset to industry standard (WhatsApp, Telegram, iOS, Material Design) and lock it in.

---

**2026-04 — Standard UI sizing:** Product UI uses **44px** minimum touch height (`min-h-11` / `min-h-touch`) per **Apple HIG / common native-app defaults**. **16px** on real inputs (iOS focus zoom). No parallel “accessibility size” layer — this **is** the spec.

## What To Do (3 Steps)

### Step 1: Copy the Cursor Prompt
**File:** `/mnt/project/CURSOR_PROMPT_SIZING_RESET.md`

**Action:**
1. Open the file above
2. Copy **entire content**
3. Paste into Cursor chat
4. Let Cursor follow the instructions

**What the prompt does:**
- Explains app-native standard (**44px** min touch height, 16px input fonts, etc.)
- Audits current components for issues
- Fixes sizing in tailwind.config.ts
- Updates DESIGN_SYSTEM_V1.md with new standards
- Includes validation checklist

**Time:** 1-2 hours for Cursor to complete

---

### Step 2: Understand the Standard

| Component | Size | Why |
|-----------|------|-----|
| **Button height** | 44px | `min-h-11` / `min-h-touch` (platform-style default) |
| **Input height** | 44px | Aligned to buttons; **16px** font always on inputs (iOS zoom) |
| **Button/Input font** | 16px | Readable, prevents iOS zoom bug on inputs |
| **Form label** | 14px | Smaller than input (hierarchy), still readable |
| **Card padding (mobile)** | 16px | Responsive, not cramped |
| **Typography base** | 16px | All body text (baseline) |

**The Rule:** Touch targets **≥44px** (never below iOS HIG minimum); real inputs never smaller than **16px** font.

---

### Step 3: Validate After Fix

**Checklist to verify Cursor fixed it correctly:**

```
Buttons:
  ✅ All buttons: py-2.5 px-3.5 min-h-11 (44px)
  ✅ Button text: text-base (16px)
  ✅ Between buttons: gap-4 (16px spacing)
  
Inputs:
  ✅ All inputs: py-2.5 px-3.5 min-h-11
  ✅ Input text: text-base (16px ALWAYS)
  ✅ Line-height: 1.5 (24px)

Forms:
  ✅ Label: text-sm (14px), mb-2 (8px below)
  ✅ Input: 44px min height
  ✅ Help text: text-sm (14px), mt-1 (4px below)

Cards:
  ✅ Mobile: p-4 (16px)
  ✅ Tablet: p-5 (20px)
  ✅ Desktop: p-6 (24px)

Typography:
  ✅ H1: 24px | H2: 20px | H3: 18px
  ✅ Body: 16px (baseline)
  ✅ Small: 14px | Caption/label: 12px

Visual:
  ✅ Buttons look balanced (not oversized)
  ✅ Inputs have breathing room
  ✅ Text isn't oversized
  ✅ Form fields have clear hierarchy
  ✅ Cards don't feel cramped on mobile
```

---

## The Standard Explained

### Buttons

```
Current (broken):      ❌ 40px height, py-2, text-sm (14px)
                       → Cramped, looks cheap

Standard default:     ✅ 44px min height, py-2.5 px-3.5, text-base (16px)
                       → Matches HIG-style minimum touch height
                       
Example:
┌─────────────────┐
│  Save Button    │  ← 44px min (min-h-11)
└─────────────────┘
   10px padding (py-2.5)
   16px text (text-base)
```

### Inputs

```
Current (broken):      ❌ 40px height, py-2, text-sm (14px)
                       → Text looks small, doesn't fit well

App-native default:   ✅ 44px min height, py-2.5 px-3.5, text-base (16px)
                       → Prevents iOS zoom (16px minimum)
                       
Example:
┌──────────────────────┐
│ [Customer Name - 16px] │  ← 44px min
└──────────────────────┘
```

### Form Fields

```
Current (broken):      ❌ Label 14px, Input 14px (same size)
                       → No hierarchy, confusing

Industry standard:     ✅ Label 14px, Input 16px (distinct)
                       → Clear hierarchy
                       → Label smaller = visual distinction
                       
Example:
Label: 14px "Customer Name"
↓ 8px gap
Input: [16px text inside] 44px min height
↓ 4px gap
Help: 14px "Enter business name"
```

### Why 44px (not 40px for default chrome)?

```
├─ Apple HIG:         44pt minimum — we align to 44px (`min-h-11`)
├─ Product default:   One sizing model for web (no “accessibility” vs “normal” height)
├─ Small UI:          40px (`min-h-10`) reserved for chips / compact rows only
└─ Inputs:            16px font always (`text-base`)
```

---

## Key Metrics (Copy These)

```
BUTTONS & INPUTS:
  Min height:          44px (min-h-11 / min-h-touch)
  Padding:             py-2.5 px-3.5
  Font:                text-base (16px) on inputs always
  Min-height token:     min-h-11

FORMS:
  Label:               text-sm (14px), mb-2 (8px below)
  Label weight:        font-semibold (600)
  Input:               text-base (16px), py-2.5 px-3.5, min-h-11
  Help text:           text-sm (14px), mt-1 (4px below)
  Error text:          text-xs (12px), text-danger-600

CARDS:
  Mobile:              p-4 (16px padding)
  Tablet:              p-5 (20px padding)
  Desktop:             p-6 (24px padding)

TYPOGRAPHY:
  H1:                  24px, line-height 1.25, weight 700
  H2:                  20px, line-height 1.33, weight 700
  H3:                  18px, line-height 1.4, weight 600
  Body:                16px, line-height 1.5, weight 400 (BASELINE)
  Small:               14px, line-height 1.43, weight 400
  Caption/label:       12px, line-height 1.33, weight 600
  
SPACING:
  Button gaps:         gap-4 (16px)
  Form gaps:           gap-2 (8px between fields)
  Card gaps:           p-4/p-5/p-6 (16px/20px/24px)

TOUCH TARGETS:
  Default minimum:     44px (matches min-h-touch)
  Safe spacing:        16px between elements
  (Larger than 44px: only if a screen explicitly needs emphasis — not a default “accessibility” mode.)
```

---

## What Changes In Code

**Before (broken):**
```jsx
<button className="py-2 px-3 text-sm rounded-base bg-primary-500">
  Save
</button>

<input className="py-2 px-3 text-sm border rounded-base" />

<label className="text-sm mb-2">Customer Name</label>
```

**After (fixed):**
```jsx
<button className="py-2.5 px-3.5 min-h-11 text-base rounded-base bg-primary-500">
  Save
</button>

<input className="py-2.5 px-3.5 min-h-11 text-base border rounded-base" />

<label className="text-sm font-semibold mb-2">Customer Name</label>
```

**Changes:**
- `py-2` → `py-2.5` and `min-h-11` (44px min)
- `text-sm` → `text-base` (button only)
- Input stays `text-base` (never smaller)

---

## Timeline

**Step 1 (Now):**
- Copy prompt from CURSOR_PROMPT_SIZING_RESET.md
- Paste into Cursor
- Let Cursor run fix (1-2 hours)

**Step 2 (Review):**
- Check all buttons meet **min-h-11** (44px)
- Check all inputs are **min-h-11** + 16px font
- Check form labels are 14px
- Verify responsive (16px → 20px → 24px padding)

**Step 3 (Validate):**
- Run through checklist above
- Test on mobile (320px), tablet (768px), desktop (1200px)
- Verify text is readable, not cramped

**Result:**
- App-native density (44px min targets; 16px input fonts, 1.5 line-height)
- Future-proof (won't need resizing again)
- Responsive (scales correctly on all devices)

---

## Files Involved

| File | Purpose |
|------|---------|
| `CURSOR_PROMPT_SIZING_RESET.md` | **← COPY THIS TO CURSOR** |
| `DESIGN_SYSTEM_V1.md` | Updated by Cursor (new sizing section) |
| `tailwind.config.ts` | Updated by Cursor (button/input utilities) |
| `COMPONENT_SPECS.md` | Already has correct sizes (use as reference) |

---

## After Cursor Finishes

**Commit message:**
```
[design]: Reset component sizing to app-native density (44px min)

- Buttons: min 44px height, 16px font
- Inputs: min 44px height, 16px font (iOS zoom rule)
- Forms: Label 14px, Input 16px (clearer hierarchy)
- Cards: Responsive padding 16px/20px/24px (was inconsistent)
- Typography: Clear ratios (24, 20, 18, 16, 14, 12)

Standard: Aligns with WhatsApp, Telegram, Material Design, iOS HIG

Fixes: Cramped buttons, misaligned text, inconsistent spacing
```

---

## Quick Validation After Fix

**Visual Test:**
1. Open app in mobile (320px simulator)
2. Look at buttons → Tight, aligned with native-style density
3. Look at inputs → Text should fit nicely, not overflow
4. Look at form → Label → small gap → Input → small gap → Help (clear)
5. Look at cards → Padding visible, breathing room

**Result Should Be:**
- ✅ Buttons look balanced (44px min, standard padding)
- ✅ Inputs look readable (16px font, 44px min height)
- ✅ Forms look organized (clear label → input → help hierarchy)
- ✅ Cards look spacious (padding visible, not cramped)
- ✅ Responsive (no size jump between mobile/tablet/desktop)

---

## Bottom Line

**Copy CURSOR_PROMPT_SIZING_RESET.md to Cursor. Let it fix everything. Validate with checklist. Done.**

The prompt explains the standard, shows what to fix, includes code examples, and updates documentation. It's self-contained and complete.

**Time to fix:** 1-2 hours  
**Result:** Professional, consistent **standard UI** sizing  
**Never need to adjust again:** Industry standard won't change ✅