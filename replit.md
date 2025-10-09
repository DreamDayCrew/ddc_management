# Dream Day Crew - Event Management System

## Overview

Dream Day Crew is a comprehensive event management system designed for managing events, assets, vendors, team members, and expenses. The application provides a complete workflow from event inquiry through completion, with detailed requirement tracking and fulfillment planning. Built as a full-stack application with a React frontend and Express backend, it offers a Material Design-inspired interface optimized for productivity and data-dense operations.

The system supports multiple event types (weddings, corporate events, birthdays, product launches, etc.) and provides integrated management of all event-related resources including inventory, vendor relationships, team assignments, and financial tracking.

**Current Status (October 9, 2025):**
- ✅ Full-stack implementation complete with all 7 core modules functional
- ✅ Database automatically seeded with sample data on startup
- ✅ All CRUD operations working (Create, Read, Update, Delete)
- ✅ Complex nested event management (Events → Requirements → Fulfillment Plans)
- ✅ Real-time dashboard with charts and statistics
- ✅ Form validation using Zod schemas
- ✅ End-to-end tests passing for all major workflows

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: 
- Shadcn UI component library (New York variant) built on Radix UI primitives
- Material Design with Carbon Design influences for data-heavy sections
- Tailwind CSS for styling with custom design tokens
- Design system emphasizes clarity, efficient data density, and consistent patterns

**State Management**:
- TanStack Query (React Query) for server state management
- Query client configured with infinite stale time and disabled auto-refetching
- Local component state via React hooks

**Routing**: Wouter for lightweight client-side routing

**Form Handling**: React Hook Form with Zod schema validation via @hookform/resolvers

**Key Design Principles**:
- Enterprise productivity system approach
- Light and dark mode support via theme provider
- Responsive design with mobile breakpoint at 768px
- Accessibility-first component patterns from Radix UI

### Backend Architecture

**Framework**: Express.js with TypeScript

**API Design**: RESTful API with resource-based endpoints
- Configuration: `/api/configuration`
- Events: `/api/events` with nested requirements and fulfillment plans
- Assets: `/api/assets`
- Vendors: `/api/vendors`
- Team: `/api/team`
- Expenses: `/api/expenses`

**Data Layer**: 
- Drizzle ORM for type-safe database queries
- Storage abstraction layer (IStorage interface) for potential database swapping
- Schema definitions with Zod validation via drizzle-zod

**Request/Response Handling**:
- JSON body parsing with express.json()
- URL-encoded form data support
- Request logging middleware tracking duration and response data
- Error handling with appropriate HTTP status codes

**Database Seeding**: 
- Automatic database seeding on server startup
- Pre-populated configuration with Indian business context (GST, rupee formatting)
- Sample data for assets, vendors, team members, and events

### Data Storage Solutions

**Database**: PostgreSQL (configured for Neon serverless)

**Schema Structure**:
- **configurations**: Single-row table for business settings and dropdown options
- **assets**: Inventory tracking with categories, quantities, and purchase history
- **vendors**: Vendor directory with ratings and contact information
- **teamMembers**: Internal team with roles/designations
- **expenses**: Financial transactions (Credit/Debit/Transfer) with payment tracking
- **events**: Core event records with client info, dates, venues, and financial details
- **requirements**: Event-specific requirements linked to events
- **fulfillmentPlans**: Execution plans for requirements with resource assignments

**Key Schema Patterns**:
- UUID primary keys via `gen_random_uuid()`
- Extensive use of text arrays for configurable dropdown options
- Decimal types for financial amounts
- Date fields for scheduling and tracking
- Relational integrity through foreign keys (events → requirements → fulfillment plans)

**ORM Configuration**:
- Drizzle Kit for migrations (output to `/migrations`)
- Schema located at `./shared/schema.ts` for sharing between client and server
- Type-safe insert/update schemas generated via drizzle-zod

### External Dependencies

**Core Runtime**:
- Node.js with ES Modules
- TypeScript with bundler module resolution
- Path aliases: `@/` for client src, `@shared/` for shared code

**Database & ORM**:
- `@neondatabase/serverless`: Neon PostgreSQL serverless driver
- `drizzle-orm`: Type-safe ORM
- `drizzle-kit`: Migration management
- `connect-pg-simple`: PostgreSQL session store (configured but session implementation not visible in current codebase)

**UI Component Libraries**:
- `@radix-ui/*`: 20+ primitive component packages for accessible UI
- `shadcn/ui`: Component system built on Radix primitives
- `lucide-react`: Icon library
- `recharts`: Charting library for dashboard visualizations
- `embla-carousel-react`: Carousel/slider functionality
- `cmdk`: Command palette component
- `class-variance-authority` & `clsx`: Utility-first styling helpers

**Form & Validation**:
- `react-hook-form`: Form state management
- `zod`: Schema validation
- `@hookform/resolvers`: Zod-to-react-hook-form bridge

**Date Handling**:
- `date-fns`: Date formatting and manipulation (used extensively for event date calculations)

**Development Tools**:
- `@replit/vite-plugin-*`: Replit-specific development plugins (error overlay, cartographer, dev banner)
- `esbuild`: Server-side bundling for production
- `tsx`: TypeScript execution for development

**Build Configuration**:
- Vite with React plugin
- PostCSS with Tailwind CSS and Autoprefixer
- Separate build outputs: client to `dist/public`, server to `dist`