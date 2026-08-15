# 🎉 Dream Day Crew - Event Management System Features Overview

## 📋 Executive Summary

Dream Day Crew (DDC) Event Management System is a comprehensive, full-stack business management platform designed specifically for event planning and execution companies. Built with a focus on productivity and data-driven operations, it provides end-to-end workflow management from initial client inquiry through event completion, including resource allocation, vendor coordination, team management, financial tracking, and post-event reporting.

### Key Differentiators
- **Complete Event Lifecycle Management**: From inquiry to execution to post-event reviews
- **Nested Resource Planning**: Events → Requirements → Fulfillment Plans hierarchy
- **Real-Time Financial Tracking**: Budget vs. actual spending with variance analysis
- **Multi-Resource Coordination**: Integrated management of vendors, team members, and assets
- **Professional Invoice Generation**: One-click PDF invoices with GST calculation
- **Cross-Platform**: Full-featured web dashboard + native mobile app
- **Indian Business Context**: INR currency, GST support, local business practices

---

## 🎯 Core Philosophy

### The Event-Centric Workflow

DDC Management is built around the concept that every event has:
1. **Requirements** - What needs to be delivered (decoration, photography, catering, etc.)
2. **Fulfillment Plans** - How each requirement will be met (which vendor, team member, or asset)
3. **Financial Tracking** - Budget vs. actual spending with real-time insights
4. **Reviews** - Post-event feedback for continuous improvement

This nested structure ensures nothing falls through the cracks and provides complete visibility into event execution.

---

## ✨ Feature Categories

### 1. 🎪 Event Management System

#### Comprehensive Event Tracking

**Event Lifecycle Stages:**
- **Inquiry/Lead** - Initial customer contact and information gathering
- **Quote Preparation** - Initial quote generation based on requirements
- **Negotiation** - Quote revisions and client discussions
- **Finalized** - Confirmed booking with finalized quote
- **In Progress** - Active event execution phase
- **Completed** - Event successfully delivered
- **Cancelled** - Event cancelled with reason tracking
- **On Hold** - Temporarily paused events

**Event Information Capture:**
- **Service Type**: Wedding Planning & Décor, Corporate Events, Birthday Celebrations, Product Launches, Cultural Events, Marathons, Devotional Events
- **Event Details**:
  - Event name and date
  - Venue information
  - Client information (Name, Phone, Email, Address) - pipe-separated format for invoice generation
  - Registration date (auto-tracked)
  - Event notes and special instructions

**Financial Tracking:**
- **Initial Quote**: First quote provided to client
- **Finalized Quote**: Agreed-upon price with client
- **Event Discount**: Optional discount with amount
- **DDC Cost**: Actual cost incurred by company
- **Profit/Loss**: Automatic calculation (Finalized Quote - DDC Cost)
- **Payment Status**: Pending, Partial, Paid
- **Payment Mode**: Cash, Bank Transfer, UPI

**Nested Event Structure:**
```
Event
├── Requirement 1 (e.g., "Stage Decoration")
│   ├── Fulfillment Plan 1 (Vendor: XYZ Decorators)
│   ├── Fulfillment Plan 2 (Team: Designer assigned)
│   └── Fulfillment Plan 3 (Asset: LED Lights)
├── Requirement 2 (e.g., "Photography")
│   └── Fulfillment Plan (Vendor: ABC Studios)
└── Requirement 3 (e.g., "Sound System")
    └── Fulfillment Plan (Asset: Speaker Set)
```

**Event Dashboard Views:**
- **All Events List**: Searchable, filterable list with status badges
- **Event Details Page**: 
  - Complete event information
  - Requirements breakdown with status tracking
  - Fulfillment plans organized by requirement
  - Financial summary
  - Generate Invoice button
  - Inline status updates (no need to open edit forms)
- **Calendar View**: Visual timeline of upcoming events (planned)
- **Event Not Found**: User-friendly error page with "Back to Dashboard" button

---

### 2. 📋 Requirements Management

#### Granular Event Requirement Tracking

**Requirement Definition:**
- **Requirement Name**: What needs to be delivered (e.g., "Stage Decoration", "Photography", "Catering")
- **Description**: Detailed specifications and client expectations
- **Quantity**: Number of items/units required
- **Invoice Value**: Price quoted to client for this requirement
- **Requirement Discount**: Optional discount on individual requirement
- **Owner**: Team member responsible (dropdown selection from team)
- **Images**: Multiple image attachments for reference

**Requirement Status:**
- To Do
- In Progress
- Completed
- Blocker (with notes on what's blocking)

**Requirement Financial Tracking:**
- **Invoice Value**: What client pays for this requirement
- **Actual Cost**: Sum of all fulfillment plan expenses
- **Variance**: Invoice Value - Actual Cost (shown in budget reports)
- **Visual Indicators**: Green (under budget), Red (over budget)

**Requirements Features:**
- Nested under parent event
- Drag-and-drop ordering (order field)
- Bulk status updates
- Link to multiple fulfillment plans
- Image gallery for client references
- Real-time progress tracking

---

### 3. 🛠️ Fulfillment Plans (Execution Plans)

#### Resource Allocation & Execution Tracking

**Three Plan Types:**

**1. Vendor Plans**
- **Vendor Selection**: Choose from vendor directory
- **Vendor Category**: Pre-configured categories (Decoration, Photography, Catering, Audio/Visual, Venue, Transportation, Lighting)
- **Payment Amount**: How much vendor will be paid
- **Payment Status**: Pending, Paid, Partial
- **Plan Status**: To Do, In Progress, Completed, Blocker

**2. Team Plans**
- **Team Member Assignment**: Choose from team directory
- **Role**: Designer, Coordinator, Manager, Technical Support, Decorator, Logistics, Purchasing Items
- **Payment Amount**: Team member payment/incentive for this task
- **Payment Status**: Pending, Paid, Partial
- **Plan Status**: Progress tracking

**3. Asset Plans**
- **Asset Selection**: Choose from inventory
- **Asset Category**: Audio System, Decoration, Furniture, Photography, Lighting, Stage Equipment, Electrical/Wires, Office use/Safety
- **Asset Type**: Name or model of asset
- **Purchase Status**: Existing (from inventory) or New (need to purchase)
- **Purchased Value**: Cost of new asset (conditional field, shows only when "New" selected)
- **Payment Status**: Tracking if payment needed for new purchase

**Post-Event Reviews (Collected After Event Completion):**
- **Customer Rating**: 1-5 stars rating from client
- **Team Rating**: 1-5 stars internal performance rating
- **Review Notes**: Detailed feedback for future improvements

**Fulfillment Plans Features:**
- **Dedicated Plans Page**: View all fulfillment plans across all events with search and filtering
- **Inline Status Updates**: Change status without opening edit form
- **Link to Expenses**: Auto-create expenses when plans marked as paid
- **Multi-Resource Support**: Mix vendors, team, and assets for same requirement
- **Validation**: Ensures vendor ID for vendor plans, team ID for team plans, asset ID for asset plans
- **Edit Functionality**: Full CRUD operations on all plan types

---

### 4. 💰 Expense Management System

#### Comprehensive Financial Transaction Tracking

**Expense Types:**
- **Credit**: Money coming in (client payments, investments, income)
- **Debit**: Money going out (vendor payments, purchases, bills)
- **Transfer**: Moving money between accounts (planned feature)

**Expense Categories:**
- **Event**: Expenses directly related to specific events
- **Asset**: Asset purchases and maintenance
- **Office**: General business expenses

**Expense Details:**
- **Amount**: Transaction amount in INR
- **Date**: Transaction date
- **From Account**: Source account (default: DDC Fund)
- **To Account**: Destination account (for transfers)
- **Description**: Transaction details
- **Status**: Pending, Paid, Partial
- **Event Link**: Optional link to specific event
- **Fulfillment Plan Link**: Optional link to specific fulfillment plan
- **Asset Link**: Optional link to specific asset
- **Rental Link**: Optional link to rental order

**Split Expenses Feature:**
- **Split Type**: Individual, Equal, Custom
- **Contributors**: Multiple team members/partners can contribute
- **Contribution Amount**: How much each person contributes
- **Contribution Status**: Pending/Paid per contributor
- **Use Case**: When multiple team members share expenses

**Expense Views:**
- **All Expenses List**: Complete transaction history with search and filters
- **Expenses with Closing Balance**: Running balance after each transaction
- **Event-Specific Expenses**: Filter by event
- **Category-Wise Summaries**: Spending by category
- **Date Range Filtering**: Custom date ranges for reports

**Account Balance Tracking:**
- **DDC Fund Account**: Main business account
- **Real-Time Balance**: Updated with every transaction
- **Balance History**: Track balance over time
- **Repayment Tracking**: For split expenses and loans

---

### 5. 📊 Dashboard & Analytics

#### Real-Time Business Intelligence

**Key Metrics Cards:**
- **Total Events**: Count of all events in system
- **Active Events**: Currently in-progress events
- **Completed Events**: Successfully delivered events
- **Total Revenue**: Sum of all finalized quotes
- **Total Expenses**: Sum of all debit transactions
- **Profit**: Revenue - Expenses
- **Pending Payments**: Outstanding client payments
- **Team Members**: Active team count
- **Assets**: Total inventory count
- **Vendors**: Registered vendor count

**Visual Analytics:**
- **Event Status Distribution**: Pie/donut chart showing events by status
- **Revenue Trends**: Line/bar chart showing monthly revenue
- **Expense Breakdown**: Category-wise expense distribution
- **Monthly Comparisons**: Current vs previous period
- **Payment Status Overview**: Visual representation of paid vs pending

**Recent Activity Feeds:**
- **Recent Events**: Last 5-10 events created/updated
- **Recent Expenses**: Latest transactions
- **Upcoming Events**: Events scheduled in next 30 days
- **Overdue Payments**: Events with pending payments past due date

**Quick Actions:**
- Create New Event
- Add Expense
- Add Asset
- Add Team Member
- Quick status updates

---

### 6. 🎁 Asset Management & Inventory

#### Complete Asset Lifecycle Tracking

**Asset Information:**
- **Asset Name**: Descriptive name
- **Category**: Audio System, Decoration, Furniture, Photography, Lighting, Stage Equipment, Electrical/Wires, Office use/Safety
- **Quantity**: Stock count
- **Purchase Date**: When acquired
- **Purchased Amount**: Original cost
- **Status**: Active, Maintenance, Retired, Lost/Damaged
- **Details and Use**: Description, specifications, usage notes
- **Warranty**: Warranty information and expiry

**Asset Operations:**
- **Add New Assets**: Manual entry with all details
- **Update Inventory**: Modify quantities and status
- **Asset Allocation**: Assign to events via fulfillment plans
- **Asset History**: Track which events used which assets
- **Depreciation Tracking**: (Planned) Track asset value over time
- **Maintenance Schedule**: (Planned) Track service and repairs

**Asset Rental System:**
**Rental Rate Configuration:**
- **Duration-Based Pricing**: Set different rates for different rental periods
- **Time Units**: Hours (hrs) or Days (day)
- **Rate Tiers**: 4 hours, 6 hours, 12 hours, 1 day, 2 days, etc.
- **Asset-Specific Rates**: Each asset can have its own rate card
- **Example**: LED Light Set - ₹500 for 4hrs, ₹700 for 6hrs, ₹1000 for 12hrs, ₹1500 per day

**Rental Orders Management:**
- **Customer Information**: Name, Phone, Email, Address
- **Rental Period**: Rental date and return date
- **Rental Items**: Multiple assets per order
  - Asset selection from inventory
  - Quantity needed
  - Duration and time unit
  - Rate per unit (auto-filled from rate card)
  - Total amount per line item
- **Order Status**: Quote, Invoice, Paid, Returned
- **Payment Tracking**: Payment status and mode
- **Discount Support**: Optional discount on total
- **Total Calculation**: Sum of all items - discount

**Rental Features:**
- **Dedicated Rentals Page**: List all rental orders
- **Rental Details Page**: Complete order breakdown
- **Generate Rental Report**: PDF download with customer copy
- **Link to Expenses**: Auto-create expenses for rental income
- **Inventory Check**: Warns if asset quantity insufficient
- **Mobile Download**: Download rental reports on mobile app

**Asset Financial Tracking:**
- **Purchase Costs**: Total investment in assets
- **Depreciation**: (Planned) Track asset value depreciation
- **Maintenance Costs**: Link asset-related expenses
- **Rental Income**: Track revenue from asset rentals
- **Asset ROI**: (Planned) Return on investment per asset

---

### 7. 🤝 Vendor Management

#### Vendor Directory & Relationship Management

**Vendor Profile:**
- **Vendor Name**: Business name
- **Category**: Decoration, Photography, Catering, Audio/Visual, Venue, Transportation, Lighting
- **Specialization**: Specific expertise or niche
- **Location**: Service area / address
- **Contact Information**: Phone, email, website
- **Rating**: 1-5 stars based on performance

**Vendor Operations:**
- **Vendor Directory**: Searchable list of all vendors
- **Category Filtering**: Find vendors by service type
- **Rating System**: Track vendor performance
- **Usage History**: Which events used which vendors
- **Payment History**: All payments made to vendor
- **Performance Reviews**: Post-event feedback on vendors

**Vendor Integration:**
- **Fulfillment Plan Assignment**: Assign vendors to specific requirements
- **Payment Tracking**: Link expenses to vendor payments
- **Multi-Vendor Events**: Different vendors for different requirements
- **Preferred Vendors**: Mark frequently used vendors
- **Vendor Comparison**: Compare vendor quotes and performance

**Vendor Analytics:**
- **Most Used Vendors**: Ranked by frequency
- **Vendor Spending**: Total paid to each vendor
- **Vendor Performance**: Average ratings
- **Category Coverage**: Gaps in vendor network

---

### 8. 👥 Team Management

#### Team Member Directory & Assignment

**Team Member Profile:**
- **Name**: Full name
- **Designation**: Freeform text (Designer, Coordinator, Manager, etc.)
- **Email**: Contact email
- **Phone**: Contact number
- **Password**: Secure login credentials (bcrypt hashed)
- **Mobile App Access**: Flag indicating if they use mobile app

**Team Operations:**
- **Team Directory**: List of all team members with cards
- **Role Management**: Assign roles and responsibilities
- **Assignment Tracking**: Which team members on which events
- **Workload Balancing**: See who's assigned to how many active events
- **Performance Tracking**: Post-event team ratings

**Team Integration:**
- **Fulfillment Plan Assignment**: Assign team members to tasks
- **Requirement Ownership**: Each requirement has a responsible owner
- **Payment Tracking**: Track team payments/incentives per event
- **Split Expenses**: Share costs among team members
- **Mobile App Login**: Team members can access system via mobile

**Team Analytics:**
- **Team Performance**: Average ratings per team member
- **Workload Distribution**: Events per team member
- **Payment Summary**: Total paid to each team member
- **Role Distribution**: Count by designation

---

### 9. 🏢 Business Configuration

#### Centralized Settings & Customization

**Business Information:**
- **Business Name**: Company name for invoices
- **Logo**: Upload company logo (base64 storage, shown on invoices)
- **Contact Details**:
  - Address: Physical business address
  - Phone: Business phone number
  - Email: Business email
  - Website: Company website URL
  - Social Links: Array of social media URLs

**Tax & Legal:**
- **GST Number**: Indian Goods and Services Tax number
- **PAN Number**: Permanent Account Number
- **Include GST**: Toggle GST calculation on invoices (18% rate)
- **Terms & Conditions**: Invoice footer text with business policies

**Payment Information:**
- **UPI ID**: For digital payments
- **UPI QR Code**: Upload QR code image for invoices
- **Bank Details**:
  - Account Holder Name
  - Bank Name
  - Account Number
  - IFSC Code

**Signature:**
- **Signature Image**: Upload authorized signatory signature for invoices

**Dropdown Options (Configurable Arrays):**
- **Asset Categories**: Customize asset types
- **Asset Purchase Status**: Existing, New, etc.
- **Services Provided**: Event types offered
- **Investment Types**: Business investment categories
- **Plan Statuses**: Task status options
- **Roles**: Team designations
- **Payment Modes**: Payment methods accepted
- **Payment Statuses**: Payment tracking statuses
- **Vendor Categories**: Vendor service types
- **Expense Categories**: Expense classification
- **Packages**: Service tiers (Ultra, Premium, Budget)

**Configuration Features:**
- **Single Configuration**: One configuration record for entire business
- **Logo Preview**: See uploaded logo before saving
- **Array Management**: Add/remove dropdown options dynamically
- **Validation**: Ensure required fields filled before saving
- **Auto-Seeding**: Sample data provided on first setup

---

### 10. 📄 Invoice Generation

#### Professional PDF Invoice Creation

**Invoice Components:**

**1. Company Branding:**
- Business logo (top right)
- Business name and information
- Contact details
- GST and PAN numbers

**2. Invoice Header:**
- Invoice title
- Invoice date (auto-generated)
- Invoice filename format: `Invoice_{EventName}_{Date}.pdf`

**3. Client Information:**
- Parsed from event client fields (pipe-separated format)
- Client Name
- Contact Number
- Address
- Email

**4. Itemized Breakdown:**
- **Requirement-Level Listing**:
  - Requirement name
  - Quantity
  - Invoice value (price per requirement)
  - Total per requirement

**5. Financial Summary:**
- **Subtotal**: Sum of all requirements
- **Discount**: If event has discount
- **Subtotal After Discount**
- **GST (18%)**: Calculated automatically if enabled
- **Grand Total**: Final payable amount

**6. Payment Information:**
- Payment modes accepted
- UPI ID and QR code
- Bank account details
- IFSC code

**7. Terms & Conditions:**
- Custom terms from business configuration
- Footer text with policies

**Invoice Features:**
- **One-Click Generation**: Generate Invoice button on event details page
- **Modern Design**: Clean, professional layout
- **INR Formatting**: ₹ symbol with comma separators (₹1,23,456.00)
- **Auto-Calculations**: All math done automatically
- **PDF Download**: Browser downloads PDF file
- **Mobile Compatible**: Generate from web or mobile app
- **GST Compliant**: Follows Indian invoice standards

---

### 11. 📈 Budget Reports & Analysis

#### Post-Event Financial Performance

**Dedicated Reports Page:**
- Lists all **completed events**
- Searchable and filterable
- Shows basic event info and financial summary
- Click to view detailed budget report

**Budget Report Components:**

**1. Event Summary:**
- Event name, date, venue
- Client information
- Event status

**2. Financial Overview:**
- **Finalized Quote**: What client was charged
- **Actual Spending**: Sum of all fulfillment plan expenses
- **Variance**: Finalized Quote - Actual Spending
- **Variance Percentage**: (Variance / Finalized Quote) × 100
- **Budget Status**: 
  - ✅ Under Budget (positive variance, green)
  - ⚠️ On Budget (zero variance, yellow)
  - ❌ Over Budget (negative variance, red)

**3. Requirement-Level Breakdown:**

Table showing each requirement:
| Requirement | Invoice Value | Actual Cost | Variance | Status |
|-------------|--------------|-------------|----------|--------|
| Stage Decoration | ₹50,000 | ₹45,000 | +₹5,000 | ✅ Under |
| Photography | ₹30,000 | ₹35,000 | -₹5,000 | ❌ Over |
| Catering | ₹1,00,000 | ₹95,000 | +₹5,000 | ✅ Under |

**4. Actual Cost Calculation:**
Automatically sums expenses from all fulfillment plans:
- **Team Plans**: Payment field
- **Vendor Plans**: Payment field
- **Asset Plans**: Purchased value (if new asset), or ₹0 (if existing)

**5. Visual Indicators:**
- Green checkmarks for under-budget items
- Red warnings for over-budget items
- Color-coded variance amounts
- Progress bars showing budget utilization

**Budget Report Features:**
- **Automatic Calculations**: No manual data entry
- **Real-Time Data**: Always up-to-date with latest expenses
- **Drill-Down**: Click requirements to see fulfillment plan details
- **Export Ready**: (Planned) Download as PDF or Excel
- **Trend Analysis**: (Planned) Compare across multiple events

---

### 12. 📦 Catalog Management

#### Service Packages & Pricing

**Catalog Structure:**
- **Service Type**: Which event service (Wedding Planning, Corporate Events, etc.)
- **Package**: Which tier (Ultra, Premium, Budget)
- **Item Name**: Specific deliverable (e.g., "Full Stage Setup", "Photography - 8 Hours")
- **Description**: Detailed item description
- **Price**: Cost per item (INR)

**Catalog Operations:**
- **Add Catalog Items**: Define what's included in each package
- **Package Comparison**: Compare offerings across tiers
- **Quick Quote Generation**: Select from catalog when creating events
- **Price Updates**: Bulk update prices for package tiers
- **Custom Items**: Add one-off items not in standard packages

**Catalog Use Cases:**
- **Standardized Offerings**: Present consistent packages to clients
- **Quick Quoting**: Drag-and-drop items into event requirements
- **Upselling**: Show premium options vs budget
- **Price Consistency**: Avoid pricing variations across sales team

---

### 13. 📱 Mobile Application (React Native)

#### Native Android App for Field Operations

**Mobile App Features:**

**1. Dashboard Screen:**
- Real-time event statistics
- Event status overview (Draft, In Progress, Completed counts)
- Recent events list
- Quick access to all modules

**2. Events Screen:**
- List all events with search and filters
- View complete event details
- Event status, dates, venue
- Client information
- Finalized quote display
- Navigate to event details

**3. Expenses Screen:**
- Complete expense list
- Credit/Debit categorization
- Date and amount display
- Expense summaries
- Filter by date range, category, type

**4. Team Screen:**
- Team member directory
- Cards with names and designations
- Contact information
- Call/Email directly from app

**5. Assets Screen:**
- Asset inventory list
- Categories and quantities
- Asset valuations
- Status indicators
- Search and filter

**6. Rentals Screen:**
- List all rental orders
- Customer information
- Rental dates and status
- **Download Rental Reports**: Generate and download PDF reports on mobile
- View rental details

**7. Rental Details Screen:**
- Complete rental information
- Customer details
- Line items with assets and rates
- Total amount and payment status
- Generate and download report
- Share report via WhatsApp/Email

**Technical Implementation:**
- **Framework**: React Native with Expo
- **Navigation**: Bottom tab navigation for quick module access
- **API Integration**: Full typed API client connecting to Express backend
- **State Management**: TanStack Query for caching and sync
- **Type Safety**: Shared TypeScript types with web app
- **Error Handling**: Proper error states and loading indicators
- **Offline Support**: (Planned) Queue operations for offline use

**Distribution:**
- **APK Build**: Standalone APK via Expo EAS Build
- **No App Store**: Direct distribution via WhatsApp/Email
- **Easy Updates**: Build and share new APK when needed
- **Team Size**: Perfect for small teams (4 members)

**Mobile App Configuration:**
- **Environment Setup**: Dev vs Production API URLs
- **Auto-Detection**: Uses production URL for non-dev builds
- **Current Production**: `https://ddc-management.onrender.com`
- **CORS Support**: Backend configured for mobile requests

---

### 14. 🔐 Security & Authentication

#### Multi-Layer Security System

**Authentication Methods:**
- **Email/Password Login**: Standard credentials-based login
- **Team Member Accounts**: Each team member has unique credentials
- **Password Security**: Bcrypt hashing (not plaintext)
- **Session Management**: Express session with PostgreSQL store

**Authorization:**
- **Role-Based Access**: (Planned) Different permissions per role
- **Data Isolation**: Each business has separate data
- **API Security**: Protected API endpoints
- **CORS Configuration**: Whitelist trusted origins

**Mobile App Security:**
- **Secure API Communication**: HTTPS for production
- **Credential Storage**: Secure credential storage on device
- **Session Tokens**: JWT or session cookies for authentication
- **Logout Functionality**: Clear session on logout

**Data Security:**
- **Database Encryption**: SSL connections to PostgreSQL
- **Neon Serverless**: Enterprise-grade database hosting
- **Environment Variables**: Sensitive data in .env files
- **No Hardcoded Secrets**: Configuration-driven security

**SSO Integration Options:**
- **JWT Token-Based**: Share tokens between website and management app
- **Iframe Embedding**: Embed management app in website
- **Subdomain Integration**: Shared cookies across subdomains
- **API-First Design**: Ready for custom authentication flows

---

### 15. 🎨 User Interface & Design

#### Enterprise Productivity System Design

**Design Philosophy:**
- **Clarity Over Decoration**: Every element serves a purpose
- **Efficient Data Density**: Maximize information without overwhelming
- **Consistent Patterns**: Reusable components across all modules
- **Quick Navigation**: Seamless movement between modules

**Component Library:**
- **Framework**: Shadcn UI (New York variant) built on Radix UI
- **Styling**: Tailwind CSS with custom design tokens
- **Icons**: Lucide React icons
- **Charts**: (Planned) Recharts for analytics visualization

**Theme Support:**
- **Light Mode**: Clean, professional look for daytime use
- **Dark Mode**: Eye-friendly for night-time operations
- **Theme Toggle**: User preference saved per session
- **System Auto**: Match device theme settings

**Responsive Design:**
- **Mobile-First**: Optimized for mobile devices (768px breakpoint)
- **Tablet Support**: Enhanced layouts for tablets
- **Desktop Optimized**: Full-width layouts for large screens
- **Touch-Friendly**: Large touch targets for mobile use

**UI Components:**
- **Data Tables**: Sortable, filterable, paginated tables
- **Form Inputs**: Validated inputs with error states
- **Dropdown Selects**: Searchable multi-selects for large lists
- **Status Badges**: Color-coded pills for status indicators
- **Action Buttons**: Primary, secondary, destructive variants
- **Modal Dialogs**: Create, edit, delete confirmations
- **Toast Notifications**: Success, error, info messages

**Accessibility:**
- **Radix UI Primitives**: Built-in accessibility patterns
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG AA compliant

**Performance:**
- **Lazy Loading**: Load data as needed
- **Optimistic UI**: Instant feedback, server validation in background
- **Infinite Stale Time**: TanStack Query configured for data persistence
- **Minimal Re-renders**: React Query caching reduces unnecessary updates

---

## 🔧 Technical Architecture

### Technology Stack

**Frontend (Web):**
- **React 18.3** - Component-based UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Wouter** - Lightweight client-side routing
- **TanStack Query** - Server state management and caching
- **Shadcn UI** - Accessible component library
- **Tailwind CSS** - Utility-first styling
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **date-fns** - Date manipulation
- **@react-pdf/renderer** - PDF generation

**Frontend (Mobile):**
- **React Native** - Cross-platform mobile framework
- **Expo** - Development tooling and build pipeline
- **Expo Router** / **React Navigation** - Mobile navigation
- **TanStack Query** - Data fetching and caching
- **TypeScript** - Shared types with web app

**Backend:**
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type-safe server code
- **Drizzle ORM** - Type-safe database queries
- **Bcrypt** - Password hashing
- **Express Session** - Session management
- **CORS** - Cross-origin request handling
- **Multer** - File upload handling
- **@emailjs/nodejs** - Email notifications (optional)

**Database:**
- **PostgreSQL** - Primary relational database
- **Neon Serverless** - Managed PostgreSQL hosting
- **Drizzle Kit** - Schema migrations
- **connect-pg-simple** - PostgreSQL session store

**Deployment:**
- **AWS Elastic Beanstalk** - Production deployment option
- **Render** - Current production hosting
- **Environment Variables** - Configuration management

### Data Architecture

**Core Database Tables:**

1. **configurations** - Business settings (single row)
2. **catalogItems** - Service packages and pricing
3. **assets** - Inventory management
4. **assetRentalRates** - Rental pricing tiers
5. **vendors** - Vendor directory
6. **teamMembers** - Team member profiles
7. **expenses** - Financial transactions
8. **expensesWithBalance** - Expense view with running balance
9. **accountBalance** - Business account balance
10. **repayments** - Split expense repayment tracking
11. **events** - Event master records
12. **requirements** - Event requirements (nested under events)
13. **fulfillmentPlans** - Execution plans (nested under requirements)
14. **rentals** - Rental orders
15. **rentalItems** - Rental line items

**Key Relationships:**
- Events → Requirements (One-to-Many, cascade delete)
- Requirements → Fulfillment Plans (One-to-Many, cascade delete)
- Fulfillment Plans → Vendors/Team/Assets (Many-to-One, set null on delete)
- Expenses → Events/Fulfillment Plans/Assets/Rentals (Optional links)
- Rentals → Rental Items (One-to-Many, cascade delete)
- Rental Items → Assets (Many-to-One)

**Database Features:**
- **UUID Primary Keys**: Using `gen_random_uuid()`
- **Timestamps**: Created and updated timestamps on most tables
- **Cascading Deletes**: Maintain referential integrity
- **Check Constraints**: Ensure plan type consistency
- **Array Columns**: Store multi-value fields (contributor arrays, social links)
- **Decimal Precision**: Financial amounts with 2 decimal places

### API Design

**RESTful Endpoints:**

**Configuration:**
- `GET /api/configuration` - Get business configuration
- `POST /api/configuration` - Create/update configuration

**Catalog:**
- `GET /api/catalog` - Get all catalog items
- `POST /api/catalog` - Create catalog item
- `PUT /api/catalog/:id` - Update catalog item
- `DELETE /api/catalog/:id` - Delete catalog item

**Events:**
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/:id/invoice` - Generate invoice PDF

**Requirements:**
- `GET /api/events/:eventId/requirements` - Get event requirements
- `POST /api/requirements` - Create requirement
- `PUT /api/requirements/:id` - Update requirement
- `DELETE /api/requirements/:id` - Delete requirement

**Fulfillment Plans:**
- `GET /api/plans` - Get all fulfillment plans
- `GET /api/requirements/:requirementId/plans` - Get requirement plans
- `POST /api/plans` - Create fulfillment plan
- `PUT /api/plans/:id` - Update fulfillment plan
- `DELETE /api/plans/:id` - Delete fulfillment plan
- `PUT /api/plans/:id/review` - Update plan review

**Assets:**
- `GET /api/assets` - Get all assets
- `POST /api/assets` - Create asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset

**Asset Rental Rates:**
- `GET /api/rental-rates/:assetId` - Get asset rental rates
- `POST /api/rental-rates` - Create rental rate
- `PUT /api/rental-rates/:id` - Update rental rate
- `DELETE /api/rental-rates/:id` - Delete rental rate

**Rentals:**
- `GET /api/rentals` - Get all rentals
- `GET /api/rentals/:id` - Get rental details
- `POST /api/rentals` - Create rental order
- `PUT /api/rentals/:id` - Update rental
- `DELETE /api/rentals/:id` - Delete rental
- `GET /api/rentals/:id/report` - Generate rental report PDF
- `GET /api/rentals/download` - Download rental report (mobile endpoint)

**Vendors:**
- `GET /api/vendors` - Get all vendors
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor

**Team:**
- `GET /api/team` - Get all team members
- `POST /api/team` - Create team member
- `PUT /api/team/:id` - Update team member
- `DELETE /api/team/:id` - Delete team member

**Expenses:**
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/with-balance` - Get expenses with closing balance
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

**Reports:**
- `GET /api/reports/budget` - Get budget report for completed events

**Account Balance:**
- `GET /api/account-balance` - Get current balance

**Repayments:**
- `GET /api/repayments` - Get all repayments
- `POST /api/repayments` - Create repayment
- `PUT /api/repayments/:id` - Update repayment

**Response Format:**
```json
{
  "data": { ... },
  "message": "Success"
}
```

**Error Handling:**
```json
{
  "error": "Validation failed",
  "details": { ... }
}
```

---

## 🚀 Unique Selling Points

### What Makes DDC Management Different?

1. **Nested Event Planning**
   - Industry-first three-level hierarchy (Events → Requirements → Fulfillment Plans)
   - Complete visibility from client request to execution
   - Nothing falls through the cracks

2. **Integrated Resource Management**
   - Single system for vendors, team, assets, and finances
   - No need for multiple spreadsheets or tools
   - Real-time availability and allocation tracking

3. **Automated Budget Analysis**
   - Automatic variance calculation (quote vs actual)
   - Requirement-level profitability analysis
   - Learn which services are most profitable

4. **Professional Invoicing**
   - One-click GST-compliant PDF invoices
   - Includes company branding and payment details
   - Indian business standards built-in

5. **Asset Rental Business**
   - Not just event management - also run rental business
   - Duration-based pricing tiers
   - Inventory management integrated

6. **Mobile-First for Field Teams**
   - Native mobile app for on-site operations
   - Download reports and share with clients
   - Real-time updates from event venues

7. **Post-Event Reviews**
   - Capture customer and team ratings
   - Build vendor performance history
   - Continuous improvement tracking

8. **Split Expense Management**
   - Handle partner/co-founder cost sharing
   - Track individual contributions
   - Repayment management built-in

---

## 📊 Use Cases & Scenarios

### Event Planning Companies

**Small Event Planning Business (1-5 Team Members):**
- Manage 10-20 events per month
- Track 3-5 vendors per event type
- Maintain small asset inventory (lights, decorations)
- Generate professional invoices for clients
- Use mobile app for on-site coordination

**Growing Event Management Firm (5-15 Team Members):**
- Handle 50+ events per month
- Large vendor network (20+ vendors)
- Significant asset inventory
- Multiple team member roles
- Budget analysis for profitability
- Run parallel rental business

**Enterprise Event Management (15+ Team Members):**
- 100+ events per month
- Extensive vendor relationships
- Large asset inventory across categories
- Complex team structures with specializations
- Detailed financial reporting
- Data-driven decision making

### Specialized Event Types

**Wedding Planners:**
- Multiple requirements per event (decoration, catering, photography, etc.)
- Vendor coordination across 5-10 vendors per wedding
- Asset rentals (sound systems, lighting)
- High-value events requiring detailed tracking
- Post-event feedback collection

**Corporate Event Coordinators:**
- Standardized packages (catalog management)
- Recurring corporate clients
- Quick quote generation
- Professional invoicing with GST
- Brand management (logo on invoices)

**Cultural & Community Events:**
- Grant-funded or sponsored events
- Detailed budget tracking required
- Volunteer team management
- Asset sharing across multiple events
- Post-event reporting for funders

### Rental Business

**Equipment Rental Company:**
- Asset-centric operations
- Duration-based pricing
- Inventory availability tracking
- Rental order management
- Invoice generation for rentals

---

## 🎯 Future Roadmap

### Planned Features

**Short-Term (Next 3 Months):**
- [ ] Calendar view for event scheduling
- [ ] Vendor comparison tool (compare quotes side-by-side)
- [ ] Asset depreciation tracking
- [ ] Email notifications for upcoming events
- [ ] Bulk operations (bulk status updates, bulk delete)
- [ ] Export reports to Excel/CSV

**Medium-Term (3-6 Months):**
- [ ] Advanced analytics and charts (revenue trends, expense breakdown)
- [ ] Client portal (clients can view their event details)
- [ ] Online quote acceptance (clients approve quotes online)
- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] WhatsApp integration (send invoices via WhatsApp)
- [ ] Task management (to-do lists for team members)
- [ ] Event timeline builder (Gantt chart view)

**Long-Term (6-12 Months):**
- [ ] Multi-location support (different branches)
- [ ] Role-based permissions (admin, manager, team member roles)
- [ ] Custom branding per event (different templates)
- [ ] AI-powered quote generation (suggest requirements based on event type)
- [ ] Vendor rating algorithm (auto-rate based on performance)
- [ ] Mobile offline mode (work without internet, sync later)
- [ ] Integration with accounting software (QuickBooks, Tally)
- [ ] Client feedback portal (post-event surveys)
- [ ] Marketing automation (email campaigns to past clients)

---

## 📖 Documentation

For detailed setup and usage instructions, refer to:

- **[README.md](./README.md)** - Quick start guide and system overview
- **[design_guidelines.md](./design_guidelines.md)** - UI/UX design system
- **[API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)** - API documentation for external integrations
- **[SSO_INTEGRATION.md](./SSO_INTEGRATION.md)** - Single sign-on integration options
- **[mobile/MOBILE_APP_SUMMARY.md](./mobile/MOBILE_APP_SUMMARY.md)** - Mobile app technical documentation
- **[mobile/README.md](./mobile/README.md)** - Mobile app setup instructions
- **[mobile/APK_BUILD_GUIDE.md](./mobile/APK_BUILD_GUIDE.md)** - APK build and distribution guide

---

## 🤝 Contributing

DDC Management is open for contributions! Areas where help is needed:

- **Feature Enhancements**: Calendar views, advanced analytics, payment integrations
- **Bug Fixes**: Report and fix any issues found
- **UI/UX Improvements**: Better mobile responsiveness, accessibility
- **Documentation**: More examples, video tutorials
- **Testing**: Unit tests, integration tests, E2E tests
- **Localization**: Multi-language support (currently English only)

---

## 📄 License

This project is licensed under the MIT License.

---

## 💬 Support

For questions, issues, or feature requests:
- **GitHub Issues**: Report bugs or request features
- **Email**: Contact the development team
- **Documentation**: Check existing docs for common questions

---

**Last Updated**: August 15, 2026  
**Version**: 1.0.0  
**Status**: Production Ready 🚀  
**Current Deployment**: https://ddc-management.onrender.com
