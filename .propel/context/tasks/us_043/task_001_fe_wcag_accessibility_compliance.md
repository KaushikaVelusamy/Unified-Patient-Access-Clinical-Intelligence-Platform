# Task - TASK_001_FE_WCAG_ACCESSIBILITY_COMPLIANCE

## Requirement Reference
- User Story: US_043
- Story Location: `.propel/context/tasks/us_043/us_043.md`
- Acceptance Criteria:
    - AC1: All screens (SCR-001 through SCR-014) provide keyboard navigation with visible focus indicators (2px solid blue outline), support screen readers (NVDA, JAWS, VoiceOver) with ARIA labels, provide alt text for images, maintain color contrast ≥4.5:1 for text, support text resize up to 200%, implement skip links, provide accessible error messages with aria-live, support focus management in modals, provide accessible form labels, implement accessible tables with <th> headers, provide keyboard shortcuts, include accessibility statement, pass axe-core with zero critical violations, pass manual screen reader testing >95% task completion, achieve AAA rating on WebAIM Wave
- Edge Cases:
    - Dynamic content updates: ARIA live regions announce changes
    - Complex widgets: Fallback to semantic HTML inputs
    - Multiple impairments: Voice control + large click targets ≥44px

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (All screens) |
| **Figma URL** | .propel/context/docs/figma_spec.md |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | ALL wireframes in .propel/context/wireframes/Hi-Fi/ (accessibility overlay every screen) |
| **Screen Spec** | ALL (SCR-001 through SCR-014) |
| **UXR Requirements** | NFR-ACC01 (WCAG 2.2 AA), UXR-301 (Keyboard nav), UXR-302 (Screen readers), UXR-303 (Focus indicators), UXR-304 (Touch targets 44px), UXR-305 (Contrast ratios) |
| **Design Tokens** | Focus outline: 2px solid #007BFF, ARIA labels: all interactive elements, Contrast ratios: text 4.5:1, UI 3:1 minimum |

> **Wireframe Components:**
> - Focus indicators: 2px solid blue outline on :focus, high contrast mode 3px
> - Skip links: "Skip to main content" at top (Tab to reveal)
> - ARIA labels: All icons, buttons, form inputs have descriptive labels
> - Landmark regions: <header>, <nav>, <main>, <aside>, <footer> semantic HTML5
> - Color contrast: Body text #212121 on #FFFFFF (16.1:1), Primary button #007BFF text #FFFFFF (4.53:1), Error #D32F2F on #FFFFFF (7.37:1)
> - Form validation: role="alert", aria-live="assertive", aria-invalid="true", aria-describedby
> - Modal dialogs: role="dialog", aria-modal="true", aria-labelledby, focus trap, Escape closes
> - Loading states: role="status", aria-live="polite", progress bars with aria-valuenow/min/max

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | axe-core | 4.x (Automated testing) |
| Frontend | react-aria | 3.x (Accessible components) |
| Backend | N/A | N/A |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Touch targets, gestures) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement WCAG 2.2 AA accessibility compliance: (1) Keyboard navigation: All interactive elements (buttons, links, inputs, dropdowns, tabs) accessible via Tab/Shift+Tab, visible focus indicators (outline: 2px solid #007BFF), skip to main content link (hidden until focused), (2) Screen reader support: Install react-aria library for accessible primitives, add ARIA labels to all buttons (aria-label="Book appointment" on calendar icon), form inputs have associated <label> with for attribute, dynamic content has aria-live regions (aria-live="assertive" for errors, "polite" for updates), landmarks (<header>, <nav>, <main>, <aside>, <footer>), (3) Color contrast: Body text #212121 on #FFFFFF (contrast 16.1:1), primary button #007BFF on #FFFFFF (4.53:1), error text #D32F2F on #FFFFFF (7.37:1), validate with contrast-checker tool, (4) Text resize: CSS rem units for all font sizes (base 16px), supports 200% zoom without horizontal scroll or content loss, (5) Accessible forms: Labels visible + programmatically associated (label htmlFor="email"), error messages with role="alert" + aria-live="assertive", error fields have aria-invalid="true" + aria-describedby="error-id", required fields marked with aria-required="true", (6) Modal focus management: FocusTrap component wraps modals, focus moved to modal on open, Tab cycles within modal only, Escape key closes modal + returns focus to trigger element, (7) Accessible tables: <table> with <thead>, <th scope="col|row">, <caption> for table description, responsive tables collapse to definition lists on mobile, (8) Keyboard shortcuts: Alt+B=Book, Alt+D=Dashboard, Alt+Q=Queue, visible legend in footer or help menu, (9) Alt text: All meaningful images have alt text, decorative images have alt="" or aria-hidden="true", (10) Automated testing: Install axe-core, run axe.run() in integration tests, assert zero critical violations, CI fails if violations detected, (11) Manual testing: NVDA/JAWS/VoiceOver testing for all flows (login, booking, queue, dashboards), task completion >95%, document in test report, (12) Accessibility statement: Create .propel/docs/accessibility-statement.md documenting compliance level, known issues, contact for feedback.

## Dependent Tasks
- US_001 Task 001: React frontend (all UI components made accessible)
- US_012, US_013, US_019, US_020, US_025, US_028, US_034, US_035, US_039: All UI stories updated for accessibility

## Impacted Components
**New:**
- app/src/components/A11y/SkipLink.tsx (Skip to main content)
- app/src/components/A11y/FocusTrap.tsx (Modal focus management)
- app/src/components/A11y/VisuallyHidden.tsx (Screen reader only text)
- app/src/components/A11y/AccessibleButton.tsx (Button with ARIA)
- app/src/components/A11y/AccessibleTable.tsx (Table with proper markup)
- app/src/hooks/useKeyboardShortcuts.ts (Keyboard shortcuts hook)
- app/tests/accessibility.test.tsx (axe-core integration tests)
- .propel/docs/accessibility-statement.md (WCAG compliance statement)

**Modified:**
- app/src/App.tsx (Add SkipLink, keyboard shortcuts)
- All button/link/input components (Add ARIA labels)
- All form components (Add aria-invalid, aria-describedby)
- All modal components (Wrap with FocusTrap)
- app/src/styles/global.css (Focus indicators, contrast colors)

## Implementation Plan
1. Install dependencies: `npm install react-aria axe-core @axe-core/react`
2. Create SkipLink component:
   ```tsx
   export const SkipLink = () => (
     <a href="#main-content" className="skip-link">
       Skip to main content
     </a>
   );
   
   // CSS: .skip-link { position: absolute; left: -9999px; z-index: 999; }
   // .skip-link:focus { left: 0; }
   ```
3. Add to App.tsx: `<SkipLink />` at top, `<main id="main-content">` wraps content
4. Implement focus indicators (global.css):
   ```css
   *:focus {
     outline: 2px solid #007BFF;
     outline-offset: 2px;
   }
   
   @media (prefers-contrast: high) {
     *:focus {
       outline-width: 3px;
     }
   }
   ```
5. Add ARIA labels to buttons:
   ```tsx
   <button aria-label="Book appointment">
     <CalendarIcon />
   </button>
   ```
6. Accessible forms:
   ```tsx
   <label htmlFor="email">Email Address</label>
   <input 
     id="email" 
     type="email" 
     aria-required="true"
     aria-invalid={errors.email ? "true" : "false"}
     aria-describedby={errors.email ? "email-error" : undefined}
   />
   {errors.email && (
     <span id="email-error" role="alert" aria-live="assertive">
       {errors.email}
     </span>
   )}
   ```
7. FocusTrap component (modal focus management):
   ```tsx
   import { useFocusTrap } from '@react-aria/focus';
   
   export const FocusTrap = ({ children }) => {
     const ref = useRef();
     const {focusTrapProps} = useFocusTrap({}, ref);
     
     return (
       <div ref={ref} {...focusTrapProps}>
         {children}
       </div>
     );
   };
   ```
8. Wrap modals: `<FocusTrap><DialogContent /></FocusTrap>`
9. Accessible tables:
   ```tsx
   <table>
     <caption>Upcoming Appointments</caption>
     <thead>
       <tr>
         <th scope="col">Date</th>
         <th scope="col">Time</th>
         <th scope="col">Department</th>
       </tr>
     </thead>
     <tbody>
       {/* table rows */}
     </tbody>
   </table>
   ```
10. Keyboard shortcuts hook:
    ```tsx
    export const useKeyboardShortcuts = () => {
      useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.altKey && e.key === 'b') {
            navigate('/booking');
          }
          if (e.altKey && e.key === 'd') {
            navigate('/dashboard');
          }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }, []);
    };
    ```
11. Color contrast validation: Use contrast-checker tool, adjust colors to meet 4.5:1 ratio
12. axe-core automated testing:
    ```tsx
    import { axe, toHaveNoViolations } from 'jest-axe';
    expect.extend(toHaveNoViolations);
    
    test('Login page has no accessibility violations', async () => {
      const { container } = render(<LoginPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    ```
13. Run axe tests in CI: `npm run test:a11y` fails build if violations
14. Manual testing: NVDA, JAWS, VoiceOver test all flows, document results
15. Accessibility statement (.propel/docs/accessibility-statement.md):
    ```markdown
    # Accessibility Statement
    
    ## Compliance Level
    This platform aims to conform to WCAG 2.2 Level AA standards.
    
    ## Known Issues
    - Calendar date picker has limited screen reader support (fallback to text input provided)
    
    ## Feedback
    Contact accessibility@example.com for accessibility concerns.
    ```

## Current Project State
```
ASSIGNMENT/
├── app/src/components/ (some components exist)
├── app/src/components/A11y/ (to be created)
└── (accessibility features to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| UPDATE | app/src/App.tsx | Add SkipLink + keyboard shortcuts |
| CREATE | app/src/components/A11y/SkipLink.tsx | Skip link |
| CREATE | app/src/components/A11y/FocusTrap.tsx | Modal focus management |
| CREATE | app/src/components/A11y/VisuallyHidden.tsx | Screen reader text |
| CREATE | app/src/hooks/useKeyboardShortcuts.ts | Keyboard nav |
| CREATE | app/tests/accessibility.test.tsx | axe-core tests |
| CREATE | .propel/docs/accessibility-statement.md | WCAG statement |
| UPDATE | app/src/styles/global.css | Focus indicators, contrast |
| UPDATE | ALL button/input/modal components | Add ARIA attributes |

## External References
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [react-aria Documentation](https://react-spectrum.adobe.com/react-aria/)
- [axe-core Testing](https://github.com/dequelabs/axe-core)
- [WebAIM Wave Validator](https://wave.webaim.org/)
- [NFR-ACC01 WCAG AA](../../../.propel/context/docs/spec.md#NFR-ACC01)

## Build Commands
```bash
cd app
npm install react-aria axe-core @axe-core/react jest-axe
npm run test:a11y
```

## Implementation Validation Strategy
- [ ] Skip link: Tab on any page → "Skip to main content" appears, Enter → jumps to main
- [ ] Keyboard navigation: Tab cycles through all interactive elements, no keyboard traps
- [ ] Focus indicators: 2px solid blue outline visible on all focused elements
- [ ] ARIA labels: All icons/buttons have aria-label, screen reader announces descriptive text
- [ ] Form labels: All inputs have associated visible <label> with htmlFor
- [ ] Error messages: Invalid input → error message announced by screen reader immediately
- [ ] Modal focus: Open modal → focus moves to modal, Tab cycles within modal, Escape closes + returns focus
- [ ] Tables: <table> has <caption>, <th> has scope="col", screen reader announces headers
- [ ] Color contrast: Body text 16.1:1, buttons 4.5:1, all pass WCAG AA
- [ ] Text resize: Zoom to 200% → no horizontal scroll, all content visible
- [ ] Keyboard shortcuts: Alt+B → navigates to booking, Alt+D → dashboard
- [ ] ARIA live regions: Dynamic content updates announced to screen readers
- [ ] NVDA testing: Login → booking → dashboard flows work with screen reader on, >95% task completion
- [ ] axe-core tests: Run `npm run test:a11y` → zero critical violations
- [ ] WebAIM Wave: Scan all pages → AAA rating for WCAG AA criteria
- [ ] Accessibility statement: .propel/docs/accessibility-statement.md exists

## Implementation Checklist
- [ ] Install react-aria, axe-core, jest-axe
- [ ] Create Skip LinkComponent
- [ ] Add focus indicators to global.css
- [ ] Add ARIA labels to all buttons/icons
- [ ] Update all forms with accessible markup
- [ ] Create FocusTrap component for modals
- [ ] Update tables with <th scope> attributes
- [ ] Implement useKeyboardShortcuts hook
- [ ] Validate color contrast ratios (4.5:1 text, 3:1 UI)
- [ ] Create axe-core integration tests
- [ ] Run manual NVDA/JAWS/VoiceOver testing
- [ ] Write accessibility-statement.md
- [ ] Document accessibility features in app/README.md
