# Copilot Instructions for Dream Day Crew Codebase

## Big Picture Architecture
- **Monorepo** with web (React/Vite), mobile (React Native/Expo), and server (Express/TypeScript) apps.
- **Shared schema** in [`shared/schema.ts`](shared/schema.ts) for database models, used by both client and server.
- **Database:** PostgreSQL (Neon serverless), managed via Drizzle ORM and migrations in [`migrations/`](migrations/).
- **Data flow:** RESTful API (`/server/routes.ts`) connects frontend/mobile to backend; all CRUD and reporting via resource endpoints.
- **Frontend:** React + TypeScript, Shadcn UI (Radix primitives), TanStack Query for server state, Wouter for routing, Tailwind for styling.
- **Mobile:** React Native, Expo, shares backend and data models with web app. API URL configured in [`mobile/src/config/environment.ts`](mobile/src/config/environment.ts).

## Developer Workflows
- **Web:**
  - Install: `npm install`
  - Run dev server: `npm run dev`
  - Build: `npm run build`
- **Mobile:**
  - Install: `cd mobile && npm install`
  - Start Expo: `npm start` (scan QR with Expo Go)
  - Build APK: `eas build --platform android --profile preview`
  - Update API URL for device testing in [`mobile/src/config/environment.ts`](mobile/src/config/environment.ts)
- **Server:**
  - Start: `npm run dev` (from root)
  - Migrations: Use Drizzle Kit, output in [`migrations/`](migrations/)
- **Database seeding:** Automatic on server startup; see [`server/seed.ts`](server/seed.ts)

## Project-Specific Conventions
- **Type safety:** All models and API payloads validated with Zod schemas.
- **Path aliases:** `@/` for client `src/`, `@shared/` for shared code.
- **Form validation:** Always use Zod + React Hook Form.
- **UI:** Shadcn UI (New York variant), Material/Carbon influences, accessibility-first.
- **State:** TanStack Query with infinite stale time, disabled auto-refetch.
- **Routing:** Wouter (web), React Navigation (mobile).
- **Invoice generation:** PDF via `@react-pdf/renderer`, see [`server/invoice-template.tsx`](server/invoice-template.tsx).
- **Budget reports:** See [`server/event-report-template.tsx`](server/event-report-template.tsx).

## Integration Points & External Dependencies
- **Backend:** Express.js, Drizzle ORM, Neon PostgreSQL, REST API.
- **Frontend:** Shadcn UI, Radix, TanStack Query, Zod, React Hook Form, Tailwind, Recharts, Lucide icons.
- **Mobile:** Expo, React Native, EAS CLI for builds.
- **Document generation:** `@react-pdf/renderer` for invoices.
- **Date handling:** `date-fns` for all date logic.

## Key Files & Directories
- [`src/components/`](client/src/components/) — UI components (web)
- [`mobile/src/screens/`](mobile/src/screens/) — Mobile screens
- [`server/routes.ts`](server/routes.ts) — API endpoints
- [`shared/schema.ts`](shared/schema.ts) — Shared DB schema
- [`migrations/`](migrations/) — SQL and ORM migrations
- [`server/seed.ts`](server/seed.ts) — DB seeding logic
- [`server/invoice-template.tsx`](server/invoice-template.tsx) — Invoice PDF
- [`server/event-report-template.tsx`](server/event-report-template.tsx) — Budget reports

## Patterns & Examples
- **CRUD:** All resources follow RESTful patterns (`/api/{resource}`)
- **Dropdowns:** Configurable via DB, see `configurations` table and Zod schemas
- **Financials:** All amounts in INR, GST auto-calculated (see invoice logic)
- **Testing:** End-to-end tests for major workflows (see README for status)
- **Mobile/Web parity:** Data and API shared; update API URL for device testing

---

_If any section is unclear or missing, please specify which workflows, conventions, or integration points need more detail._
