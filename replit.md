# Dream Day Crew - Event Management System

## Overview

Dream Day Crew is a comprehensive full-stack event management system built for managing the complete lifecycle of events from inquiry to completion. The system handles events, assets, vendors, team members, expenses, and provides detailed budget reporting and invoice generation capabilities.

**Technology Stack:**
- **Frontend**: React with TypeScript, Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM
- **Mobile**: React Native with Expo (separate mobile app)
- **PDF Generation**: @react-pdf/renderer for invoices

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### December 3, 2025 - Dashboard Swipeable Carousel
- **Disney+ Hotstar Style Carousel**: Added swipeable card carousel at the top of the Dashboard
- **Two Cards**: 
  - Card 1: DDC logo with "Dream Day Crew - Event Management Excellence" branding
  - Card 2: Account Balance view with Credit, Debit, and Pending metrics
- **Smooth Gestures**: FlatList with pagingEnabled and snapToInterval for smooth swipe experience
- **Pagination Dots**: Active indicator dots that update as user swipes between cards
- **Maroon Theme**: Consistent branding with maroon gradient backgrounds
- **Located in**: `mobile/src/screens/DashboardScreen.tsx`

### December 3, 2025 - Plan-Level Review System
- **Review Feature**: Added review capability at the fulfillment plan level for granular vendor/team feedback
- **Review Fields**: Customer rating (1-5 stars), Team rating (1-5 stars), Review notes (text)
- **Visibility**: Reviews only appear when event status is "Completed"
- **Web App Implementation**: 
  - StarRating component with clickable stars
  - Inline editing with Cancel/Save buttons
  - Display mode shows existing ratings and notes
  - Located in `client/src/components/requirement-item.tsx`
- **Mobile App Implementation**:
  - Star ratings using Ionicons (star/star-outline)
  - Tappable stars for instant rating updates
  - Review section in each plan item for viewing (EventDetailsScreen)
  - Review editing in AddPlanModal when editing existing plans
  - Located in `mobile/src/screens/EventDetailsScreen.tsx` and `mobile/src/components/AddPlanModal.tsx`
- **API Endpoint**: `PATCH /api/plans/:id/review` for updating plan reviews
- **Schema Changes**: Added `customerRating`, `teamRating`, `reviewNotes` columns to `fulfillment_plans` table

### December 2, 2025 - Unified Invoice Templates with Conditional DISCOUNT Column
- **Identical PDF Output**: Web app and mobile app now generate identical invoice PDFs
- **Invoice Layout**: Three-column header (logo left, business info center, "Invoice" title right)
- **Header Divider**: Horizontal line added below header section for visual separation
- **Currency Formatting**: Proper Indian number system (₹1,23,456.00 format with lakhs/crores)
- **Conditional DISCOUNT Column**:
  - DISCOUNT column only appears when at least one requirement has a discount
  - Without discount: 5 columns (#, DESCRIPTION, QTY, PRICE, TOTAL)
  - With discount: 6 columns (#, DESCRIPTION, QTY, PRICE, DISCOUNT, TOTAL)
  - Dynamic column widths adjust based on discount presence
- **Invoice Formula**:
  - PRICE shows original unit price (req.price)
  - DISCOUNT shows requirement-level discount amount or '-' if none
  - TOTAL shows final amount: (PRICE × QTY) - DISCOUNT = TOTAL
  - Event-level discounts shown as separate row (unchanged)
- **GST Calculation**: 18% GST displayed as separate row with GST number
- **Professional Elements**: "Dear Sir/Mam" greeting, closing message, payment instructions
- **Two-Column Footer**: Terms & Conditions (left), Payment Instructions (right)

### November 14, 2025 - Critical Mobile App Fixes
- **Dashboard Fix**: Fixed BottomTabNavigator to use full DashboardScreen instead of DashboardScreenSimple, restoring complete dashboard with financial overview, event statistics, requirements progress, and resources summary
- **Requirement Creation Fix**: Fixed AddRequirementModal to send integers (not floats) for price/quantity/order fields, matching backend schema expectations. Corrected invoice calculation to order = price * quantity
- **Asset Delete Feature**: Implemented complete delete functionality for assets
  - Added useDeleteAsset hook to mobile/src/hooks/useApi.ts
  - Added trash icon button in asset list items (top-right header)
  - Implemented Alert.alert confirmation dialog with destructive action styling
  - Used event.stopPropagation() to prevent edit action when delete is clicked
  - Added accessibility attributes for screen readers
- **Code Cleanup**: Removed unused DashboardScreenSimple.tsx file
- **Verification**: Confirmed Add Plan functionality is properly integrated in EventDetailsScreen (button + modal working correctly)
- **Expense Calculations**: Verified Account Balance and Pending Repayment calculations are mathematically correct (net DDC Fund balance tracking)

### November 11, 2025 - Mobile App Complete CRUD & Enhanced UX
- **Native Date Pickers**: Created reusable DatePicker component using @react-native-community/datetimepicker with iOS (spinner) and Android (calendar) support, integrated into Event, Expense, and Asset modals
- **Configuration Dropdowns**: Created reusable Picker component with configuration-driven dropdowns for:
  - Service types in Event modal
  - Expense categories, from/to accounts, and payment status
  - Asset categories
  - All dropdowns fetch from backend configuration API
- **Edit Functionality**: Added tap-to-edit on all 4 screens (Events, Expenses, Assets, Team) with proper form pre-filling via useEffect hooks for state synchronization
- **Enhanced Expenses Screen**: Rebuilt with 4 scrollable KPI cards showing:
  - Total Income (green) - sum of all Credit transactions
  - Total Expense (red) - sum of all Debit transactions
  - Account Balance (maroon) - DDC Fund net balance
  - Pending Repayment (amber) - outstanding transfers from DDC Fund to team members
- **API Enhancements**: Added update mutations (useUpdateEvent, useUpdateExpense, useUpdateAsset, useUpdateTeamMember) with proper cache invalidation
- **Professional Icons**: Ionicons throughout navigation (calendar, wallet, people, cube, analytics)
- **Floating Action Buttons**: Maroon-themed FAB buttons on all screens for quick creation
- **Brand Theme**: Applied maroon (#800020) color scheme throughout navigation, buttons, and headers

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 19 with TypeScript for type safety
- Vite for fast development and optimized production builds
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI Component Strategy:**
- shadcn/ui component library built on Radix UI primitives
- TailwindCSS for utility-first styling with custom design tokens
- Material Design principles with Carbon Design influences for data-heavy sections
- Dark mode support via ThemeProvider context
- Responsive sidebar navigation using shadcn sidebar components

**State Management:**
- React Query handles all server state with automatic caching, refetching, and invalidation
- React hooks and context for local UI state (theme, dialogs, forms)
- Form state managed by react-hook-form with Zod validation schemas

**Key Design Patterns:**
- Component composition with shadcn/ui primitives (Dialog, Card, Form, etc.)
- Centralized API client with error handling and type safety
- Shared TypeScript schemas between frontend and backend via `@shared/schema`
- Toast notifications for user feedback on mutations

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript for REST API
- CORS enabled for mobile app and cross-origin requests
- JSON body parsing with 50mb limit to support logo uploads
- Request/response logging middleware

**Database Layer:**
- Neon serverless PostgreSQL for production database
- Drizzle ORM for type-safe database operations
- Schema-first approach with migrations in `/migrations` directory
- Automatic database seeding on startup with sample data

**Data Model:**
The system uses a relational schema with the following core entities:
- **Configuration**: Single-row table storing business settings, categories, and dropdown options
- **Events**: Main entity for event management with status workflow
- **Requirements**: Nested under events, representing individual event needs
- **FulfillmentPlans**: Nested under requirements, linking to team/vendors/assets
- **Assets**: Inventory management with categories and purchase tracking
- **Vendors**: Third-party service providers with ratings and categories
- **TeamMembers**: Internal team with designations
- **Expenses**: Financial transactions with Credit/Debit/Transfer types

**API Design:**
- RESTful endpoints under `/api` prefix
- CRUD operations for all entities
- Nested routes for relationships (e.g., `/api/events/:id/requirements`)
- Special routes for reports (`/api/reports/budget`) and invoice generation
- Health check endpoint at `/health` for deployment monitoring

**Storage Abstraction:**
- `IStorage` interface defines all data operations
- `DatabaseStorage` implementation using Drizzle ORM
- Centralized storage instance exported from `server/storage.ts`
- Enables easy testing and potential storage backend swaps

### Data Flow & Business Logic

**Event Workflow:**
1. Events start as "Inquired" status
2. Requirements are added to events with invoice values
3. FulfillmentPlans link requirements to team members, vendors, or assets
4. Plans track actual costs (team payments, vendor amounts, asset purchases)
5. Events move through statuses: Inquired → In Progress → Completed
6. Budget reports calculate variance between finalized quote and actual spending

**Invoice Generation:**
- PDF invoices generated server-side using @react-pdf/renderer
- Data sources: Event details, Requirements, Configuration (business info, GST, T&C)
- Client details parsed from pipe-separated format (Name | Contact | Address | Email)
- Automatic GST calculation (18%) and totals
- Logo and signature image support via base64 encoding

**Budget Reporting:**
- Only available for completed events with finalized quotes
- Compares requirement invoice values vs actual fulfillment plan costs
- Calculates variance at both event-level and requirement-level
- Actual costs aggregated from team payments, vendor amounts, and asset purchases

### Mobile Application Architecture

**Framework:**
- React Native with Expo for cross-platform development
- Bottom tab navigation with 5 main screens
- Same TypeScript types shared from web application

**API Integration:**
- Axios-based API client connecting to Express backend
- Environment-specific configuration (development vs production)
- TanStack Query for data fetching and caching (consistent with web app)

**Development vs Production:**
- Development: Uses Android emulator localhost (`http://10.0.2.2:5000`)
- Production: Configured via `EXPO_PUBLIC_API_URL` environment variable
- APK builds require production URL configuration before building

### External Dependencies

**Third-Party Services:**
- **Neon Database**: Serverless PostgreSQL hosting
  - Connection via `@neondatabase/serverless` HTTP driver
  - Connection string in `DATABASE_URL` environment variable
  - Used for all persistent data storage

**Key NPM Packages:**
- **@radix-ui/react-***: Headless UI primitives for accessible components
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: CLI for schema migrations
- **zod**: Runtime type validation and schema parsing
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Zod integration for form validation
- **@react-pdf/renderer**: Server-side PDF generation
- **date-fns**: Date manipulation and formatting
- **recharts**: Chart components for dashboard visualizations
- **axios**: HTTP client for mobile app
- **expo**: Mobile app framework and build tools

**Development Tools:**
- **Vite**: Frontend build tool and dev server
- **TypeScript**: Type safety across entire stack
- **TailwindCSS**: Utility-first CSS framework
- **esbuild**: Backend bundler for production builds

**Deployment:**
- Production backend designed for Node.js hosting platforms
- Frontend builds to static files in `dist/public`
- Backend bundles to `dist/index.js`
- Environment variables required: `DATABASE_URL`, `NODE_ENV`
- Mobile app deployable via Expo EAS Build for APK/IPA generation