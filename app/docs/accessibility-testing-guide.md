# Accessibility Testing Guide

**Standard**: WCAG 2.2 Level AA
**Task**: US_043 TASK_001

---

## Automated Testing

### Unit Tests (Vitest + vitest-axe)

```bash
cd app
npm test -- --testPathPattern=accessibility
```

The test utility at `src/utils/accessibility-testing.ts` provides:

| Function | Purpose |
|----------|---------|
| `renderWithA11y(ui, opts)` | Renders a component and runs axe scan; returns RTL result + `a11yResults` |
| `expectNoA11yViolations(container)` | Asserts zero axe violations on a DOM container |
| `getA11yReport(container)` | Returns a structured report with violations grouped by severity |

Example:

```tsx
import { render } from '@testing-library/react';
import { expectNoA11yViolations } from '@utils/accessibility-testing';
import { MyComponent } from './MyComponent';

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  await expectNoA11yViolations(container);
});
```

### E2E Tests (Playwright + @axe-core/playwright)

```bash
cd test-automation
npx playwright test tests/accessibility.spec.ts --project=chromium
```

Or using the dedicated project:

```bash
npx playwright test --project=accessibility
```

---

## Manual Testing Checklist

### Screen Reader Testing

| Check | Tool | Status |
|-------|------|--------|
| All interactive elements have descriptive labels | NVDA / JAWS / VoiceOver | |
| Form errors are announced when they appear | NVDA / JAWS / VoiceOver | |
| Loading states are announced via `aria-live` | NVDA / VoiceOver | |
| Modal focus is trapped within the dialog | NVDA / JAWS / VoiceOver | |
| Page landmarks (`<main>`, `<nav>`, `<header>`) announced | NVDA | |
| Dynamic content updates announced via live regions | NVDA / VoiceOver | |

### Keyboard Navigation

| Check | Expected | Status |
|-------|----------|--------|
| Tab order is logical (left-to-right, top-to-bottom) | Sequential | |
| All interactive elements reachable via Tab | 100 % | |
| Enter / Space activate buttons and links | Yes | |
| Escape closes modals and popovers | Yes | |
| Arrow keys navigate radio groups, dropdowns, grids | Yes | |
| Skip-to-main link visible on first Tab | Yes | |
| No keyboard traps | None | |

### Color Contrast

| Standard | Ratio | Tool |
|----------|-------|------|
| Normal text (< 18 pt) | >= 4.5 : 1 | [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) |
| Large text (>= 18 pt or 14 pt bold) | >= 3 : 1 | WebAIM |
| UI components and graphical objects | >= 3 : 1 | axe `color-contrast` rule |

### Focus Indicators

| Check | Expected |
|-------|----------|
| All focusable elements have visible focus ring | 2 px solid, high-contrast |
| Focus ring colour meets 3 : 1 against background | Yes |
| Focus is not removed by CSS (`outline: none` without replacement) | Yes |
| High-contrast mode: focus ring >= 3 px | Yes |

### Text Resize / Zoom

| Check | Expected |
|-------|----------|
| Zoom to 200 % — no horizontal scroll on 1280 px viewport | Pass |
| No text truncation or overflow at 200 % | Pass |
| All functionality preserved at 200 % | Pass |
| Touch targets >= 44 x 44 px on mobile | Pass |

---

## CI Integration

The GitHub Actions workflow `.github/workflows/accessibility-ci.yml` runs on every PR and push to `main` / `develop`:

1. Installs dependencies
2. Runs Vitest accessibility tests (`npm test -- --testPathPattern=accessibility`)
3. Installs Playwright browsers and runs `accessibility.spec.ts`
4. Uploads reports as artifacts
5. Comments on the PR when critical violations are detected

---

## Adding Accessibility Tests to a Component

1. Import the helper:

   ```ts
   import { expectNoA11yViolations } from '@utils/accessibility-testing';
   ```

2. Add a test case:

   ```ts
   it('meets WCAG 2.2 AA', async () => {
     const { container } = render(<YourComponent {...defaultProps} />);
     await expectNoA11yViolations(container);
   });
   ```

3. For detailed reports, use `getA11yReport`:

   ```ts
   const report = await getA11yReport(container);
   console.log(report.violationsBySeverity);
   ```
