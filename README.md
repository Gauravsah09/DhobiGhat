# DhobiGhat - Modern Laundry & Dry Cleaning Management System (LMS)

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An enterprise-grade, independent, full-stack Laundry & Dry Cleaning Point-of-Sale (POS), Logistics Dispatch, and Enterprise Resource Planning (ERP) platform. Built from the ground up with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

Designed with a **local-first, zero-downtime offline architecture** with instant multi-tab `BroadcastChannel` synchronization, full multi-branch support, and optional cloud synchronization with Supabase PostgreSQL.

---

## 📑 Table of Contents

1. [Key Features & Architectural Highlights](#-key-features--architectural-highlights)
2. [Portals & Role-Based Access Control](#-portals--role-based-access-control)
3. [End-to-End Installation](#-end-to-end-installation)
   - [Prerequisites](#prerequisites)
   - [Local Development Setup](#1-local-development-setup)
   - [Production Build & Run](#2-production-build--run)
   - [Running with Docker Compose](#3-running-with-docker-compose)
   - [Cloud Database Setup (Supabase)](#4-cloud-database-setup-supabase---optional)
4. [How to Use This Application (Operational Workflows)](#-how-to-use-this-application)
   - [Workflow 1: Customer Booking Online Doorstep Pickup](#workflow-1-customer-booking-online-doorstep-pickup)
   - [Workflow 2: Store Operator Assigning & Reassigning Pickup Riders](#workflow-2-store-operator-assigning--reassigning-pickup-riders)
   - [Workflow 3: Rider Collection & Store Weigh-In](#workflow-3-rider-collection--store-weigh-in)
   - [Workflow 4: Floor Garment Processing (Wash, Dry, Iron, QC)](#workflow-4-floor-garment-processing)
   - [Workflow 5: Doorstep Delivery & Customer Secret PIN Verification](#workflow-5-doorstep-delivery--pin-verification)
   - [Workflow 6: Walk-in Counter Intake & Thermal POS Receipt](#workflow-6-walk-in-counter-intake--thermal-pos-receipt)
   - [Workflow 7: Day-End Cash & UPI Settle Close](#workflow-7-day-end-cash--upi-settle-close)
   - [Workflow 8: HQ Admin Orders Desk (Close & Settle)](#workflow-8-hq-admin-orders-desk)
   - [Workflow 9: Executive Revenue Ledger Dashboard](#workflow-9-executive-revenue-ledger-dashboard)
   - [Workflow 10: Order Archive & Historical Export](#workflow-10-order-archive--historical-export)
5. [Cloud Deployment Guide](#-cloud-deployment-guide)
   - [Deploying to Vercel (Edge Serverless)](#option-a-vercel-recommended)
   - [Deploying to Render (Web Service / Docker)](#option-b-render)
   - [Deploying to Railway or Fly.io](#option-c-railway--flyio)
6. [Testing & Quality Assurance](#-testing--quality-assurance)
7. [Project Directory Structure](#-project-directory-structure)

---

## ⚡ Key Features & Architectural Highlights

- **100% Independent & Self-Contained**: Fully modernized and standalone; does not depend on any legacy PHP, Apache, or MySQL infrastructure.
- **Local-First Dual-Mode Storage**: Operates seamlessly offline with full data persistence in browser storage, with zero initial operational hosting costs ($0/mo). Instantly connects to PostgreSQL when Supabase cloud credentials are configured.
- **Real-Time Cross-Tab Synchronization**: Utilizes modern HTML5 `BroadcastChannel` (`dhobighat_order_live_sync`) and storage events so stage updates made by floor operators immediately reflect on rider, counter, and admin screens without page reloads.
- **14-Stage Interactive Online Logistics Pipeline**: End-to-end milestone tracking covering:
  1. *Order Receive Queue* → 2. *Pickup Assigned (M/E)* → 3. *Out for Pickup* → 4. *Order Picked-up* → 5. *Reached Store* → 6. *Received* → 7. *Sorting* → 8. *Washing* → 9. *Drying* → 10. *Ironing* → 11. *QC Check & Packed Ready* → 12. *Drop Assigned* → 13. *Out for Delivery* → 14. *Delivered*.
- **Store Operator Pickup Rider Dispatch**: Store operators can view active queue orders and assign or reassign dedicated pickup riders across Morning and Evening slot windows with instant visual confirmation.
- **Doorstep Delivery Security PIN**: High-security 4-digit PIN verification to ensure garments are strictly handed over to verified customers. Instant bypass supported when UPI payments are verified by provider callbacks.
- **Walk-in Counter POS Intake**: Dynamic garment pricing cross-referenced across service matrices (Shirts, Suits, Blankets, Sarees × Dry Cleaning, Steam Press, Premium Wash). POS card terminal integration and UPI Soundbox alert simulation.
- **Client-Side Thermal & A4 Invoices**: High-DPI 80mm thermal receipt printing and A4 tax invoices with live barcode tagging and store QR lookups without server-side PDF generation dependencies.
- **Executive Revenue Ledger**: Comprehensive financial analytics breaking down Daily, Monthly, Quarterly, and Yearly revenue, tax, discounts, and payment methods (UPI, POS Machine, Cash, COD).
- **Completed Orders Archive**: Dedicated archival view to safely store delivered orders, inspect historic logs, restore active orders, or export to CSV and JSON formats.

---

## 👥 Portals & Role-Based Access Control

| Portal | URL Path | Primary Users | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Customer App** | `/customer` | Retail Customers | Online pickup booking, time slot selection, order tracking, address book, garment rate calculator. |
| **Store Floor Terminal** | `/store` | Store Operators, Managers, Floor Workers | 14-stage pipeline, queue rider assignment, walk-in POS counter, rack Kanban, day-end cash reconciliation. |
| **Shift Check-in** | `/store/login` | Floor Staff | PIN-based operator shift check-in (Morning / Evening / Night), branch switcher, role credential directory. |
| **HQ Admin Desk** | `/admin` | Store Admins & Owners | Order desk, payment settlements, order closing, stage audit history, master catalog rates. |
| **Revenue Ledger** | `/admin/ledger` | Finance & Store Owners | Daily / Monthly / Quarterly / Yearly revenue breakdown, channel analytics, tax & discounts. |
| **Order Archive** | `/admin/archive` | Compliance & Auditing | Dedicated view for delivered orders, search filters, CSV/JSON export, order restoration. |
| **Portal Switcher** | `/` or `/portal` | All Personnel | High-level directory to quickly switch between customer, store operator, worker, and admin interfaces. |

### Pre-Configured Operator & Staff Credentials (PIN Authentication)
| Role | Staff Name | Phone Number | 4-Digit Shift PIN | Primary Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Store Operator** | Ramesh Sharma | `9876543210` | `1234` | Queue rider assignments, walk-in counter POS, cash close. |
| **Store Manager** | Vikas Patil | `9876543214` | `9999` | Full administrative access to floor pipelines, pricing & POS. |
| **Floor Worker** | Sunil Gowda | `9876543211` | `2222` | Floor sorting, washing, drying, ironing, and QC packing. |
| **Logistics Rider** | Mahesh Rider | `9876543216` | `6666` | Out for pickup, doorstep weight verification, delivery. |
| **Logistics Rider** | Kiran Delivery | `9123456780` | `6667` | Doorstep collection and delivery route dispatch. |
| **Logistics Rider** | Anand Kumar | `9845011223` | `6668` | Route pickup and evening delivery shifts. |

---

## 🛠️ End-to-End Installation

### Prerequisites
- **Node.js**: `v20.x` or `v22.x`+ LTS
- **npm**: `v10.x` or `v11.x`+
- **Docker** *(Optional)*: Docker Desktop / Docker Engine for containerized deployment

---

### 1. Local Development Setup

Clone the repository and install dependencies:

```bash
# Clone repository
git clone https://github.com/Gauravsah09/DhobiGhat.git
cd DhobiGhat

# Install npm dependencies
npm install

# Start development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser. The application initializes immediately with normalized seed data and local-first persistence.

---

### 2. Production Build & Run

To compile an optimized production bundle and start the production server:

```bash
# Compile optimized Next.js production build
npm run build

# Start production server on port 3000
npm start
```

---

### 3. Running with Docker Compose

The application includes a rootless, multi-stage Alpine Docker container (~110MB) optimized for high concurrency:

```bash
# Build and run container in background
docker-compose up -d --build

# Verify container status
docker ps
```

The container starts with automatic health checks passing at **[http://localhost:3000](http://localhost:3000)**.

To view live container logs:
```bash
docker-compose logs -f
```

To stop the container:
```bash
docker-compose down
```

---

### 4. Cloud Database Setup (Supabase) - Optional

To switch from local-first browser persistence to a cloud-hosted PostgreSQL database:

1. Create a free account at [supabase.com](https://supabase.com) and create a project (`dhobighat-pos`).
2. Navigate to **SQL Editor** -> **New Query**.
3. Copy the entire contents of [`supabase-schema.sql`](file:///d:/Business/laundry/laundry-app/supabase-schema.sql), paste it into the editor, and click **Run**.
4. Navigate to **Project Settings** -> **API**, and copy your `Project URL` and `anon public key`.
5. Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
6. Restart the application. The system will automatically detect the credentials and synchronize transactions with cloud PostgreSQL.

---

## 📖 How to Use This Application

### Workflow 1: Customer Booking Online Doorstep Pickup
1. Navigate to `/customer` (or `/customer/book`).
2. Select your garments (e.g. 3x Shirts, 1x Silk Saree) and choose the service (Dry Cleaning / Wash & Steam Press).
3. Review the live order summary with GST calculation.
4. Select your pickup slot date and window (e.g. *Morning 07:00 AM - 10:00 AM* or *Evening 04:00 PM - 07:00 PM*).
5. Choose payment method:
   - **Cash on Delivery (COD)** or **UPI on Delivery**
   - **Instant Online UPI QR**: Pay instantly to bypass delivery PIN requirement upon provider confirmation.
6. Click **Place Doorstep Pickup Booking**. Your order is assigned an invoice number (e.g. `#IND-2409`) and a secret 4-digit Delivery PIN.

---

### Workflow 2: Store Operator Assigning & Reassigning Pickup Riders
1. Navigate to `/store/login`.
2. Click the **Store Operator** pill (Ramesh Sharma) or enter phone `9876543210` and PIN `1234` to check in.
3. On `/store`, stay on the default **Online Orders Pipeline** tab.
4. Under the **Order Receive Queue** milestone, find the incoming online order.
5. Click **Assign Pickup Rider (Morning/Evening)**.
6. In the modal:
   - Choose a rider from the dropdown (*Mahesh Rider*, *Kiran Delivery*, or *Anand Kumar*).
   - Choose the pickup slot window (*Morning* or *Evening*).
   - Click **Confirm Rider Assignment**.
7. The order status updates immediately to `pickup_assigned` and appears under the **Pickup Assigned (M/E)** queue with a blue confirmation banner.
8. **To Reassign a Rider**: Click **Reassign Pickup Rider (<Current Rider>)**, choose a different rider or slot, and confirm. The order updates in-place and notifies all tabs.

---

### Workflow 3: Rider Collection & Store Weigh-In
1. Once the rider begins route travel, click **Rider En Route (Out for Pickup)**. The status shifts to `out_for_pickup`.
2. When the rider collects the bag from the customer, click **Rider Collected Bag (Order Picked-up)**.
3. Enter the recorded bag piece count and gross weight on the scale (e.g. `3.5 kg`), then confirm.
4. When the rider brings the garments into the store hub, click **Bag Arrived at Store Floor (Reached Store)**.

---

### Workflow 4: Floor Garment Processing
1. Floor staff check garments in at **1. Received** and advance to **2. Sorting**.
2. Click **Start Washing Cycle (3. Washing)** to allocate garments to commercial washers.
3. Click **Transfer to Hot Tumbler (4. Drying)**.
4. Click **Transfer to Steam Finishing (5. Ironing)**.
5. Click **Perform QC Inspection & Pack (6. QC Check & Packed Ready)**. Garments are sealed and tagged for dispatch.

---

### Workflow 5: Doorstep Delivery & PIN Verification
1. Click **Assign Drop Rider** to designate the delivery rider.
2. Click **Rider Out for Delivery**.
3. Upon arriving at the customer's doorstep:
   - **Standard COD Orders**: Rider asks the customer for their secret 4-digit PIN provided on their booking receipt. Once entered, click **Verify PIN & Complete Delivery**.
   - **Pre-Paid / Verified UPI Orders**: The PIN requirement is automatically waived, enabling 1-click contactless handover.

---

### Workflow 6: Walk-in Counter Intake & Thermal POS Receipt
1. On `/store`, click the **Walk-in Counter Orders** tab.
2. Enter the customer's name and 10-digit mobile number.
3. Select cloth item, service, starch level, and fold style (Hanger / Roll fold).
4. Click **+ Add Item to Intake Ticket**.
5. Choose payment method:
   - **Cash (bycash)**: Enter cash received and calculate change.
   - **Dynamic UPI QR**: Display QR for customer mobile scan with simulated UPI Soundbox announcement.
   - **POS Machine**: Trigger integrated card swipe/tap authorization.
6. Click **Print Thermal Intake Receipt & Generate Tag Barcodes**.

---

### Workflow 7: Day-End Cash & UPI Settle Close
1. On `/store`, click **Day-End Cash & UPI Close**.
2. Review aggregated total cash collections, digital UPI totals, and POS terminal transactions.
3. Enter physical drawer cash denomination counts.
4. Click **Submit End-of-Day Shift Close** to lock the register and print the daily reconciliation slip.

---

### Workflow 8: HQ Admin Orders Desk
1. Navigate to `/admin`.
2. View all orders across branches with status filters and search.
3. For delivered orders with pending COD/UPI settlements, click **Settle & Close Order**.
4. To inspect timestamps and staff accountability for any order, click **Time Audit Trail**.

---

### Workflow 9: Executive Revenue Ledger Dashboard
1. Navigate to `/admin/ledger`.
2. Toggle between **Daily**, **Monthly**, **Quarterly**, and **Yearly** views.
3. Review total gross revenue, tax collected, discounts granted, and net receivables.
4. Analyze the revenue channel breakdown chart (UPI vs POS Card vs Cash vs COD).

---

### Workflow 10: Order Archive & Historical Export
1. Navigate to `/admin/archive`.
2. Inspect all completed and settled orders stored in long-term archive.
3. Filter by date range or customer search.
4. Export records directly:
   - Click **Export Archive to CSV** for spreadsheet auditing.
   - Click **Export JSON Backup** for database archiving.
5. Need to re-open an archived order? Click **Restore Order to Active Ledger**.

---

## ☁️ Cloud Deployment Guide

### Option A: Vercel (Recommended)
1. Push your repository to GitHub.
2. Sign in to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
3. Import the repository `DhobiGhat`.
4. Framework preset will automatically be set to **Next.js**.
5. Click **Deploy**. Your app is live with global edge CDN caching and free automated SSL.

---

### Option B: Render
The repository includes a ready-to-run [`render.yaml`](file:///d:/Business/laundry/laundry-app/render.yaml) blueprint:
1. Log in to [render.com](https://render.com).
2. Click **New** -> **Blueprint**.
3. Select your repository. Render will automatically read `render.yaml` and provision the web service.
4. Click **Apply**.

---

### Option C: Railway / Fly.io
Railway and Fly.io automatically detect the included root [`Dockerfile`](file:///d:/Business/laundry/laundry-app/Dockerfile):
- **Railway**: Click **New Project** -> **Deploy from GitHub repo** -> Select `DhobiGhat`.
- **Fly.io**: Run `fly launch` followed by `fly deploy`.

---

## 🧪 Testing & Quality Assurance

### Run Regression Test Suite
An automated end-to-end regression test suite is included to validate security, concurrency, auth guards, and order lifecycle state transitions:

```bash
# Run automated regression suite
node test-regression.mjs
```

### Run Static Type Check
To verify 100% strict TypeScript compliance across all components, routes, and models:

```bash
npx tsc --noEmit
```

---

## 📁 Project Directory Structure

```
DhobiGhat/
├── Dockerfile                  # Multi-stage non-root Alpine container
├── docker-compose.yml          # Local & production Docker Compose configuration
├── render.yaml                 # 1-click Render blueprint
├── supabase-schema.sql         # 1-click PostgreSQL 16 schema & seed data
├── package.json                # Project dependencies and scripts
├── next.config.ts              # Next.js 16 standalone config & asset optimization
├── tsconfig.json               # Strict TypeScript configuration
├── test-regression.mjs         # Concurrency and security regression test suite
├── public/                     # Static icons, vector assets, and brand graphics
└── src/
    ├── app/
    │   ├── layout.tsx          # Root HTML layout with LaundryProvider & ErrorBoundary
    │   ├── page.tsx            # Portal switcher and overview landing
    │   ├── globals.css         # Tailwind v4 theme, animations & thermal receipt CSS
    │   ├── store/
    │   │   ├── page.tsx        # Store Floor Control Desk (14-Stage pipeline & POS)
    │   │   └── login/page.tsx  # Operator 4-digit PIN shift check-in
    │   ├── admin/
    │   │   ├── page.tsx        # HQ Admin Orders Desk & Stage Audit
    │   │   ├── ledger/page.tsx # Daily / Monthly / Quarterly / Yearly Revenue Ledger
    │   │   ├── archive/page.tsx# Completed Orders Archive & CSV/JSON Export
    │   │   └── login/page.tsx  # Admin authentication page
    │   ├── customer/
    │   │   ├── page.tsx        # Customer app dashboard & active bookings
    │   │   ├── book/page.tsx   # Garment selection & doorstep pickup scheduling
    │   │   ├── orders/page.tsx # Order tracking & delivery status
    │   │   └── rates/page.tsx  # Interactive garment & service rate calculator
    │   └── track/page.tsx      # Public invoice & phone tracking lookup
    ├── components/
    │   ├── ErrorBoundary.tsx   # Global crash handler with safe recovery
    │   ├── InvoiceModal.tsx    # Print-ready thermal receipt and A4 tax invoice
    │   ├── PosCheckoutModal.tsx# Fast intake POS modal with payment charge simulation
    │   ├── OrdersTable.tsx     # Master order ledger table
    │   ├── CustomersView.tsx   # CRM directory with customer profile editor
    │   ├── CatalogView.tsx     # Cloth type and service rate matrix management
    │   ├── ExpensesView.tsx    # Store overhead expense manager
    │   └── SettingsView.tsx    # Store branding, JSON data backups & cloud guides
    ├── context/
    │   └── LaundryContext.tsx  # Central local-first state manager & BroadcastChannel sync
    ├── lib/
    │   ├── initial-data.ts     # Initial seed dataset (customers, clothes, services, staff)
    │   ├── supabase.ts         # Dual-mode Supabase PostgreSQL connector
    │   └── utils.ts            # Currency formatters, date utilities, class mergers
    └── types/
        └── index.ts            # TypeScript definitions (Orders, Stages, RBAC Roles)
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](file:///d:/Business/laundry/laundry-app/LICENSE) file for details.
