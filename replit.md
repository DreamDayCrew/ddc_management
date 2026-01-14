# Dream Day Crew - Event Management System

## Overview

Dream Day Crew is a comprehensive full-stack event management system designed to manage the entire lifecycle of events, from initial inquiry to completion. It facilitates the management of events, assets, vendors, team members, and expenses, offering detailed budget reporting and invoice generation. The system aims to streamline event operations, enhance financial tracking, and provide robust tools for both web and mobile users.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend uses React 19 with TypeScript, Vite for fast development, Wouter for routing, and TanStack Query for server state management. UI components are built with shadcn/ui on Radix UI primitives and styled using TailwindCSS, adhering to Material Design principles. State management combines React Query for server state and React hooks/context for local UI state, with form handling via react-hook-form and Zod validation. Key design patterns include component composition, a centralized API client, shared TypeScript schemas, and toast notifications.

### Backend Architecture

The backend is an Express.js API with TypeScript, supporting CORS and JSON body parsing. It utilizes Neon serverless PostgreSQL with Drizzle ORM for type-safe database operations and a schema-first approach. The data model includes core entities like Configuration, Events, Requirements, FulfillmentPlans, Assets, Vendors, TeamMembers, and Expenses. The API provides RESTful endpoints for CRUD operations, nested routes for relationships, and specialized routes for reports and invoice generation. A storage abstraction layer with an `IStorage` interface facilitates data operations.

### Data Flow & Business Logic

The system manages an event workflow from "Inquired" to "Completed" status. Requirements are added to events, and FulfillmentPlans link these to resources, tracking actual costs. Invoice generation is server-side using `@react-pdf/renderer`, integrating event details, requirements, and configuration data for dynamic PDF creation with branding, GST calculation, and currency formatting. Budget reporting for completed events compares quoted values against actual costs from fulfillment plans to calculate variances.

### Event List PDF Download

The Events page includes a "Download" button to generate a PDF of all completed events with configurable options:
- **Always Included**: Event Name, Service Provided
- **Optional Sections** (user selectable):
  - Customer Info: Name, Phone, Email, Address
  - Event Info: Venue, Event Date, Status
  - Payment Info: Invoice Value, Payment Status, DDC Spent
  - Service Statistics: Count of events by service type

**API Endpoint**: `GET /api/events/completed/pdf?customerInfo=true&eventInfo=true&paymentInfo=true&stats=true`
**Template**: `server/event-list-template.tsx` - Landscape A4 PDF with summary section, optional stats grid, and event table
**Calculations**: Invoice value = sum(price × quantity - discount) for non-dropped requirements; DDC spent = sum(payment) from fulfillment plans

### Dropped Requirements Handling

Requirements can be marked as "Dropped" to exclude them from financial calculations while maintaining visibility in reports:
- **Invoice/Quotation PDFs**: Dropped requirements are completely filtered out and not shown
- **Invoice Value calculation**: Uses `requirements.filter(req => req.requirementStatus !== 'Dropped')` before summing
- **DDC Spent calculation**: Only includes fulfillment plans for non-dropped requirements
- **Event Report PDF**: Shows dropped requirements with visual indicators (light red background, strikethrough, "DROPPED" badge) but excludes them from totals
- **Dashboard**: Requirement summary shows Dropped count with destructive color styling
- **Pattern**: Always filter using `req.requirementStatus !== 'Dropped'` before any financial calculation

### Expense Linking Architecture

Expenses use a forward-reference pattern where expenses point to events/plans (not vice versa):
- **Event payments (income)**: Expense records have an `eventId` field linking to the event receiving payment
- **Fulfillment payments (debit)**: Expense records have a `fulfillmentPlanId` field linking to the plan being paid
- **Lookup endpoints**: `/api/expenses/by-event/:eventId` and `/api/expenses/by-plan/:planId` retrieve linked expenses
- **Storage methods**: `getExpenseByEventId()` and `getExpenseByPlanId()` in both MemStorage and DatabaseStorage
- **Type inference**: Expense type (Credit/Debit) is implicit based on which foreign key is populated

#### Expense Linking in Add Plan Mode

Expense linking works in both Add and Edit modes for fulfillment plans:
- **Add Mode**: Uses `pendingExpenseData` state to store expense amount/date until plan is saved. After plan creation, the expense is automatically created and linked via the `createMutation.onSuccess` handler.
- **Edit Mode**: Creates/updates expenses directly in the database using the plan's ID.
- **UI Behavior**: Button shows "Prepare Expense" in Add mode, "Link Expense" in Edit mode, and "View Linked Expense" when expense exists.
- **Validation Rules**:
  - Pending status: No expenses should be linked (total = 0)
  - Partial status: Linked expense must be greater than 0 but less than plan amount
  - Paid status: Linked expense amount must equal the plan payment amount
- **Validation Display**: Inline amber-colored warnings appear below the payment status selector when there's a mismatch
- **Duplicate Prevention**: Server-side check in POST /api/expenses returns 409 Conflict if expense already exists for the plan/event. Frontend handles 409 gracefully.

### Mobile Application Architecture

The mobile application is built with React Native and Expo, sharing TypeScript types with the web application. It integrates with the Express backend via an Axios-based API client and uses TanStack Query for data fetching and caching. The app supports configuration-driven dropdowns and native date pickers. It features a dashboard with swipeable carousel, KPI cards (Total Income, Total Expense, Account Balance, Pending Repayment), and full CRUD functionality across all main screens (Events, Expenses, Assets, Team).

### UI/UX Decisions

Both web and mobile applications adopt a consistent maroon color scheme. The web app supports dark mode and features responsive sidebar navigation. The mobile app uses bottom tab navigation, professional Ionicons, and floating action buttons (FABs). Specific UI elements like StarRating components for reviews and dynamic column rendering in invoices based on data presence (e.g., DISCOUNT column) enhance user experience. Configuration screens allow for branding customization including logo, signature, and terms & conditions.

### Asset Rental System

The Asset Rental System provides standalone equipment rental functionality, separate from event management:

**Data Model:**
- **AssetRentalRates**: Pricing tiers per asset (e.g., "4 hrs - Rs.500", "1 day - Rs.1000")
  - Flexible numeric duration with fixed time units (hrs/day)
  - Links to existing Assets via assetId
- **Rentals**: Customer rental orders with status tracking (Quote/Invoice/Paid/Returned)
  - Customer details: name, phone, email, address
  - Payment tracking: status (Pending/Partial/Paid), mode, discount
  - Cascade delete: deleting rental removes all items
- **RentalItems**: Line items linking assets to rentals
  - Quantity, duration, time unit, rate per unit, total amount

**Web Pages:**
- `/rental-rates` - Manage pricing tiers per asset
- `/rentals` - List and filter rental orders
- `/rentals/:id` - Create/edit rental with line items

**PDF Generation:**
- `/api/rentals/:id/pdf?type=quote` - Generate rental quote PDF
- `/api/rentals/:id/pdf?type=invoice` - Generate rental invoice PDF
- Uses same branding/layout as event invoices via RentalTemplate component

**API Routes:**
- `GET/POST /api/rental-rates` - List/create rental rates
- `GET/PATCH/DELETE /api/rental-rates/:id` - Single rate operations
- `GET/POST /api/rentals` - List/create rentals
- `GET/PATCH/DELETE /api/rentals/:id` - Single rental operations
- `GET /api/rentals/:rentalId/items` - Get items for a rental
- `GET/POST/PATCH/DELETE /api/rental-items/:id` - Rental item operations

### Image Management

Requirement images are available only for completed events. Key features:
- **Upload**: Maximum 5 images per requirement, supports JPEG/PNG/GIF/WebP (max 5MB each)
- **Storage**: Images uploaded to Cloudinary cloud storage, URLs stored in database
- **Web Viewer**: Click to enlarge with lightbox dialog, delete confirmation dialog
- **Mobile Viewer**: Full-screen viewing with pinch-to-zoom (ImageViewer component), swipe navigation for multiple images
- **Delete**: Available from both thumbnail grid and full-screen viewer, with confirmation dialog

## External Dependencies

### Third-Party Services

-   **Neon Database**: Serverless PostgreSQL hosting for all persistent data storage, accessed via `@neondatabase/serverless`.
-   **Cloudinary**: Cloud-based image storage for requirement images. Images are uploaded via the backend API using multer memory storage, then sent to Cloudinary. Full URLs are stored in the database. Credentials stored as secrets: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

### Key NPM Packages

-   **@radix-ui/react-\***: Headless UI primitives.
-   **@tanstack/react-query**: Server state management and caching.
-   **drizzle-orm**, **drizzle-kit**: Type-safe ORM and CLI for database operations.
-   **zod**: Runtime type validation.
-   **react-hook-form**, **@hookform/resolvers**: Form state management and validation.
-   **@react-pdf/renderer**: Server-side PDF generation.
-   **date-fns**: Date manipulation.
-   **recharts**: Chart components.
-   **axios**: HTTP client for mobile app.
-   **expo**: Mobile app framework.
-   **@react-native-community/datetimepicker**: Native date pickers for mobile.
-   **expo-image-picker**: Image selection for mobile.

### Development Tools

-   **Vite**: Frontend build tool.
-   **TypeScript**: Type safety across the stack.
-   **TailwindCSS**: Utility-first CSS framework.
-   **esbuild**: Backend bundler.