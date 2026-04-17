# GrowCold Component Specifications v1.0

> Building blocks for the design system. Every component must follow these specs.

---

## COMPONENT: Button

### Variants

#### Primary Button
```tsx
<button className="btn-primary">Record Delivery</button>

// States:
<button className="btn-primary" disabled>Record Delivery</button>
<button className="btn-primary" aria-busy="true">
  <span className="loading-spinner" aria-hidden="true" />
  Saving...
</button>
```

**Specs:**
- Background: `bg-primary-500` (#EA580C)
- Hover: `hover:bg-primary-600` (#D74A0A)
- Active: `active:bg-primary-700` (#CC4A08)
- Disabled: Opacity 0.5, cursor not-allowed
- Padding: `px-4 py-3` (16px h, 12px v)
- Border radius: `rounded-base` (8px)
- Font: `font-semibold` (600 weight)
- Transition: `transition-all duration-200`
- Touch target: Minimum 48px height
- Width: Full width on mobile, auto on desktop

#### Secondary Button
```tsx
<button className="btn-secondary">Cancel</button>

// With icon
<button className="btn-secondary">
  <DownloadIcon className="w-4 h-4" />
  Export CSV
</button>
```

**Specs:**
- Border: `border-2 border-secondary-500` (#0891B2)
- Text color: `text-secondary-500`
- Background: Transparent
- Hover: `hover:bg-secondary-50` (light background)
- Active: `active:bg-secondary-100` (darker background)

#### Danger Button (Delete/Write-off)
```tsx
<button className="btn-danger">Write-off</button>
```

**Specs:**
- Background: `bg-danger-500` (#FB6B3C)
- Hover: `hover:bg-danger-600`
- Active: `active:bg-danger-700`
- Use: Only for destructive actions
- Requires: Confirmation modal first

#### Ghost Button (Tertiary)
```tsx
<button className="btn-ghost">Learn more</button>
<button className="btn-ghost">Show less</button>
```

**Specs:**
- Background: Transparent
- Text: `text-secondary-500`
- Hover: `hover:underline` (underline appears)
- No border
- Minimal visual weight

### Accessibility
```tsx
// Icon-only button MUST have aria-label
<button className="btn-primary" aria-label="Add lot">
  <PlusIcon className="w-5 h-5" />
</button>

// Loading state MUST announce
<button className="btn-primary" aria-busy="true">
  <span className="loading-spinner" aria-hidden="true" />
  <span className="ml-2">Saving...</span>
</button>

// Disabled button
<button className="btn-primary" disabled aria-disabled="true">
  Cannot delete
</button>
```

### Mobile Considerations
```tsx
// On mobile, buttons stack vertically
export function DeliveryActions() {
  return (
    <div className="flex flex-col gap-3">
      <button className="btn-primary">Record Delivery</button>
      <button className="btn-secondary">Cancel</button>
    </div>
  );
}

// Minimum touch target: 48px
// Fat-finger friendly: Space buttons 16px+ apart
// Never use small buttons on mobile (max 20px height)
```

---

## COMPONENT: Input / Form Field

### Text Input
```tsx
<div className="form-field">
  <label htmlFor="customer-name" className="text-label font-semibold text-neutral-700">
    Customer Name <span className="text-danger-500">*</span>
  </label>
  <input
    id="customer-name"
    type="text"
    className="input-base"
    placeholder="e.g., Ravi Industries"
    aria-required="true"
    aria-describedby="customer-name-help"
  />
  <p id="customer-name-help" className="help-text">
    Enter the customer's full business name
  </p>
</div>
```

**Specs:**
- Height: `py-3` (48px including padding)
- Padding: `px-4` (left/right)
- Border: `border-2 border-neutral-200`
- Font size: `text-base` (16px) — NEVER smaller on mobile (prevents iOS zoom)
- Focus: `focus:border-primary-500 focus:shadow-focus`
- Placeholder: `placeholder-neutral-400` (light gray)
- Disabled: `disabled:bg-neutral-100 disabled:opacity-50`

### Select Dropdown
```tsx
<div className="form-field">
  <label htmlFor="status-select" className="text-label font-semibold text-neutral-700">
    Status
  </label>
  <select
    id="status-select"
    className="input-base appearance-none cursor-pointer bg-white pr-8"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23374151' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
    }}
  >
    <option value="">Select status</option>
    <option value="active">Active</option>
    <option value="stale">Aging</option>
    <option value="cleared">Cleared</option>
  </select>
</div>
```

**Specs:**
- Use native `<select>` (better accessibility, better mobile UX)
- Don't use custom dropdown (harder to implement accessibility)
- Custom arrow icon (visible on all browsers)

### Radio Buttons
```tsx
<fieldset className="form-field">
  <legend className="text-label font-semibold text-neutral-700 mb-3">
    Rental Mode
  </legend>
  <div className="space-y-3">
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="radio"
        name="rental-mode"
        value="monthly"
        className="w-4 h-4 text-primary-500"
        defaultChecked
      />
      <span className="text-base">Monthly</span>
    </label>
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="radio"
        name="rental-mode"
        value="yearly"
        className="w-4 h-4 text-primary-500"
      />
      <span className="text-base">Yearly</span>
    </label>
  </div>
</fieldset>
```

**Specs:**
- Gap between options: `gap-3` (12px)
- Label always to the right (right-to-left friendly)
- Use native HTML (not custom)
- Make entire label clickable (`cursor-pointer`)

### Form Field with Error
```tsx
<div className="form-field">
  <label htmlFor="bags" className="text-label font-semibold text-neutral-700">
    Number of Bags <span className="text-danger-500">*</span>
  </label>
  <input
    id="bags"
    type="number"
    className="input-base border-danger-500"
    aria-invalid="true"
    aria-describedby="bags-error"
  />
  <p id="bags-error" className="error-text">
    <span aria-hidden="true">⚠️</span> Please enter a valid number
  </p>
</div>
```

**Specs:**
- Error state: `border-danger-500` (red border)
- Error icon: Emoji or SVG (not just text)
- Error text: `error-text` class (red, small)
- Connect input to error: `aria-describedby="bags-error"`

### Accessibility
```tsx
// DO: Label every input
<label htmlFor="customer">Customer Name</label>
<input id="customer" />

// DON'T: Use placeholder as label
<input placeholder="Customer Name" /> ❌

// DO: Mark required fields
<label>
  Customer Name <span className="text-danger-500">*</span>
</label>
<input aria-required="true" />

// DO: Link error messages
<input aria-describedby="error-id" />
<p id="error-id" className="error-text">Error message</p>
```

---

## COMPONENT: Card (Lot Card)

### Standard Lot Card
```tsx
export function LotCard({ lot }: { lot: Lot }) {
  return (
    <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="h3 text-neutral-900 truncate">{lot.customerName}</h3>
          <p className="text-body-sm text-neutral-600">{lot.productName}</p>
        </div>
        <span className={`badge-${lot.status.toLowerCase()}`}>
          {getStatusLabel(lot.status)}
        </span>
      </div>

      {/* Body */}
      <div className="space-y-2 mb-4 text-body-sm text-neutral-700">
        <div className="flex justify-between">
          <span>Bags:</span>
          <strong>{lot.balanceBags}</strong>
        </div>
        <div className="flex justify-between">
          <span>Days old:</span>
          <strong>{lot.daysOld}</strong>
        </div>
        {lot.outstanding > 0 && (
          <div className="flex justify-between text-danger-700">
            <span>Outstanding:</span>
            <strong>₹{formatCurrency(lot.outstanding)}</strong>
          </div>
        )}
      </div>

      {/* Footer */}
      <button className="btn-primary w-full" onClick={() => openDeliveryModal(lot.id)}>
        Record Delivery
      </button>
    </div>
  );
}
```

**Specs:**
- Background: `bg-white`
- Border: `border border-neutral-200`
- Padding: `p-4` (mobile), `p-6` (desktop)
- Border radius: `rounded-base` (8px)
- Shadow: `shadow-sm` (default), `hover:shadow-lg` (on hover)
- Transition: `transition-shadow duration-200`

### Status Badge Positioning
```
┌─────────────────────────────────┐
│ Ravi Industries  [ACTIVE ✓]    │ ← Badge top-right
│ Potatoes - 50 bags              │
│                                 │
│ Bags: 50           Days old: 24 │
│ Outstanding: ₹2,50,000          │
│                                 │
│ [Record Delivery]               │
└─────────────────────────────────┘
```

**Badge specs:**
- Position: Top-right corner
- Padding: `px-2 py-1`
- Font size: `text-label` (12px)
- Font weight: `font-semibold` (600)
- Border radius: `rounded-sm` (4px)
- Background + text per status:
  - ACTIVE: Green (bg-success-50, text-success-700)
  - STALE: Amber (bg-warning-50, text-warning-700)
  - CLEARED: Green (bg-success-50, text-success-700)
  - DISPUTED: Red (bg-danger-50, text-danger-700)

### Empty State Card
```tsx
export function EmptyLotsCard() {
  return (
    <div className="text-center py-12 px-6">
      {/* Illustration */}
      <div className="w-24 h-24 mx-auto mb-6 bg-primary-100 rounded-full flex items-center justify-center">
        <span className="text-4xl">📦</span>
      </div>

      {/* Message */}
      <h3 className="h3 text-neutral-900 mb-2">No lots added yet</h3>
      <p className="text-body-sm text-neutral-600 mb-6 max-w-xs mx-auto">
        Start by recording your first lot. Tap the button below.
      </p>

      {/* CTA */}
      <button className="btn-primary mx-auto">Add Your First Lot</button>
    </div>
  );
}
```

**Specs:**
- Centered layout
- Icon/illustration (emoji or SVG, 96px)
- Heading: H3
- Description: `text-body-sm text-neutral-600`
- CTA button: Primary style
- Vertical spacing: `mb-6` between elements

---

## COMPONENT: Skeleton Loading

### Lot Card Skeleton
```tsx
export function LotCardSkeleton() {
  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {/* Customer name skeleton */}
          <div className="skeleton h-6 w-32 mb-2 rounded" />
          {/* Product name skeleton */}
          <div className="skeleton h-5 w-40 rounded" />
        </div>
        {/* Badge skeleton */}
        <div className="skeleton h-6 w-16 rounded-sm" />
      </div>

      {/* Body */}
      <div className="space-y-2 mb-4">
        <div className="skeleton h-5 w-full rounded" />
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-5 w-2/3 rounded" />
      </div>

      {/* Footer button */}
      <div className="skeleton h-12 w-full rounded-base" />
    </div>
  );
}
```

**Specs:**
- Class: `skeleton` (includes gradient shimmer animation)
- Duration: 1.5s infinite
- Gradient: `linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)`
- Must match final component dimensions (prevent layout shift)
- Show: 200-500ms minimum (never show skeleton briefly)
- Hide: Fade out (opacity 0→1 over 100ms)

### List Skeleton
```tsx
export function LotListSkeleton() {
  return (
    <div className="lot-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <LotCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

---

## COMPONENT: Modal / Dialog

### Delivery Modal (Full-screen on mobile, floating on desktop)
```tsx
export function DeliveryModal({ lotId, isOpen, onClose }: Props) {
  const [bags, setBags] = useState<number>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await recordDelivery(lotId, bags);
      // Acknowledge-first: Show success immediately
      showToast('Delivery recorded! ✓', 'success');
      onClose();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 ${isOpen ? 'block' : 'hidden'}`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal (full-screen mobile, floating desktop) */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center pointer-events-none">
        <div
          className={`
            fixed bottom-0 left-0 right-0 sm:bottom-auto sm:relative
            bg-white rounded-t-base sm:rounded-base
            shadow-lg sm:shadow-xl
            max-w-md w-full sm:w-auto
            pointer-events-auto
            transition-all duration-300
            ${isOpen ? 'translate-y-0' : 'translate-y-full sm:scale-95'}
          `}
          role="dialog"
          aria-labelledby="modal-title"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <h2 id="modal-title" className="h2">
              Record Delivery
            </h2>
            <button
              className="btn-ghost"
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <div className="form-field">
              <label htmlFor="bags-input" className="text-label font-semibold">
                Bags Delivered <span className="text-danger-500">*</span>
              </label>
              <input
                id="bags-input"
                type="number"
                className="input-base"
                value={bags || ''}
                onChange={(e) => setBags(Number(e.target.value))}
                placeholder="e.g., 50"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-neutral-200">
            <button
              className="btn-secondary flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="btn-primary flex-1"
              onClick={handleSubmit}
              disabled={!bags || isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner mr-2" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                'Record Delivery'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Specs:**
- Mobile: Full-screen (bottom sheet style)
- Desktop: Floating modal (max-width: 28rem/448px)
- Backdrop: `bg-black/30` (semi-transparent)
- Animation: Slide-up (mobile) or scale (desktop)
- Duration: 300ms
- Close button: Top-right corner
- Gesture: Swipe down to dismiss (mobile convention)
- Accessibility: `role="dialog"`, `aria-modal="true"`

---

## COMPONENT: Toast / Alert

### Success Toast
```tsx
export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000); // Auto-dismiss
  };

  return (
    <>
      {toast && (
        <div
          className={`
            fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-sm
            px-4 py-3 rounded-base shadow-lg
            flex items-center gap-2
            transition-all duration-200
            ${
              toast.type === 'success'
                ? 'bg-success-500 text-white'
                : toast.type === 'error'
                ? 'bg-danger-500 text-white'
                : 'bg-neutral-900 text-white'
            }
          `}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span aria-hidden="true">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '⚠️'}
            {toast.type === 'info' && 'ℹ️'}
          </span>
          <span className="text-body-sm font-medium">{toast.message}</span>
        </div>
      )}
    </>
  );
}
```

**Specs:**
- Position: Bottom-left (mobile), bottom-left or top-right (desktop)
- Padding: `px-4 py-3`
- Duration: 3000ms (auto-dismiss)
- Animation: Fade-in/out (100ms)
- Accessibility: `role="status"`, `aria-live="polite"`
- Types: Success (green), Error (red), Info (gray)

---

## COMPONENT: Offline Queue Indicator

### Queue Badge (Bottom-right, persistent)
```tsx
export function OfflineQueueBadge() {
  const { queue } = useOfflineQueue();
  const { isOnline } = useOnlineStatus();

  if (isOnline && queue.length === 0) return null;

  return (
    <button
      className={`
        fixed bottom-6 right-6
        px-4 py-3 rounded-base shadow-lg
        flex items-center gap-2
        transition-all duration-200
        ${
          isOnline && queue.length > 0
            ? 'bg-success-500 text-white'
            : !isOnline
            ? 'bg-warning-100 text-warning-700 border-2 border-warning-300'
            : 'bg-white border-2 border-neutral-200 text-neutral-700'
        }
      `}
      onClick={() => openQueueModal()}
      aria-label={`${queue.length} actions pending`}
    >
      {isOnline && queue.length > 0 && (
        <span className="loading-spinner w-4 h-4" aria-hidden="true" />
      )}
      {!isOnline && <span aria-hidden="true">✈️</span>}
      {isOnline && queue.length > 0 && <span aria-hidden="true">↻</span>}

      <span className="text-sm font-medium">
        {isOnline && queue.length > 0
          ? `${queue.length} syncing...`
          : !isOnline
          ? 'Offline'
          : `${queue.length} synced`}
      </span>
    </button>
  );
}
```

---

## Design Checklist (Before Component Shipping)

- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Touch targets 48px minimum
- [ ] Font size ≥14px (or 12px for secondary only)
- [ ] Line height ≥1.5
- [ ] All interactive elements focusable (tab order logical)
- [ ] Focus indicators visible (2px outline, offset 2px)
- [ ] Hover states only on desktop (use :active for mobile)
- [ ] Loading states show spinner + text
- [ ] Error states show icon + message
- [ ] Disabled states clear (opacity, cursor)
- [ ] Responsive tested on mobile (320px), tablet (768px), desktop (1200px)
- [ ] i18n strings in locale files (no hardcoded text)
- [ ] Accessibility labels (aria-label, aria-describedby)
- [ ] Keyboard navigation tested

---

**Component Library Complete. Ready for Development.** ✅