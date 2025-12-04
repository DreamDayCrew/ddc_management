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

### Mobile Application Architecture

The mobile application is built with React Native and Expo, sharing TypeScript types with the web application. It integrates with the Express backend via an Axios-based API client and uses TanStack Query for data fetching and caching. The app supports configuration-driven dropdowns and native date pickers. It features a dashboard with swipeable carousel, KPI cards (Total Income, Total Expense, Account Balance, Pending Repayment), and full CRUD functionality across all main screens (Events, Expenses, Assets, Team).

### UI/UX Decisions

Both web and mobile applications adopt a consistent maroon color scheme. The web app supports dark mode and features responsive sidebar navigation. The mobile app uses bottom tab navigation, professional Ionicons, and floating action buttons (FABs). Specific UI elements like StarRating components for reviews and dynamic column rendering in invoices based on data presence (e.g., DISCOUNT column) enhance user experience. Configuration screens allow for branding customization including logo, signature, and terms & conditions.

## External Dependencies

### Third-Party Services

-   **Neon Database**: Serverless PostgreSQL hosting for all persistent data storage, accessed via `@neondatabase/serverless`.

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