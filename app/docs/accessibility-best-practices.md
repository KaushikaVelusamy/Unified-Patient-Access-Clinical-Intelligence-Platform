# Accessibility Best Practices for Developers

This guide covers reusable patterns, testing workflows, and common pitfalls for maintaining WCAG 2.2 AA compliance in the Unified Patient Access Platform.

---

## 1. Component Patterns

### Forms

```tsx
// Always associate labels with inputs
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-required="true" aria-describedby="email-error" />
<span id="email-error" role="alert">Email is required</span>
```

**Reusable components** (from `app/src/components/forms/`):
- `AccessibleInput` — auto-generates id and links label + error via aria-describedby
- `AccessibleSelect` — supports optgroup and placeholder
- `AccessibleCheckbox` / `AccessibleRadio` — proper label association
- `FormError` — severity-aware with aria-live
- `ValidationSummary` — error list with auto-focus

### Modals

```tsx
// Use the shared AccessibleModal wrapper
import { AccessibleModal } from '../components/accessibility';

<AccessibleModal isOpen={open} onClose={close} title="Confirm Action">
  <p>Are you sure?</p>
  <button onClick={confirm}>Yes</button>
</AccessibleModal>
```

**Built-in behaviour:**
- `role="dialog"` + `aria-modal="true"`
- `aria-labelledby` linked to title
- Focus trap via `useFocusTrap()` hook
- Escape key closes
- Backdrop click closes
- Body scroll locked
- Focus returns to trigger on close

### Tooltips

```tsx
import { AccessibleTooltip } from '../components/accessibility';

<AccessibleTooltip content="Additional information" position="top">
  <button>Hover me</button>
</AccessibleTooltip>
```

**Built-in behaviour:**
- `role="tooltip"` + `aria-describedby`
- Shows on hover and focus
- Dismisses on Escape
- Auto-hides after 5 seconds

### Dropdowns

```tsx
import { AccessibleDropdown } from '../components/accessibility';

<AccessibleDropdown
  label="Select department"
  options={[{ value: 'cardio', label: 'Cardiology' }]}
  value={selected}
  onChange={setSelected}
/>
```

**Built-in behaviour:**
- `role="listbox"` + arrow-key navigation
- Typeahead search
- Enter/Space to select, Escape to close

### Buttons

```tsx
// Icon-only buttons MUST have aria-label
<button onClick={handleEdit} aria-label="Edit appointment">
  <EditIcon aria-hidden="true" />
</button>

// Text buttons are self-labeling
<button onClick={handleSave}>Save Changes</button>
```

### Images

```tsx
// Functional image — descriptive alt
<img src="user.jpg" alt="Patient profile photo" />

// Decorative image — hide from assistive tech
<img src="decoration.png" alt="" aria-hidden="true" />
```

---

## 2. Global Features

### Skip Link

Already included in `AuthenticatedLayout`. Skips to `#main-content`.

### Keyboard Shortcuts

`KeyboardShortcuts` component provides role-scoped Alt+key shortcuts. Press **Alt+/** to view the legend.

### Focus Management

```tsx
import { useFocusTrap, useFocusVisible } from '../utils/focus-management';

// Focus trap for modals/drawers
const ref = useFocusTrap<HTMLDivElement>(isOpen);

// Global keyboard-focus-visible class
useFocusVisible();
```

### Live Regions

```tsx
import { LiveRegion } from '../components/accessibility';

<LiveRegion politeness="polite" message={statusText} />
```

---

## 3. Testing Checklist

Run before every PR that touches UI:

- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] Tab through the page — verify every interactive element gets a visible 2px blue focus ring
- [ ] Test with NVDA or VoiceOver — verify labels are announced for buttons, inputs, and headings
- [ ] Check color contrast — use browser DevTools or WebAIM Contrast Checker (≥ 4.5:1 text, ≥ 3:1 UI)
- [ ] Test at 200% zoom — no horizontal scroll, no text truncation
- [ ] Test at 375px viewport — touch targets ≥ 44×44 px

### Automated Tests

```bash
# Unit tests with axe-core (via vitest-axe)
cd app && npm test

# E2E accessibility tests
cd test-automation && npx playwright test --project=accessibility
```

---

## 4. Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| `<div onClick={...}>` instead of `<button>` | Use `<button>` — it gets focus, Enter/Space, and role for free |
| Missing `alt` on `<img>` | Always add `alt="description"` or `alt=""` for decorative |
| `outline: none` on focus | Never remove focus outlines without a visible alternative |
| Color as only indicator | Pair color with text, icon, or pattern (e.g., error icon + red text) |
| Placeholder as label | Always provide a visible `<label>` — placeholders disappear on input |
| Auto-playing animation | Wrap in `prefers-reduced-motion` media query |
| Low contrast text | Use `--color-text-*` semantic tokens — they are pre-validated |
| Unlabeled icon button | Add `aria-label` and mark icon with `aria-hidden="true"` |

---

## 5. Design Token Usage

Always use semantic tokens, not raw palette tokens:

```css
/* CORRECT */
color: var(--color-text-primary);        /* 16.75:1 on white */
color: var(--color-text-secondary);      /* 5.74:1 on white */
border-color: var(--color-border-focus); /* 5.40:1 on white */

/* INCORRECT — may fail contrast */
color: var(--color-neutral-500);  /* 3.95:1 — fails for normal text */
```

See `app/docs/color-contrast-report.md` for the full audit.

---

## 6. Quarterly Audit Schedule

| Quarter | Due Date | Scope |
|---------|----------|-------|
| Q2 2026 | July 2026 | Full audit of all 13 screens |
| Q3 2026 | October 2026 | New features since Q2 |
| Q4 2026 | January 2027 | Full audit + annual report |
