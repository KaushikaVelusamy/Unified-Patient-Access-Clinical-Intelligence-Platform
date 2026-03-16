---
title: Component Inventory — Unified Patient Access & Clinical Intelligence Platform
source: .propel/context/docs/figma_spec.md
date: 2026-03-16
---

# Component Inventory — Unified Patient Access & Clinical Intelligence Platform

## Component Specification

**Fidelity Level**: High
**Screen Type**: Web
**Viewport**: 1440 × 900 px

## Component Summary

| Component Name | Type | Screens Used | Priority | Implementation Status |
|---|---|---|---|---|
| Sidebar Navigation | Layout | All authenticated screens | High | Pending |
| Top Bar | Layout | All authenticated screens | High | Pending |
| Login Card | Layout | SCR-001, SCR-002, SCR-003 | High | Pending |
| Stat Card | Content | SCR-004, SCR-005, SCR-006 | High | Pending |
| Data Table | Content | SCR-011, SCR-024, SCR-025, SCR-028, SCR-030 | High | Pending |
| Appointment Card | Content | SCR-006, SCR-010, SCR-011 | High | Pending |
| Patient Card | Content | SCR-025, SCR-026, SCR-027 | High | Pending |
| Document Card | Content | SCR-016, SCR-017 | Medium | Pending |
| Alert Card | Content | SCR-028, SCR-029 | Medium | Pending |
| Button (Primary) | Interactive | All screens | High | Pending |
| Button (Secondary) | Interactive | All screens | High | Pending |
| Button (Danger) | Interactive | SCR-009, SCR-022, SCR-027 | Medium | Pending |
| Form Input | Interactive | SCR-007, SCR-019, SCR-020, SCR-021 | High | Pending |
| Form Select | Interactive | SCR-007, SCR-020, SCR-023 | High | Pending |
| Date Picker | Interactive | SCR-007, SCR-008, SCR-024 | High | Pending |
| Search Input | Interactive | SCR-011, SCR-024, SCR-025, SCR-030 | Medium | Pending |
| Toggle Switch | Interactive | SCR-013, SCR-014, SCR-018 | Medium | Pending |
| Step Indicator | Navigation | SCR-007, SCR-019 | High | Pending |
| Tab Bar | Navigation | SCR-004, SCR-005, SCR-006, SCR-017 | High | Pending |
| Breadcrumb | Navigation | All authenticated screens | Medium | Pending |
| Pagination | Navigation | SCR-011, SCR-024, SCR-025, SCR-030 | Medium | Pending |
| Modal Dialog | Feedback | SCR-009, SCR-022, SCR-027, SCR-012 | High | Pending |
| Confirmation Dialog | Feedback | Multiple screens (delete, logout) | High | Pending |
| Alert Banner | Feedback | SCR-029, error states | Medium | Pending |
| Success Toast | Feedback | Post-save actions | Medium | Pending |
| Badge (Status) | Feedback | SCR-010, SCR-011, SCR-025, SCR-028 | High | Pending |
| Badge (Role) | Feedback | SCR-004, SCR-023 | Medium | Pending |
| Progress Bar | Feedback | SCR-016, SCR-019 | Medium | Pending |
| Avatar | Content | Sidebar, SCR-004, SCR-025 | Medium | Pending |
| Drop Zone | Interactive | SCR-016 | Medium | Pending |
| Chat Bubble | Content | SCR-018 | Medium | Pending |
| Chat Input Bar | Interactive | SCR-018 | Medium | Pending |
| HIPAA Badge | Feedback | All authenticated screens | High | Pending |
| Time Slot Grid | Interactive | SCR-007, SCR-008, SCR-012 | High | Pending |
| Role Matrix | Interactive | SCR-023 | Medium | Pending |

## Detailed Component Specifications

### Layout Components

#### Sidebar Navigation

- **Type**: Layout
- **Used In Screens**: All authenticated screens (SCR-004 through SCR-031)
- **Description**: Persistent left sidebar with logo, role-based navigation sections, and user footer
- **Variants**: Admin Sidebar, Staff Sidebar, Patient Sidebar
- **Interactive States**: Default, Hover (nav items), Active (current page), Focus
- **Responsive Behavior**:
  - Desktop (1440px): Expanded with labels (260px wide)
  - Tablet (768px): Collapsed icon-only mode (60px wide)
  - Mobile (375px): Off-canvas drawer triggered by hamburger
- **Implementation Notes**: Fixed position, scrollable if content exceeds viewport; role-based menu filtering via data attributes

#### Top Bar

- **Type**: Layout
- **Used In Screens**: All authenticated screens
- **Description**: Sticky header with breadcrumb navigation, search, notifications bell, and user avatar/menu
- **Variants**: Default
- **Interactive States**: Default, Search focused, Notification badge visible
- **Responsive Behavior**:
  - Desktop (1440px): Full breadcrumb + search + actions
  - Tablet (768px): Condensed breadcrumb, icon-only actions
  - Mobile (375px): Hamburger trigger replaces breadcrumb; actions in overflow menu
- **Implementation Notes**: Sticky top positioning; z-index above content, below modals

#### Login Card

- **Type**: Layout
- **Used In Screens**: SCR-001, SCR-002, SCR-003
- **Description**: Centered authentication card with logo, form fields, and submit button
- **Variants**: Admin Login, Staff Login, Patient Login (branding label differs)
- **Interactive States**: Default, Loading (spinner on button), Error (alert banner)
- **Responsive Behavior**:
  - Desktop (1440px): Centered card (440px max-width)
  - Tablet (768px): Same centered card
  - Mobile (375px): Full-width with padding
- **Implementation Notes**: Full-page background; auto-focus on first input

### Content Components

#### Stat Card

- **Type**: Content
- **Used In Screens**: SCR-004, SCR-005, SCR-006
- **Description**: Compact KPI card showing label, value, and change indicator
- **Variants**: Default, Positive trend, Negative trend
- **Interactive States**: Default, Hover (subtle shadow lift)
- **Responsive Behavior**:
  - Desktop (1440px): 4-column grid
  - Tablet (768px): 2-column grid
  - Mobile (375px): Stacked single column
- **Implementation Notes**: Use `font-variant-numeric: tabular-nums` for aligned numbers

#### Data Table

- **Type**: Content
- **Used In Screens**: SCR-011, SCR-024, SCR-025, SCR-028, SCR-030
- **Description**: Full-featured data table with sorting, filtering, search, and pagination
- **Variants**: Default, Selectable (with checkboxes), Expandable (with row details)
- **Interactive States**: Default, Row hover, Sort active, Loading skeleton
- **Responsive Behavior**:
  - Desktop (1440px): Full table with all columns visible
  - Tablet (768px): Horizontal scroll, sticky first column
  - Mobile (375px): Card-based list view (table hidden)
- **Implementation Notes**: Left-align text, right-align numbers, bold headers; virtual scroll for 100+ rows

#### Appointment Card

- **Type**: Content
- **Used In Screens**: SCR-006, SCR-010, SCR-011
- **Description**: Card displaying appointment summary with status, date/time, provider, and actions
- **Variants**: Upcoming, Past, Cancelled, Waitlisted
- **Interactive States**: Default, Hover, Active (clicked)
- **Responsive Behavior**:
  - Desktop (1440px): Horizontal layout with actions on right
  - Tablet (768px): Same layout with reduced padding
  - Mobile (375px): Stacked layout, actions below content
- **Implementation Notes**: Status badge color-coded; click navigates to SCR-010

#### Patient Card

- **Type**: Content
- **Used In Screens**: SCR-025, SCR-026, SCR-027
- **Description**: Card showing patient name, avatar, appointment time, and queue actions
- **Variants**: In Queue, Arrived, No-Show
- **Interactive States**: Default, Hover, Selected
- **Responsive Behavior**:
  - Desktop (1440px): Horizontal card with inline actions
  - Mobile (375px): Stacked with bottom actions
- **Implementation Notes**: Real-time status updates via badge; action buttons min-height 44px

#### Document Card

- **Type**: Content
- **Used In Screens**: SCR-016, SCR-017
- **Description**: File card showing document name, type icon, upload date, and extraction status
- **Variants**: Uploaded, Processing, Extracted, Error
- **Interactive States**: Default, Hover, Loading (skeleton)
- **Responsive Behavior**:
  - Desktop (1440px): Grid of cards (3 columns)
  - Mobile (375px): Stacked list view
- **Implementation Notes**: Click opens document viewer or extracted data panel

#### Alert Card

- **Type**: Content
- **Used In Screens**: SCR-028, SCR-029
- **Description**: Highlighted card for warnings and risk indicators
- **Variants**: High Risk (red), Medium Risk (orange), Low Risk (yellow), Info (blue)
- **Interactive States**: Default, Hover, Dismissed
- **Responsive Behavior**: Full-width on all breakpoints
- **Implementation Notes**: Color-coded border-left indicator; dismiss button optional

#### Chat Bubble

- **Type**: Content
- **Used In Screens**: SCR-018
- **Description**: Message bubble for AI conversational intake
- **Variants**: Bot message (left-aligned, blue background), User message (right-aligned, primary)
- **Interactive States**: Default, Loading (typing indicator)
- **Responsive Behavior**: Max-width 75% on all breakpoints
- **Implementation Notes**: `aria-live="polite"` region for new messages

#### Avatar

- **Type**: Content
- **Used In Screens**: Sidebar footer, SCR-004, SCR-020, SCR-021, SCR-025
- **Description**: Circular user avatar with initials fallback
- **Variants**: Small (32px), Medium (40px — default), Large (56px)
- **Interactive States**: Default
- **Responsive Behavior**: Size scales down on mobile
- **Implementation Notes**: Primary color background with white text initials

### Interactive Components

#### Button (Primary)

- **Type**: Interactive
- **Used In Screens**: All screens
- **Description**: Primary action button with filled background
- **Variants**: Primary, Secondary (outline), Danger (red), Ghost (text only), Icon-only
- **Interactive States**: Default, Hover, Active, Focus (outline ≥3:1 contrast), Disabled (0.5 opacity), Loading (spinner)
- **Responsive Behavior**: Full-width on mobile for primary CTAs
- **Implementation Notes**: Min-height 44px, min-width 44px for touch targets

#### Form Input

- **Type**: Interactive
- **Used In Screens**: SCR-001–003, SCR-007, SCR-019, SCR-020, SCR-021
- **Description**: Text input field with label, placeholder, and optional helper/error text
- **Variants**: Text, Password (with show/hide toggle), Email, Date, Number
- **Interactive States**: Default, Hover, Focus (blue ring), Error (red border + message), Disabled, Read-only
- **Responsive Behavior**: Full-width on all breakpoints
- **Implementation Notes**: Min-height 44px; `aria-describedby` for errors/hints; `aria-invalid` on error

#### Form Select

- **Type**: Interactive
- **Used In Screens**: SCR-007, SCR-009, SCR-020, SCR-023
- **Description**: Dropdown select with label and optional placeholder
- **Variants**: Single select, Multi-select (for roles)
- **Interactive States**: Default, Hover, Focus, Open, Disabled
- **Responsive Behavior**: Full-width, native select on mobile
- **Implementation Notes**: Min-height 44px; keyboard navigable with arrow keys

#### Date Picker

- **Type**: Interactive
- **Used In Screens**: SCR-007, SCR-008, SCR-024
- **Description**: Calendar date selector with month navigation
- **Variants**: Single date, Date range
- **Interactive States**: Default, Hover (day cell), Selected, Today highlight, Disabled dates
- **Responsive Behavior**: Dropdown on desktop; full-screen on mobile
- **Implementation Notes**: `aria-label` on each day cell; navigable via arrow keys

#### Search Input

- **Type**: Interactive
- **Used In Screens**: SCR-011, SCR-024, SCR-025, SCR-030
- **Description**: Search field with magnifying glass icon
- **Variants**: Default, With filter dropdown
- **Interactive States**: Default, Focus, Active (has value), Loading
- **Responsive Behavior**: Full-width on mobile; 280px on desktop
- **Implementation Notes**: Debounced search (300ms); `role="search"` landmark

#### Toggle Switch

- **Type**: Interactive
- **Used In Screens**: SCR-013, SCR-014, SCR-018
- **Description**: Binary on/off toggle
- **Variants**: Default, With label
- **Interactive States**: Off, On, Hover, Focus, Disabled
- **Responsive Behavior**: Same on all breakpoints
- **Implementation Notes**: `role="switch"`, `aria-checked`; min-height 44px

#### Drop Zone

- **Type**: Interactive
- **Used In Screens**: SCR-016
- **Description**: Drag-and-drop file upload area with click fallback
- **Variants**: Empty, Dragging over, Files added
- **Interactive States**: Default, Drag-hover (blue dashed border), Active, Error
- **Responsive Behavior**: Full-width on all breakpoints
- **Implementation Notes**: `aria-label="Upload clinical documents"`; accepted types listed

#### Chat Input Bar

- **Type**: Interactive
- **Used In Screens**: SCR-018
- **Description**: Text input with send button for AI chat
- **Variants**: Default, With "Switch to Manual" button
- **Interactive States**: Default, Focus, Sending (disabled + spinner)
- **Responsive Behavior**: Sticky bottom on all breakpoints
- **Implementation Notes**: Enter to send; `aria-label="Type your message"`

#### Time Slot Grid

- **Type**: Interactive
- **Used In Screens**: SCR-007, SCR-008, SCR-012
- **Description**: Grid of available time slots for appointment selection
- **Variants**: Available, Selected, Unavailable, Preferred (for swap)
- **Interactive States**: Default, Hover, Selected, Disabled
- **Responsive Behavior**: 4-column grid on desktop → 2-column on mobile
- **Implementation Notes**: `role="radiogroup"` with `role="radio"` per slot; arrow key navigation

#### Role Matrix

- **Type**: Interactive
- **Used In Screens**: SCR-023
- **Description**: Permission assignment matrix with roles as columns and permissions as rows
- **Variants**: Default
- **Interactive States**: Checkbox checked, unchecked, indeterminate
- **Responsive Behavior**: Horizontal scroll on mobile
- **Implementation Notes**: `aria-label` on each checkbox describing role+permission

### Navigation Components

#### Step Indicator

- **Type**: Navigation
- **Used In Screens**: SCR-007, SCR-019
- **Description**: Horizontal step progress indicator for multi-step flows
- **Variants**: Default (numbered steps), With labels
- **Interactive States**: Completed (checkmark), Current (`aria-current="step"`), Upcoming (dimmed)
- **Responsive Behavior**: Compact (numbers only) on mobile
- **Implementation Notes**: `aria-label="Step X of Y"` on each step; clickable for completed steps

#### Tab Bar

- **Type**: Navigation
- **Used In Screens**: SCR-004, SCR-005, SCR-006, SCR-017
- **Description**: Horizontal tab navigation for content sections
- **Variants**: Default, With badge counts
- **Interactive States**: Default, Hover, Active, Focus
- **Responsive Behavior**: Horizontal scroll on mobile if tabs exceed viewport
- **Implementation Notes**: `role="tablist"` / `role="tab"` / `role="tabpanel"`; arrow key navigation

#### Breadcrumb

- **Type**: Navigation
- **Used In Screens**: All authenticated screens
- **Description**: Hierarchical path indicator in top bar
- **Variants**: Default
- **Interactive States**: Links hover underline; current page non-interactive
- **Responsive Behavior**: Truncated to last 2 items on mobile
- **Implementation Notes**: `aria-label="Breadcrumb"` on nav; `aria-current="page"` on last item

#### Pagination

- **Type**: Navigation
- **Used In Screens**: SCR-011, SCR-024, SCR-025, SCR-030
- **Description**: Page navigation for tabular data
- **Variants**: Default (numbered), Compact (prev/next only)
- **Interactive States**: Default, Hover, Active (current page), Disabled (no prev/next)
- **Responsive Behavior**: Compact mode on mobile
- **Implementation Notes**: `aria-label="Pagination"`; `aria-current="page"` on active; min-height 44px per button

### Feedback Components

#### Modal Dialog

- **Type**: Feedback
- **Used In Screens**: SCR-009, SCR-012, SCR-022, SCR-027
- **Description**: Overlay dialog for confirmations and forms
- **Variants**: Confirmation, Form, Danger (red accent)
- **Interactive States**: Open, Closing (fade out)
- **Responsive Behavior**: Centered (520px max-width) on desktop; full-screen on mobile
- **Implementation Notes**: `role="dialog"`, `aria-modal="true"`, focus trap, ESC to close

#### Alert Banner

- **Type**: Feedback
- **Used In Screens**: SCR-029, error states across all screens
- **Description**: Inline alert with icon, message, and optional dismiss
- **Variants**: Success (green), Warning (orange), Error (red), Info (blue)
- **Interactive States**: Default, Dismissed (hidden)
- **Responsive Behavior**: Full-width on all breakpoints
- **Implementation Notes**: `role="alert"` for error/warning; `role="status"` for success/info

#### Badge (Status)

- **Type**: Feedback
- **Used In Screens**: SCR-010, SCR-011, SCR-025, SCR-028, SCR-031
- **Description**: Inline status indicator pill
- **Variants**: Success, Warning, Error, Info, Neutral
- **Interactive States**: Static (non-interactive)
- **Responsive Behavior**: Same on all breakpoints
- **Implementation Notes**: Semantic color; `aria-label` describing status when not adjacent to text

#### Progress Bar

- **Type**: Feedback
- **Used In Screens**: SCR-016, SCR-019
- **Description**: Horizontal progress indicator for upload and form completion
- **Variants**: Determinate (with %), Indeterminate (animated)
- **Interactive States**: In progress, Complete, Error
- **Responsive Behavior**: Full-width on all breakpoints
- **Implementation Notes**: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

#### HIPAA Badge

- **Type**: Feedback
- **Used In Screens**: All authenticated screens (sidebar footer)
- **Description**: Small badge indicating HIPAA-compliant data handling
- **Variants**: Default (green lock icon + text)
- **Interactive States**: Static
- **Responsive Behavior**: Hidden on icon-only sidebar; tooltip on hover
- **Implementation Notes**: Visual trust indicator; decorative (no interactive purpose)

## Component Relationships

```
Shell Layout
├── Sidebar Navigation
│   ├── Sidebar Logo
│   ├── Nav Section Labels
│   ├── Nav Items (with icons + badges)
│   ├── Avatar (user profile)
│   └── HIPAA Badge
├── Top Bar
│   ├── Breadcrumb
│   ├── Search Input
│   ├── Notification Bell (badge)
│   └── Avatar (user menu)
└── Content Area
    ├── Page Header (H1 + action buttons)
    ├── Stat Row (grid of Stat Cards)
    ├── Filter Bar (Search + Filters)
    ├── Tab Bar
    ├── Card / Data Table / Form
    │   ├── Table Header (sortable)
    │   ├── Table Rows (selectable)
    │   └── Pagination
    ├── Chat Container (AI Intake)
    │   ├── Chat Bubbles (bot/user)
    │   └── Chat Input Bar
    └── Modal Overlay
        └── Modal (header + body + footer)
```

## Component States Matrix

| Component | Default | Hover | Active | Focus | Disabled | Error | Loading | Empty |
|---|---|---|---|---|---|---|---|---|
| Button (Primary) | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | — |
| Button (Secondary) | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | — |
| Button (Danger) | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Form Input | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Form Select | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Date Picker | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Search Input | ✓ | — | ✓ | ✓ | — | — | ✓ | ✓ |
| Toggle Switch | ✓ | ✓ | — | ✓ | ✓ | — | — | — |
| Data Table | ✓ | ✓ (row) | — | — | — | — | ✓ | ✓ |
| Card (Stat/Appt/Doc) | ✓ | ✓ | — | — | — | — | ✓ | ✓ |
| Modal Dialog | ✓ | — | — | ✓ | — | — | — | — |
| Alert Banner | ✓ | — | — | — | — | — | — | — |
| Badge | ✓ | — | — | — | — | — | — | — |
| Tab Bar | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| Pagination | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Chat Bubble | ✓ | — | — | — | — | — | ✓ | — |
| Drop Zone | ✓ | — | ✓ | ✓ | — | ✓ | — | ✓ |
| Time Slot | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Progress Bar | ✓ | — | — | — | — | ✓ | ✓ | — |
| Avatar | ✓ | — | — | — | — | — | — | — |
| Step Indicator | ✓ | — | ✓ | — | — | — | — | — |

## Reusability Analysis

| Component | Reuse Count | Screens | Recommendation |
|---|---|---|---|
| Button (Primary) | 31 screens | All | Shared component |
| Sidebar Navigation | 28 screens | All authenticated | Shared component (3 role variants) |
| Top Bar | 28 screens | All authenticated | Shared component |
| Form Input | 14 screens | Login, Booking, Intake, Admin | Shared component |
| Badge (Status) | 12 screens | Appointments, Queue, Insurance | Shared component |
| Data Table | 8 screens | Admin, Queue, Coding | Shared component |
| Card | 10 screens | Dashboards, Details, Alerts | Shared component (variant per type) |
| Modal Dialog | 5 screens | Cancel, Deactivate, No-Show, Swap | Shared component |
| Avatar | 6 screens | Sidebar, Admin, Queue | Shared component |
| Drop Zone | 1 screen | SCR-016 | Screen-specific |
| Chat UI | 1 screen | SCR-018 | Screen-specific |
| Role Matrix | 1 screen | SCR-023 | Screen-specific |

## Responsive Breakpoints Summary

| Breakpoint | Width | Components Affected | Key Adaptations |
|---|---|---|---|
| Mobile | 375px | Sidebar, Tables, Cards, Forms, Pagination | Off-canvas sidebar, stacked cards, card-based tables, full-width inputs, compact pagination |
| Tablet | 768px | Sidebar, Stat Grid, Tables | Icon-only sidebar, 2-column grid, horizontal scroll tables |
| Desktop | 1440px | All | Full sidebar, multi-column grids, complete tables, side panels |

## Implementation Priority Matrix

### High Priority (Core Components)

- [ ] Sidebar Navigation — Used in all authenticated screens
- [ ] Top Bar — Used in all authenticated screens
- [ ] Button (Primary/Secondary) — Universal interaction component
- [ ] Form Input / Select — Required for all forms
- [ ] Data Table — Required for admin, queue, and coding screens
- [ ] Stat Card — Required for all dashboards
- [ ] Badge (Status) — Required for appointment and queue status
- [ ] Modal Dialog — Required for confirmations
- [ ] Login Card — Required for authentication entry points

### Medium Priority (Feature Components)

- [ ] Appointment Card — Patient dashboard and details
- [ ] Patient Card — Queue management
- [ ] Document Card — Document management
- [ ] Alert Card — Risk and conflict alerts
- [ ] Step Indicator — Multi-step booking and intake
- [ ] Tab Bar — Dashboard sections and document views
- [ ] Date Picker — Booking and audit filtering
- [ ] Search Input — Table filtering
- [ ] Time Slot Grid — Appointment booking
- [ ] Progress Bar — Upload and intake progress

### Low Priority (Enhancement Components)

- [ ] Chat Bubble / Chat Input — AI intake only
- [ ] Drop Zone — Document upload only
- [ ] Role Matrix — Admin role assignment only
- [ ] Toggle Switch — Settings screens
- [ ] HIPAA Badge — Trust indicator

## Framework-Specific Notes

**Detected Framework**: React (from Technology Stack in spec.md)
**Component Library**: Custom (design token-based; no external UI library specified)

### Framework Patterns Applied

- Component composition via props and children
- State management for form handling and table data
- Role-based conditional rendering for sidebar menus
- React Router for client-side navigation between screens

### Component Library Mappings

| Wireframe Component | Suggested React Component | Customization Required |
|---|---|---|
| Button | `<Button variant="primary">` | Color, size, loading state |
| Form Input | `<Input type="text" error={boolean}>` | Validation integration |
| Data Table | `<DataTable columns={[]} data={[]}>` | Sort, filter, pagination |
| Modal | `<Modal open={boolean} onClose={fn}>` | Focus trap, ARIA |
| Badge | `<Badge variant="success">` | Semantic color mapping |

## Accessibility Considerations

| Component | ARIA Attributes | Keyboard Navigation | Screen Reader Notes |
|---|---|---|---|
| Sidebar Nav | `role="navigation"`, `aria-label="Main"` | Tab between items | Section labels announced |
| Data Table | `role="table"`, `aria-sort` on headers | Tab to table, arrow keys in cells | Sort state announced |
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` | Tab trapped, ESC to close | Title announced on open |
| Tab Bar | `role="tablist"`, `role="tab"`, `role="tabpanel"` | Arrow keys between tabs | Selected tab announced |
| Form Input | `aria-describedby` (hint/error), `aria-invalid` | Tab to input | Error announced via `aria-live` |
| Toggle | `role="switch"`, `aria-checked` | Space to toggle | State change announced |
| Button | `aria-label` (icon-only), `aria-disabled` | Enter/Space to activate | Label or text announced |
| Progress Bar | `role="progressbar"`, `aria-valuenow` | Non-interactive | Percentage announced |
| Chat | `aria-live="polite"` on container | Tab to input, Enter to send | New messages announced |
| Pagination | `aria-label="Pagination"`, `aria-current="page"` | Tab between buttons | Current page announced |
| Step Indicator | `aria-current="step"`, `aria-label="Step X of Y"` | Non-interactive | Current step announced |

## Design System Integration

**Design System Reference**: [designsystem.md](../docs/designsystem.md)

### Components Matching Design System

- [x] Button — Uses primary/secondary/error color tokens
- [x] Form Input — Uses border, focus ring, error color tokens
- [x] Card — Uses surface background, card shadow, border radius tokens
- [x] Badge — Uses semantic color tokens (success, warning, error)
- [x] Typography — Uses modular scale (H1→Caption) and weight tokens
- [x] Spacing — Uses 8px base unit scale throughout
- [x] Avatar — Uses primary color token

### New Components to Add to Design System

- [ ] Chat Bubble — New pattern for AI Intake
- [ ] Drop Zone — File upload interaction pattern
- [ ] Time Slot Grid — Domain-specific appointment component
- [ ] Role Matrix — Admin-specific permission grid
- [ ] HIPAA Badge — Compliance trust indicator
