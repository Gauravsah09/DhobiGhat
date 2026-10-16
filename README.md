# DhobiGhat - Modern Laundry & Dry Cleaning Management System

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**DhobiGhat** is an enterprise-grade, full-stack Laundry & Dry Cleaning Point-of-Sale (POS), Logistics Dispatch, and Enterprise Resource Planning (ERP) web application.

Designed for modern laundry chains, dry cleaners, and laundromats, DhobiGhat handles the entire garment journey: online doorstep pickup bookings, driver dispatch, floor garment processing (washing, drying, ironing, QC), POS counter intake, thermal receipt printing, and doorstep delivery with security PIN verification.

The application is **100% self-contained and independent**. It requires zero external databases to get started (works offline out-of-the-box via browser storage) and seamlessly connects to a cloud PostgreSQL database (via Supabase) when configured.

---

## 📑 Table of Contents

1. [Technology Stack](#-technology-stack)
2. [System Architecture & Implementation](#-system-architecture--implementation)
   - [Dual-Mode Persistence (Local-First + Cloud PostgreSQL)](#dual-mode-persistence)
   - [Real-Time Cross-Tab Synchronization](#real-time-cross-tab-synchronization)
   - [14-Stage Logistics Pipeline](#14-stage-logistics-pipeline)
   - [Project Directory Structure](#project-directory-structure)
3. [User Roles & Demo Credentials](#-user-roles--demo-credentials)
4. [Step-by-Step Installation](#-step-by-step-installation)
   - [Prerequisites](#prerequisites)
   - [1. Quick Start (Local Development)](#1-quick-start-local-development)
   - [2. Production Build](#2-production-build)
   - [3. Running with Docker Compose](#3-running-with-docker-compose)
   - [4. Optional: Cloud Database Setup (Supabase)](#4-optional-cloud-database-setup-supabase)
5. [How to Operate the Application](#-how-to-operate-the-application)
   - [Flow 1: Customer Booking an Online Pickup](#flow-1-customer-booking-an-online-pickup)
   - [Flow 2: Store Operator Assigning a Pickup Rider](#flow-2-store-operator-assigning-a-pickup-rider)
   - [Flow 3: Rider Collection & Store Intake Weigh-In](#flow-3-rider-collection--store-intake-weigh-in)
   - [Flow 4: Processing Garments on the Shop Floor](#flow-4-processing-garments-on-the-shop-floor)
   - [Flow 5: Doorstep Delivery & Customer PIN Verification](#flow-5-doorstep-delivery--customer-pin-verification)
   - [Flow 6: Walk-in POS Intake & Thermal Receipts](#flow-6-walk-in-pos-intake--thermal-receipts)
   - [Flow 7: Shift Close & Cash Register Reconciliation](#flow-7-shift-close--cash-register-reconciliation)
   - [Flow 8: Admin Desk & Order Settlements](#flow-8-admin-desk--order-settlements)
   - [Flow 9: Revenue Ledger & Financial Reports](#flow-9-revenue-ledger--financial-reports)
   - [Flow 10: Order Archiving & Data Export](#flow-10-order-archiving--data-export)
6. [Cloud Deployment](#-cloud-deployment)
7. [Testing & Quality Assurance](#-testing--quality-assurance)
8. [License](#-license)

---

## 💻 Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | Server & Client Components, Turbopack bundling, file-based routing. |
| **UI Library** | **React 19** | Concurrent rendering, modern hooks, and component lifecycle management. |
| **Language** | **TypeScript 5 (Strict Mode)** | Complete static type safety across data models, order pipelines, and events. |
| **Styling** | **Tailwind CSS v4** | Modern CSS-first utility styling, custom animations, and print media queries. |
| **Icons & Visuals** | **Lucide React** | Clean, accessible vector icons for all user interactions. |
| **State Management** | **React Context API** | Unified `LaundryContext` serving reactive orders, catalog, staff, and settings. |
| **Realtime Sync** | **HTML5 BroadcastChannel API** | Instant cross-tab and cross-window state synchronization without page reloads. |
| **Data Storage (Default)** | **Browser LocalStorage** | Zero-configuration, zero-cost offline storage with automatic seed data initialization. |
| **Data Storage (Cloud)** | **PostgreSQL 16 (via Supabase)** | Optional cloud synchronization via `@supabase/supabase-js`. |
| **Containerization** | **Docker & Alpine Linux** | Standalone multi-stage Docker build (~110MB) for production environments. |
| **Hardware / POS** | **CSS Print Engine** | High-DPI 80mm thermal receipt printing and A4 tax invoices with barcode rendering. |

---

## 🏗️ System Architecture & Implementation

### Dual-Mode Persistence
DhobiGhat features a **dual-mode persistence engine**:
- **Offline/Local-First Mode (Default)**: Out-of-the-box, the application saves all orders, customers, services, and transactions directly to browser storage. You can immediately demo, test, or operate the app with zero backend setup.
- **Cloud Database Mode (Configurable)**: Adding standard Supabase environment variables switches the application to synchronize transactions with a hosted PostgreSQL instance, ensuring multi-device persistence.

### Real-Time Cross-Tab Synchronization
When multiple tabs or windows are open (e.g., an Operator Terminal in one window and an Admin Desk in another), state changes broadcast immediately using the native HTML5 `BroadcastChannel` (`dhobighat_order_live_sync`). 
- When an operator assigns a rider in the store terminal, the admin and customer tracking screens update in real time without refreshing the browser.
- A fallback `StorageEvent` listener ensures compatibility across older browser sessions.

### 14-Stage Logistics Pipeline
Orders progress through a strict, auditable 14-stage pipeline:
```
Online Booking
     │
     ▼
[1. Order Receive Queue]
     │
     ▼
[2. Pickup Assigned (M/E)] ──► Store Operator assigns Morning/Evening Rider
     │
     ▼
[3. Out for Pickup]        ──► Rider travels to customer location
     │
     ▼
[4. Order Picked-up]       ──► Bag collected; piece count & weight recorded
     │
     ▼
[5. Reached Store]         ──► Bag arrives at laundry hub
     │
     ▼
[6. Received]              ──► Garments checked in by floor staff
     │
     ▼
[7. Sorting]               ──► Color, fabric, and stain inspection
     │
     ▼
[8. Washing]               ──► Washing cycle initiated
     │
     ▼
[9. Drying]                ──► Hot tumbler drying
     │
     ▼
[10. Ironing]              ──► Steam pressing & finishing
     │
     ▼
[11. QC Check & Packed]    ──► Quality inspection, hanger/poly packaging
     │
     ▼
[12. Drop Assigned]        ──► Delivery rider assigned
     │
     ▼
[13. Out for Delivery]     ──► Driver en route to customer
     │
     ▼
[14. Delivered]            ──► 4-Digit Security PIN verified; handover complete
```

### Project Directory Structure
```
DhobiGhat/
├── Dockerfile                  # Production multi-stage Alpine Docker container
├── docker-compose.yml          # Container configuration with health checks
├── render.yaml                 # 1-Click Render blueprint configuration
├── supabase-schema.sql         # Optional PostgreSQL 16 schema & seed data
├── package.json                # Dependencies, scripts, and package metadata
├── next.config.ts              # Next.js standalone build configuration
├── tsconfig.json               # Strict TypeScript configuration
├── test-regression.mjs         # End-to-end regression & concurrency test suite
├── public/                     # Static brand graphics and logos
└── src/
    ├── app/                    # Next.js App Router pages
    │   ├── page.tsx            # Portal Switcher & Landing Directory
    │   ├── layout.tsx          # Root HTML layout with context providers
    │   ├── globals.css         # Theme styles & thermal print media formatting
    │   ├── customer/           # Customer Portal (Book, Orders, Rates, Account)
    │   ├── store/              # Store Floor & Operator Terminal
    │   │   ├── page.tsx        # 14-Stage Pipeline, POS Counter & Cash Settle
    │   │   └── login/page.tsx  # Shift PIN check-in for floor operators
    │   ├── admin/              # Executive HQ Admin Desk
    │   │   ├── page.tsx        # Orders Desk & Audit Trail
    │   │   ├── ledger/page.tsx # Daily / Monthly / Annual Financial Reports
    │   │   ├── archive/page.tsx# Completed Orders Archive & CSV/JSON Export
    │   │   └── login/page.tsx  # Admin access authentication
    │   └── track/page.tsx      # Public order tracking by invoice number
    ├── components/             # Reusable UI Components
    │   ├── ErrorBoundary.tsx   # Global crash interceptor with recovery buttons
    │   ├── InvoiceModal.tsx    # Thermal receipt (80mm) & A4 invoice generator
    │   ├── PosCheckoutModal.tsx# Walk-in counter intake modal with payment simulation
    │   ├── OrdersTable.tsx     # Filterable order ledger table
    │   ├── CustomersView.tsx   # Customer management & CRM directory
    │   ├── CatalogView.tsx     # Services and pricing management
    │   ├── ExpensesView.tsx    # Store overhead expense manager
    │   └── SettingsView.tsx    # Store settings, backups & cloud guides
    ├── context/
    │   └── LaundryContext.tsx  # Core state manager & real-time sync broadcaster
    ├── lib/
    │   ├── initial-data.ts     # Pre-populated seed catalog, customers & staff
    │   ├── supabase.ts         # Dual-mode Supabase PostgreSQL connector
    │   └── utils.ts            # Currency formatters, date helpers, class mergers
    └── types/
        └── index.ts            # Strict TypeScript types for orders, items & roles
```

---

## 👥 User Roles & Demo Credentials

The application includes pre-configured staff profiles for quick testing and shift sign-in at `/store/login`:

| Role | Staff Name | Phone Number | 4-Digit PIN | Primary Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Store Operator** | Ramesh Sharma | `9876543210` | `1234` | Queue dispatch, rider assignment, walk-in counter POS, shift cash close. |
| **Store Manager** | Vikas Patil | `9876543214` | `9999` | Full operational control, pipeline management, pricing & drawer audits. |
| **Floor Worker** | Sunil Gowda | `9876543211` | `2222` | Sorting, washing, drying, ironing, and packaging garments. |
| **Logistics Rider** | Mahesh Rider | `9876543216` | `6666` | Out-for-pickup, weighing bags, doorstep delivery. |
| **Logistics Rider** | Kiran Delivery | `9123456780` | `6667` | Doorstep collections and delivery routes. |
| **Logistics Rider** | Anand Kumar | `9845011223` | `6668` | Evening shift pickups and deliveries. |

---

## 🛠️ Step-by-Step Installation

### Prerequisites
- **Node.js**: `v20.x` or `v22.x`+ LTS installed
- **npm**: `v10.x` or `v11.x`+ installed
- *(Optional)* **Docker**: If you prefer containerized execution

---

### 1. Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/Gauravsah09/DhobiGhat.git
cd DhobiGhat

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open **`http://localhost:3000`** in your browser. The application will start immediately with pre-loaded demo orders and catalog items.

---

### 2. Production Build

To test the compiled, optimized production bundle locally:

```bash
# Build the production bundle
npm run build

# Start the production server
npm start
```

Access the app at **`http://localhost:3000`**.

---

### 3. Running with Docker Compose

A production-ready `Dockerfile` and `docker-compose.yml` are included:

```bash
# Build and run the container in the background
docker-compose up -d --build

# View container logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The app will be available at **`http://localhost:3000`**.

---

### 4. Optional: Cloud Database Setup (Supabase)

If you wish to synchronize data to a hosted PostgreSQL database instead of using local browser storage:

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Open the file [`supabase-schema.sql`](./supabase-schema.sql) in this repository, copy its contents, paste them into the Supabase SQL editor, and click **Run**.
4. Go to **Project Settings** -> **API** and copy your **Project URL** and **anon public key**.
5. Create a `.env.local` file in your project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
6. Restart your application (`npm run dev`). The system will automatically detect the credentials and synchronize with Supabase.

---

## 📖 How to Operate the Application

### Flow 1: Customer Booking an Online Pickup
1. Navigate to `/customer` and click **Book Doorstep Pickup** (or go to `/customer/book`).
2. Add garments to your cart (e.g., 3x Shirts, 1x Silk Saree) and choose the desired service (Dry Cleaning, Premium Wash, or Steam Press).
3. Select your pickup date and preferred window:
   - **Morning Window** (07:00 AM - 10:00 AM)
   - **Evening Window** (04:00 PM - 07:00 PM)
4. Choose a payment method:
   - **Cash on Delivery (COD)** or **UPI on Delivery**
   - **Instant Online UPI QR** (bypasses delivery PIN requirement once verified)
5. Click **Place Doorstep Pickup Booking**.
6. The booking confirmation displays your **Invoice Number** (e.g. `#IND-2409`) and your secret **4-Digit Delivery PIN**.

---

### Flow 2: Store Operator Assigning a Pickup Rider
1. Navigate to `/store/login`.
2. Click the **Store Operator** button or enter phone `9876543210` with PIN `1234` to check in.
3. You will be redirected to `/store`. Under the **Online Orders Pipeline** tab, locate the incoming order under **Order Receive Queue**.
4. Click **Assign Pickup Rider (Morning/Evening)**.
5. In the modal:
   - Select a rider (*Mahesh Rider*, *Kiran Delivery*, or *Anand Kumar*).
   - Select the shift window (*Morning* or *Evening*).
   - Click **Confirm Rider Assignment**.
6. The order moves to the **Pickup Assigned (M/E)** queue, and the assigned rider is displayed.
7. *To reassign*: Click **Reassign Pickup Rider**, choose a different rider or time, and confirm.

---

### Flow 3: Rider Collection & Store Intake Weigh-In
1. When the rider starts the trip, click **Rider En Route (Out for Pickup)**.
2. When the rider meets the customer, click **Rider Collected Bag (Order Picked-up)**.
3. Enter the total piece count and gross bag weight from the scale (e.g. `3.5 kg`) and confirm.
4. When the rider brings the bag to the hub, click **Bag Arrived at Store Floor (Reached Store)**.

---

### Flow 4: Processing Garments on the Shop Floor
1. At the store floor, advance the order from **1. Received** to **2. Sorting**.
2. Click **Start Washing Cycle (3. Washing)** when garments enter commercial washers.
3. Click **Transfer to Hot Tumbler (4. Drying)**.
4. Click **Transfer to Steam Finishing (5. Ironing)**.
5. Click **Perform QC Inspection & Pack (6. QC Check & Packed Ready)**. The clothes are sealed in packaging and tagged.

---

### Flow 5: Doorstep Delivery & Customer PIN Verification
1. Click **Assign Drop Rider** to designate the delivery driver.
2. Click **Rider Out for Delivery**.
3. Upon arriving at the customer's address:
   - **Standard Orders**: The customer provides their 4-digit PIN. The rider enters the PIN and clicks **Verify PIN & Complete Delivery**.
   - **Pre-Paid Orders**: The PIN check is automatically waived for contactless delivery.
4. Order status updates to **Delivered**.

---

### Flow 6: Walk-in POS Intake & Thermal Receipts
1. On `/store`, switch to the **Walk-in Counter Orders** tab.
2. Enter customer name and phone number.
3. Select garment items, service type, and options (starch level, packaging style).
4. Click **+ Add Item to Intake Ticket**.
5. Select payment method:
   - **Cash**: Enter amount tendered to calculate change.
   - **UPI QR**: Displays a live QR code with simulated audio confirmation.
   - **Card / POS**: Simulates card swipe authorization.
6. Click **Print Thermal Intake Receipt & Generate Tag Barcodes** to open the print dialog.

---

### Flow 7: Shift Close & Cash Register Reconciliation
1. At the end of the work day on `/store`, click **Day-End Cash & UPI Close**.
2. Review system-calculated totals for cash, UPI, and card payments.
3. Input physical cash counts (500s, 200s, 100s, coins) from the cash drawer.
4. Click **Submit End-of-Day Shift Close** to lock the shift and print the summary slip.

---

### Flow 8: Admin Desk & Order Settlements
1. Navigate to `/admin`.
2. Filter orders by status (Active, Delivered, Pending Settlement).
3. Click **Settle & Close Order** on delivered orders to reconcile pending payments.
4. Click **Time Audit Trail** on any order to review timestamped activity for all stages.

---

### Flow 9: Revenue Ledger & Financial Reports
1. Navigate to `/admin/ledger`.
2. Toggle between **Daily**, **Monthly**, **Quarterly**, and **Yearly** views.
3. Inspect gross revenue, tax (GST) collected, discounts applied, and net revenue.
4. Review the payment channel distribution breakdown (UPI, POS Machine, Cash, COD).

---

### Flow 10: Order Archiving & Data Export
1. Navigate to `/admin/archive`.
2. View delivered and settled historical orders.
3. Click **Export Archive to CSV** to download a spreadsheet for accounting.
4. Click **Export JSON Backup** for database backups.
5. If an order needs modification, click **Restore Order to Active Ledger**.

---

## ☁️ Cloud Deployment

### Option A: Vercel (Recommended)
1. Push your repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Framework preset is automatically recognized as **Next.js**.
4. Click **Deploy**. The application is instantly live with automatic global SSL and CDN.

---

### Option B: Render
The project includes a ready-to-use [`render.yaml`](./render.yaml) blueprint:
1. Log in to [render.com](https://render.com).
2. Click **New** -> **Blueprint** and link your GitHub repository.
3. Render reads `render.yaml` and deploys the web service automatically.

---

### Option C: Railway or Fly.io
Railway and Fly.io automatically detect the root [`Dockerfile`](./Dockerfile):
- **Railway**: Click **New Project** -> **Deploy from GitHub repo** -> Select this repository.
- **Fly.io**: Run `fly launch` in your terminal and follow the prompts.

---

## 🧪 Testing & Quality Assurance

### Run Regression & Concurrency Tests
An automated end-to-end regression test validates scale, security, and exception recovery:

```bash
node test-regression.mjs
```

This verifies:
- Pipeline state machine validations (e.g. preventing invalid status transitions).
- Concurrency simulation (50+ simultaneous orders).
- Unauthorized route access protection.
- Safe error boundary interception.

### Run Static Type Check
To verify strict TypeScript compilation across the entire project:

```bash
npx tsc --noEmit
```

---

## 📄 License

This project is open-source and licensed under the [MIT License](./LICENSE).
