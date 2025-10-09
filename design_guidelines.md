# Event Management System - Design Guidelines

## Design Approach: Enterprise Productivity System

**Selected Framework:** Material Design with Carbon Design influences for data-heavy sections
**Rationale:** This is a utility-focused, information-dense business application requiring efficiency, clarity, and data visualization capabilities. The combination provides robust component patterns for forms, tables, and dashboards while maintaining professional aesthetics.

---

## Core Design Principles

1. **Clarity Over Decoration**: Every element serves a functional purpose
2. **Efficient Data Density**: Maximize information display without overwhelming users
3. **Consistent Patterns**: Reusable components across all 8 modules
4. **Quick Navigation**: Seamless movement between Configuration, Events, Assets, Vendors, Team, Expenses, To-Do, and Dashboard

---

## Color Palette

### Light Mode
- **Primary**: 220 90% 56% (Professional blue for actions, headers)
- **Secondary**: 220 15% 25% (Dark slate for text, important elements)
- **Background**: 0 0% 98% (Soft white for main canvas)
- **Surface**: 0 0% 100% (Pure white for cards, modals)
- **Border**: 220 13% 91% (Subtle dividers)
- **Success**: 142 71% 45% (Status indicators: completed, paid)
- **Warning**: 38 92% 50% (Pending status, alerts)
- **Error**: 0 84% 60% (Critical states, overdue items)

### Dark Mode
- **Primary**: 220 90% 64% (Lighter blue for contrast)
- **Secondary**: 220 15% 85% (Light gray for text)
- **Background**: 222 47% 11% (Deep dark background)
- **Surface**: 217 33% 17% (Elevated dark surfaces)
- **Border**: 217 20% 25% (Subtle dark borders)
- Status colors maintain same hue, adjusted lightness for dark backgrounds

---

## Typography

**Font Families:**
- Primary: 'Inter', system-ui, sans-serif (body text, UI elements)
- Monospace: 'JetBrains Mono', monospace (financial data, IDs, codes)

**Type Scale:**
- Headings: font-semibold
  - H1: text-3xl (Dashboard titles)
  - H2: text-2xl (Section headers)
  - H3: text-xl (Card titles, module headers)
  - H4: text-lg (Subsection headers)
- Body: text-base, leading-relaxed
- Small: text-sm (metadata, helper text, table data)
- Tiny: text-xs (labels, badges, timestamps)

**Font Weights:**
- Regular (400): Body text
- Medium (500): Table headers, form labels
- Semibold (600): Headings, primary buttons, important data
- Bold (700): Critical alerts, dashboard metrics

---

## Layout System

**Spacing Units:** Tailwind scale - primarily using 2, 4, 6, 8, 12, 16, 20, 24 units

**Grid Structure:**
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Card padding: p-6
- Section spacing: py-8 to py-12
- Form field spacing: space-y-4
- Table cell padding: px-4 py-3

**Responsive Breakpoints:**
- Mobile-first approach
- sm: 640px (tablets)
- md: 768px (small laptops)
- lg: 1024px (desktops)
- xl: 1280px (large screens)

---

## Component Library

### Navigation
- **Sidebar Navigation**: Fixed left sidebar (w-64) with module icons and labels
- **Top Bar**: Company logo, breadcrumb trail, user profile, notifications
- **Mobile**: Collapsible hamburger menu, bottom navigation for key modules

### Data Display
- **Tables**: Striped rows, sticky headers, sortable columns, inline actions
- **Cards**: Rounded corners (rounded-lg), shadow-sm elevation, clear hierarchy
- **Status Badges**: Pill-shaped (rounded-full px-3 py-1), colored by status type
- **Metrics Cards**: Large numbers (text-3xl font-bold), trend indicators, icon support

### Forms & Inputs
- **Input Fields**: Clear labels above, helper text below, error states with red borders
- **Dropdowns**: Searchable multi-selects for vendors/assets/team, clear selected state
- **Date Pickers**: Calendar overlay with range selection for events
- **Radio/Checkboxes**: Clean spacing (space-y-3), clear active states

### Actions
- **Primary Button**: bg-primary text-white, medium size (px-6 py-2.5)
- **Secondary Button**: border-2 border-primary text-primary bg-transparent
- **Icon Buttons**: Square (w-10 h-10), rounded, subtle hover states
- **Floating Action**: Fixed bottom-right for quick event creation (mobile)

### Dashboard Components
- **Stat Cards**: Grid layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- **Charts**: Use Chart.js - bar charts for expenses, line for trends, pie for asset status
- **Timeline**: Vertical timeline for upcoming events with date markers
- **Quick Actions**: Prominent cards for "Add Event", "Record Expense", "Update Status"

### Modals & Overlays
- **Modal**: Max-w-2xl for forms, max-w-6xl for detailed views, backdrop blur
- **Side Panel**: Slide-in from right (w-full md:w-96) for requirement details
- **Toast Notifications**: Top-right position, auto-dismiss, status colors

---

## Module-Specific Designs

### Event Planner
- **List View**: Tabbed interface (Completed, Inquired, In Progress)
- **Event Card**: Client name prominent, date badge, venue, status indicator, requirement count
- **Requirement Detail**: Nested accordion for Asset/Team/Vendor sections with inline editing

### Expense Tracker
- **Transaction List**: Date-grouped entries, color-coded (green=credit, red=debit, blue=transfer)
- **Summary Cards**: Total income, total expenses, net profit with trend arrows
- **Filters**: Date range picker, payment mode selector, category dropdown

### Dashboard
- **Hero Metrics**: 4-column grid - upcoming events, pending payments, asset utilization, team workload
- **Event Status Board**: Kanban-style columns for requirement statuses
- **Expense Graph**: 6-month trend line chart
- **Quick Filters**: Date range, event status, requirement type

---

## Visual Enhancements

**Icons:** Lucide React or Heroicons (outline style for navigation, solid for emphasis)

**Elevation:** 
- Level 0: flat (borders only)
- Level 1: shadow-sm (cards)
- Level 2: shadow-md (modals)
- Level 3: shadow-lg (dropdowns, popovers)

**Animations:** Minimal - only functional
- Page transitions: 150ms fade
- Dropdown open: 100ms ease-out
- Loading states: subtle pulse

**Images:** 
- Empty states: Custom illustrations for "No events", "No expenses" 
- User avatars: Initials with colored backgrounds for team members
- No hero images (utility application)

---

## Accessibility & Consistency

- All form inputs have dark mode support with proper contrast
- Focus indicators: 2px blue ring (ring-2 ring-primary ring-offset-2)
- Keyboard navigation: Full support for tab order, arrow keys in dropdowns
- ARIA labels: Comprehensive labeling for screen readers
- Color contrast: WCAG AA compliant for all text/background combinations
- Consistent dark mode: Forms, inputs, tables all maintain dark theme integrity