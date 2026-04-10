# Design Review Report

## Summary

UX review of the Accessibility Statement page (`/accessibility-statement`) implemented in task_006 (EP-010/us_043). The page renders a WCAG 2.2 AA compliance statement with semantic HTML sections, proper heading hierarchy, and ARIA landmark regions. Overall the page is well-structured, accessible, and responsive across all viewports. Two key issues were discovered: a blocking 401 redirect caused by the notification API on public routes (fixed during review), and missing `<main>` landmark when rendered outside `AuthenticatedLayout`.

## Findings

### Blockers

- **NotificationPopupConnector causes 401 redirect on public routes**: The `NotificationPopupConnector` component renders outside `AuthenticatedLayout`, triggering `useNotifications` which calls `fetchNotifications()`. Without an auth token, the API returns 401, and the Axios response interceptor hard-redirects to `/login` via `window.location.href`. This made `/accessibility-statement` completely inaccessible to unauthenticated users.
  - Steps to reproduce: Navigate to `http://localhost:5174/accessibility-statement` without logging in.
  - Expected: Page renders the accessibility statement.
  - Actual: Immediate redirect to `/login`.
  - Fix applied: Guarded `NotificationPopupConnector` with `useAuth()` isAuthenticated check in `App.tsx`.

### High-Priority Issues

- **Missing `<main>` landmark on public routes**: The `AccessibilityStatementPage` renders as a `<div>` without a `<main>` wrapper. When accessed as a public route (outside `AuthenticatedLayout` which provides the `<main id="main-content">` element), axe-core reports `landmark-one-main` and `region` violations (both moderate impact).
  - Affected viewports: All.
  - Recommendation: Wrap the page content in `<main>` or add a public layout wrapper with `<main>`.

- **Generic page title**: The `<title>` element is "app" across all pages. Screen readers announce this on page load, providing no context to assistive technology users.
  - Recommendation: Use `document.title` or `react-helmet` to set "Accessibility Statement | UPACI Platform".

### Medium-Priority Suggestions

- **React version inaccuracy**: The Technical Specifications section states "JavaScript (React 18.x)" but the project uses React 19.2.4 (`package.json`).
  - Recommendation: Update to "JavaScript (React 19.x)".

- **No table of contents for long-form content**: The page has 8 sections requiring significant scrolling. A jump-link TOC at the top would improve usability.

- **No `<nav>` or skip navigation on the public page**: The page lacks the skip-to-main-content link and keyboard shortcuts that authenticated pages have via `AuthenticatedLayout`.

### Nitpicks

- Nit: Minor magic numbers in CSS (`48rem` max-width, `1.5rem` padding-left, `1.6` line-height) could use design tokens for consistency.
- Nit: No "Back to Top" link at the bottom of the long scrollable content.
- Nit: The `<code>` elements for CSS media queries (`prefers-reduced-motion`, `prefers-contrast: high`) render with a dark background that is visually distinctive but could benefit from explicit contrast verification.

## Testing Coverage

### Tested Successfully

- Desktop 1440px: Content centered with max-width constraint, clear heading hierarchy, readable text
- Tablet 768px: Content fills width appropriately, no layout issues, sections well-spaced
- Mobile 375px: Content wraps correctly, text readable at small viewport, links tappable
- Simulated 200% zoom (720px viewport): No horizontal scroll, all content accessible
- Keyboard navigation: Tab order correct (email link → phone link), focus visible on links
- axe-core accessibility audit: 22 passes, 0 critical/serious violations
- Console errors: 0 on the accessibility statement page
- Semantic HTML: All sections use `<section>` with `aria-labelledby`, proper h1→h2→h3 hierarchy
- Link accessibility: Email (`mailto:`) and Phone (`tel:`) links with descriptive text

### Metrics

- Viewports tested: Desktop (1440px), Tablet (768px), Mobile (375px), Zoom 200% (720px)
- Accessibility score: 22 passes / 2 moderate violations (landmark-related, not content issues)
- Console errors: 0
- Performance observations: Static content page, no API calls, instant rendering

## Recommendations

1. **Add a public layout wrapper** with `<main>` landmark and skip-link support for all public routes (`/login`, `/unauthorized`, `/accessibility-statement`) to ensure consistent accessibility across authenticated and public contexts.
2. **Implement dynamic page titles** using `useEffect` + `document.title` or a centralized title hook to provide meaningful page context to screen readers and browser tabs.
