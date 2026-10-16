# DhobiGhat - Modern Laundry & Dry Cleaning Management System

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

DhobiGhat is a modern, independent, full-stack Laundry & Dry Cleaning Point-of-Sale (POS), Logistics Dispatch, and Enterprise Resource Planning (ERP) platform. Built from scratch with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**, it provides an end-to-end digital solution for single-outlet laundries, dry cleaning franchises, and multi-branch laundry chains.

The system is designed with a **local-first, zero-downtime offline architecture**: it runs immediately in any browser with instant multi-tab live sync, requires **zero initial cloud costs ($0/mo)**, and seamlessly connects to a cloud PostgreSQL database (via Supabase) whenever you choose.

---

## 📑 Table of Contents

1. [Technology Stack](#-technology-stack)
2. [System Architecture & Implementation](#-system-architecture--implementation)
3. [Portals & User Roles](#-portals--user-roles)
4. [Step-by-Step Installation](#-step-by-step-installation)
   - [Prerequisites](#prerequisites)
   - [Option 1: Standard Local Setup (Fastest)](#option-1-standard-local-setup-fastest)
   - [Option 2: Docker Setup (Containerized)](#option-2-docker-setup-containerized)
   - [Option 3: Cloud Database Connection (Optional)](#option-3-cloud-database-connection-optional)
5. [How to Operate the Application](#-how-to-operate-the-application)
   - [1. Placing an Online Doorstep Pickup (Customer)](#1-placing-an-online-doorstep-pickup-customer)
   - [2. Staff Shift Check-In (Store Floor)](#2-staff-shift-check-in-store-floor)
   - [3. Assigning & Reassigning Pickup Riders (Store Operator)](#3-assigning--reassigning-pickup-riders-store-operator)
   - [4. Processing Garments through Floor Stages (Worker)](#4-processing-garments-through-floor-stages-worker)
   - [5. Doorstep Delivery & Customer PIN Verification (Rider)](#5-doorstep-delivery--customer-pin-verification-rider)
   - [6. Walk-in Counter Intake & POS Billing (Counter Operator)](#6-walk-in-counter-intake--pos-billing-counter-operator)
   - [7. Day-End Register Closing & Cash Tally (Operator / Manager)](#7-day-end-register-closing--cash-tally-operator--manager)
   - [8. Settling & Closing Orders (HQ Admin)](#8-settling--closing-orders-hq-admin)
   - [9. Viewing Revenue Analytics (Ledger Dashboard)](#9-viewing-revenue-analytics-ledger-dashboard)
   - [10. Managing Archived Orders (Order Archive)](#10-managing-archived-orders-order-archive)
6. [Cloud Deployment Options](#-cloud-deployment-options)
7. [Running Tests & Quality Checks](#-running-tests--quality-checks)
8. [Project Structure](#-project-structure)
9. [License](#-license)

---

## 🛠️ Technology Stack

DhobiGhat is built using a modern, lightweight, and type-safe technology stack:

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) — Utilizing React Server Components, server actions, dynamic routing, and Turbopack compiler.
- **Frontend Library**: [React 19](https://react.dev/) — Modern state hooks, functional components, and error boundaries.
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) — Strict static typing across all models, order states, API responses, and context providers.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) — Modern utility-first CSS, responsive layouts, sleek dark modes, micro-animations, and high-DPI thermal receipt print styles (`@media print`).
- **Icons**: [Lucide React](https://lucide.dev/) — Consistent, lightweight SVG icon system.
- **State & Real-Time Sync**: HTML5 `BroadcastChannel` (`dhobighat_order_live_sync`) + Storage API — Instant multi-tab synchronization without requiring paid WebSocket infrastructure.
- **Database (Dual-Mode)**: Local-first browser storage by default; fully compatible with [Supabase (PostgreSQL 16)](https://supabase.com/) for cloud persistence.
- **Containerization**: Multi-stage, rootless [Docker (Alpine Linux)](https://www.docker.com/) container (~110MB) for lightweight, reproducible deployments.

---

## 🏛️ System Architecture & Implementation

### 1. Dual-Mode Data Strategy
The application operates independently out-of-the-box without requiring an external database:
- **Local-First Mode (Default)**: All orders, customer accounts, staff shifts, branches, catalog pricing, and inventory are persisted in browser storage. This guarantees 100% offline functionality and zero hosting baseline costs.
- **Cloud Database Mode**: When environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are supplied, the application automatically synchronizes transactions with cloud-hosted PostgreSQL tables defined in [`supabase-schema.sql`](./supabase-schema.sql).

### 2. Real-Time Multi-Tab Live Sync
When a store operator assigns a rider or advances an order stage in one browser tab, other tabs (e.g., rider dispatch, customer tracking, admin desk) update immediately without refreshing. This is achieved using the HTML5 `BroadcastChannel` standard (`dhobighat_order_live_sync`) and storage change listeners.

### 3. 14-Stage Interactive Order State Machine
Every doorstep pickup booking flows through a granular 14-stage workflow:
1. `order_received` — Online booking placed, waiting in queue for dispatch.
2. `pickup_assigned` — Rider assigned for Morning or Evening slot window.
3. `out_for_pickup` — Rider en route to customer address.
4. `picked_up` — Bag collected from customer with scale weight recorded.
5. `reached_store` — Bag transported to store hub.
6. `received` — Floor check-in and intake verification.
7. `sorting` — Sorting by garment material and color.
8. `washing` — Washing machine cycle active.
9. `drying` — Commercial tumble dryer cycle.
10. `ironing` — Steam press and finishing.
11. `qc_check_packed` — Quality check passed, garments packed on hangers / folded.
12. `drop_assigned` — Delivery rider assigned for return journey.
13. `out_for_delivery` — Rider en route to deliver clean garments.
14. `delivered` — Handover verified with secret customer PIN (or verified instant UPI).

---

## 👥 Portals & User Roles

| Portal | URL Path | Who Uses It | What It Does |
| :--- | :--- | :--- | :--- |
| **Customer App** | `/customer` | Retail Customers | Browse garment rates, book doorstep pickups, choose time slots, track live order progress, manage addresses. |
| **Store Floor Terminal** | `/store` | Store Operators & Staff | 14-stage pipeline, queue rider assignment, walk-in counter POS, scale weigh-in, floor racks Kanban, day-end cash reconciliation. |
| **Staff Shift Check-in** | `/store/login` | Floor Staff | PIN-based operator shift check-in (Morning / Evening / Night), branch switcher, role credential directory. |
| **HQ Admin Desk** | `/admin` | Store Admins & Owners | Order desk, payment settlements, order closing, stage audit history, master catalog rates. |
| **Revenue Ledger** | `/admin/ledger` | Finance & Store Owners | Daily / Monthly / Quarterly / Yearly revenue breakdown, channel analytics (UPI, POS, Cash, COD). |
| **Order Archive** | `/admin/archive` | Compliance & Auditing | Dedicated view for delivered orders, search filters, CSV and JSON export, order restoration. |
| **Portal Switcher** | `/` or `/portal` | All Users | Quick launchpad to jump directly into any role view (Customer, Store Operator, Worker, Rider, Admin). |

### Pre-Configured Demo Credentials (PIN Authentication)
You can test any role immediately using these built-in credentials on `/store/login`:

| Role | Staff Member | Phone Number | 4-Digit Shift PIN | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Store Operator** | Ramesh Sharma | `9876543210` | `1234` | Queue rider dispatch, counter POS, cash close. |
| **Store Manager** | Vikas Patil | `9876543214` | `9999` | Full administrative control across all stages. |
| **Floor Worker** | Sunil Gowda | `9876543211` | `2222` | Floor sorting, washing, drying, ironing, and packing. |
| **Logistics Rider** | Mahesh Rider | `9876543216` | `6666` | Route pickup, doorstep weigh-in, delivery. |
| **Logistics Rider** | Kiran Delivery | `9123456780` | `6667` | Doorstep collection and route deliveries. |
| **Logistics Rider** | Anand Kumar | `9845011223` | `6668` | Route collection and evening delivery shifts. |

---

## 🚀 Step-by-Step Installation

### Prerequisites
Make sure you have the following installed on your computer:
- **Node.js**: Version `20.x` or `22.x`+ (LTS recommended)
- **npm**: Version `10.x` or higher (included with Node.js)
- **Git**

---

### Option 1: Standard Local Setup (Fastest)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Gauravsah09/DhobiGhat.git
   cd DhobiGhat
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000). The application loads with pre-configured seed data, active orders, and full offline persistence.

---

### Option 2: Docker Setup (Containerized)

If you prefer running in Docker without installing Node.js locally:

1. **Build and start the container:**
   ```bash
   docker compose up -d --build
   ```

2. **Verify container status:**
   ```bash
   docker ps
   ```
   The container `laundry-modern-pos` will be active and healthy on port `3000`.

3. **Open in browser:**
   Open [http://localhost:3000](http://localhost:3000).

4. **Stop the container when done:**
   ```bash
   docker compose down
   ```

---

### Option 3: Cloud Database Connection (Optional)

If you want to sync data to a cloud PostgreSQL database instead of local browser storage:

1. Create a free account at [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of [`supabase-schema.sql`](./supabase-schema.sql), paste it into the editor, and click **Run**.
4. In Supabase, go to **Project Settings** -> **API**, and copy your `Project URL` and `anon public key`.
5. Create a file named `.env.local` in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```
6. Restart your dev server (`npm run dev`) or rebuild your container.

---

## 📖 How to Operate the Application

Here is a clear guide on how to perform the most common operations:

### 1. Placing an Online Doorstep Pickup (Customer)
1. Open [http://localhost:3000/customer](http://localhost:3000/customer) (or click **Customer App** from the homepage).
2. Select your garments and services (e.g. 3x Men Shirts + Dry Cleaning, 1x Silk Saree + Saree Polishing).
3. Choose your preferred pickup date and slot window:
   - **Morning Slot**: 07:00 AM – 10:00 AM
   - **Evening Slot**: 04:00 PM – 07:00 PM
4. Select payment method:
   - **Cash on Delivery (COD)** or **UPI on Delivery**
   - **Instant Online UPI QR** (pays immediately and waives the delivery PIN)
5. Click **Place Doorstep Pickup Booking**.
6. The screen displays your confirmed order with an invoice number (e.g. `#IND-2409`) and a secret **4-digit Delivery PIN**.

---

### 2. Staff Shift Check-In (Store Floor)
1. Navigate to [http://localhost:3000/store/login](http://localhost:3000/store/login).
2. Click any of the quick-login pills (e.g. **Store Operator: Ramesh Sharma**) or enter phone `9876543210` and PIN `1234`.
3. Click **Check In & Open Store Floor**.
4. You are directed to the active Store Floor Control Desk.

---

### 3. Assigning & Reassigning Pickup Riders (Store Operator)
1. On the Store Floor Terminal (`/store`), make sure you are on the **Online Orders Pipeline** tab.
2. In the top milestone filter bar, click **Order Receive Queue**.
3. Locate an active incoming booking and click **Assign Pickup Rider (Morning/Evening)**.
4. In the modal:
   - Select a rider from the dropdown (*Mahesh Rider*, *Kiran Delivery*, or *Anand Kumar*).
   - Select the slot window (*Morning* or *Evening*).
   - Click **Confirm Rider Assignment**.
5. The order automatically moves into the **Pickup Assigned (M/E)** queue, and a confirmation banner is displayed.
6. **To Reassign a Rider**: Click **Reassign Pickup Rider (<Rider Name>)**, select another rider, and confirm. The assignment updates instantly across all open tabs.

---

### 4. Processing Garments through Floor Stages (Worker)
As garments move through the store facility, floor workers update their status:
1. When the rider returns to the store with the laundry bag, click **Rider Collected Bag**, enter the weight on the scale (e.g. `3.5 kg`), and confirm.
2. When the bag enters the facility, click **Bag Arrived at Store Floor (Reached Store)**.
3. Advance the garment through processing stages:
   - **1. Received** → Floor intake confirmed.
   - **2. Sorting** → Segregated by fabric and color.
   - **3. Washing** → Loaded into washers.
   - **4. Drying** → Transferred to tumblers.
   - **5. Ironing** → Steam pressing and folding.
   - **6. QC Check & Packed Ready** → Garments sealed on hangers with barcode tags.

---

### 5. Doorstep Delivery & Customer PIN Verification (Rider)
1. In the Store Terminal, click **Assign Drop Rider** and then click **Rider Out for Delivery**.
2. When the rider arrives at the customer's home:
   - **COD / Unpaid Orders**: The rider asks the customer for their secret 4-digit PIN (visible only on the customer's booking screen). Enter the PIN and click **Verify PIN & Complete Delivery**.
   - **Pre-Paid UPI Orders**: The PIN is automatically bypassed once confirmed by the payment provider, allowing 1-click contactless handover.

---

### 6. Walk-in Counter Intake & POS Billing (Counter Operator)
1. On `/store`, click the **Walk-in Counter Orders** tab.
2. Enter the customer's name and 10-digit mobile number.
3. Select garment types, services, starch levels, and fold styles.
4. Click **+ Add Item to Intake Ticket**.
5. Choose payment method: **Cash**, **UPI QR** (with soundbox audio alert), or **POS Card Machine**.
6. Click **Print Thermal Intake Receipt & Generate Tag Barcodes**. A print-ready 80mm thermal receipt displays instantly.

---

### 7. Day-End Register Closing & Cash Tally (Operator / Manager)
1. On `/store`, click the **Day-End Cash & UPI Close** tab.
2. Review aggregated drawer figures (cash collections, digital UPI transactions, POS card swipes).
3. Enter the physical currency denomination counts in the register.
4. Click **Submit End-of-Day Shift Close** to lock the drawer and produce the shift audit report.

---

### 8. Settling & Closing Orders (HQ Admin)
1. Navigate to `/admin`.
2. Browse all orders across all branches and stages.
3. For delivered orders that have received payment, click **Settle & Close Order** to mark them completed.
4. Click **Time Audit Trail** on any order to inspect a tamper-proof timestamp record of every staff interaction.

---

### 9. Viewing Revenue Analytics (Ledger Dashboard)
1. Navigate to `/admin/ledger`.
2. Toggle between **Daily**, **Monthly**, **Quarterly**, and **Yearly** views.
3. View financial totals: Gross Revenue, GST Tax Collected, Discounts Given, and Net Inflow.
4. Inspect the payment mode breakdown chart (UPI vs POS Card vs Cash vs COD).

---

### 10. Managing Archived Orders (Order Archive)
1. Navigate to `/admin/archive`.
2. View historical completed orders moved to the archive.
3. Search by invoice number or customer phone.
4. Export data:
   - Click **Export Archive to CSV** for spreadsheets and accounting software.
   - Click **Export JSON Backup** for database backups.
5. Need to re-open an order? Click **Restore Order to Active Ledger**.

---

## ☁️ Cloud Deployment Options

### Deploying to Vercel (Zero-Cost Serverless Edge)
1. Push your repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
3. Import your GitHub repository (`DhobiGhat`).
4. Framework preset will automatically detect **Next.js**.
5. Click **Deploy**. Your app is live with global edge CDN caching and free automated SSL.

---

### Deploying to Render (Docker / Web Service)
The repository includes a pre-configured [`render.yaml`](./render.yaml) blueprint:
1. Log in to [render.com](https://render.com).
2. Click **New** -> **Blueprint**.
3. Select your repository. Render automatically provisions the web service from the blueprint.
4. Click **Apply**.

---

### Deploying to Railway or Fly.io
Railway and Fly.io automatically detect the root [`Dockerfile`](./Dockerfile):
- **Railway**: Click **New Project** -> **Deploy from GitHub repo** -> Select `DhobiGhat`.
- **Fly.io**: Run `fly launch` followed by `fly deploy`.

---

## 🧪 Running Tests & Quality Checks

### Run Automated Regression Suite
Verify end-to-end security, concurrency, auth guards, and order stage transitions:
```bash
node test-regression.mjs
```

### Run Static Type Check
Verify strict TypeScript compliance across all components, routes, and models:
```bash
npx tsc --noEmit
```

---

## 📁 Project Structure

```
DhobiGhat/
├── Dockerfile                  # Multi-stage non-root Alpine container definition
├── docker-compose.yml          # Container configuration for local and server deployment
├── render.yaml                 # 1-click Render cloud deployment blueprint
├── supabase-schema.sql         # PostgreSQL 16 schema, tables, indexes, and initial seed
├── package.json                # Project dependencies and run scripts
├── next.config.ts              # Next.js 16 standalone config & asset optimization
├── tsconfig.json               # Strict TypeScript configuration
├── test-regression.mjs         # Automated concurrency and security regression test suite
├── public/                     # Static icons, vector assets, and brand graphics
└── src/
    ├── app/
    │   ├── layout.tsx          # Root HTML layout with context providers and error boundary
    │   ├── page.tsx            # Portal switcher and landing overview
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
    │   ├── PosCheckoutModal.tsx# Fast intake POS modal with payment simulation
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

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.
