# DhobiGhat - Modern Laundry & Dry Cleaning Management System

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-Edge-F38020?style=flat&logo=cloudflare)](https://workers.cloudflare.com/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-Zero_Egress-orange?style=flat&logo=cloudflare)](https://developers.cloudflare.com/r2/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_16-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Firebase Cloud Messaging](https://img.shields.io/badge/FCM-Web_Push-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![Sentry](https://img.shields.io/badge/Sentry-Monitoring-362D59?style=flat&logo=sentry)](https://sentry.io/)
[![Docker](https://img.shields.io/badge/Docker-Alpine_Standalone-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**DhobiGhat** is an enterprise-grade, high-performance Laundry & Dry Cleaning Point-of-Sale (POS), Logistics Dispatch, and Enterprise Resource Planning (ERP) platform. Built from the ground up on modern cloud primitives, DhobiGhat maximizes generous, perpetually free tiers ("The Greedy Nerd Architecture") to deliver sub-50ms latency, zero monthly infrastructure bills, and ironclad customer data privacy.

---

## 📑 Table of Contents

1. [Architecture & The Greedy Nerd Strategy](#-architecture--the-greedy-nerd-strategy)
   - [Zero-Cost Cloud Topology](#zero-cost-cloud-topology)
   - [Perpetually Free Quota Matrix](#perpetually-free-quota-matrix)
2. [Data Privacy & Zero-Local-Storage Mandate](#-data-privacy--zero-local-storage-mandate)
3. [Core Backend Services & APIs](#-core-backend-services--apis)
   - [14-Stage Logistics State Machine](#14-stage-logistics-state-machine)
   - [Server-Side Pricing & 18% GST Engine](#server-side-pricing--18-gst-engine)
   - [Cryptographic Delivery PIN Verification](#cryptographic-delivery-pin-verification)
   - [Cloudflare R2 Direct Photo & Invoice Storage](#cloudflare-r2-direct-photo--invoice-storage)
   - [Firebase Cloud Messaging (FCM) Web Push](#firebase-cloud-messaging-fcm-web-push)
   - [24/7 Monitoring & Health Watchdog](#247-monitoring--health-watchdog)
4. [Technology Stack](#-technology-stack)
5. [Project Structure](#-project-structure)
6. [User Roles & Pre-configured Staff Profiles](#-user-roles--pre-configured-staff-profiles)
7. [Step-by-Step Installation & Setup](#-step-by-step-installation--setup)
   - [Prerequisites](#prerequisites)
   - [1. Quick Start (Local Development)](#1-quick-start-local-development)
   - [2. Production Build](#2-production-build)
   - [3. Running with Docker Compose](#3-running-with-docker-compose)
   - [4. Supabase Database Setup & RLS](#4-supabase-database-setup--rls)
   - [5. Cloudflare Workers & R2 Setup](#5-cloudflare-workers--r2-setup)
   - [6. Firebase Cloud Messaging (Web Push) Setup](#6-firebase-cloud-messaging-web-push-setup)
   - [7. UptimeRobot 24/7 Watchdog](#7-uptimerobot-247-watchdog)
8. [Operating Workflows (Step-by-Step)](#-operating-workflows-step-by-step)
   - [Flow 1: Customer Doorstep Pickup Booking](#flow-1-customer-doorstep-pickup-booking)
   - [Flow 2: Operator Assigning Pickup Rider (Morning/Evening)](#flow-2-operator-assigning-pickup-rider-morningevening)
   - [Flow 3: Rider Collection & Gross Weight Intake](#flow-3-rider-collection--gross-weight-intake)
   - [Flow 4: Shop Floor Garment Processing (Wash, Dry, Press, QC)](#flow-4-shop-floor-garment-processing-wash-dry-press-qc)
   - [Flow 5: Doorstep Delivery & 4-Digit Security PIN Verification](#flow-5-doorstep-delivery--4-digit-security-pin-verification)
   - [Flow 6: Walk-in Counter POS Intake & Thermal Receipts](#flow-6-walk-in-counter-pos-intake--thermal-receipts)
   - [Flow 7: Shift Close & Cash Drawer Balancing](#flow-7-shift-close--cash-drawer-balancing)
   - [Flow 8: Admin Management, Ledger & Settlement](#flow-8-admin-management-ledger--settlement)
9. [Automated Testing & Quality Assurance](#-automated-testing--quality-assurance)
10. [License](#-license)

---

## 🏛️ Architecture & The Greedy Nerd Strategy

### Zero-Cost Cloud Topology

DhobiGhat moves 100% of critical business calculations, stage transitions, and pricing rules to the backend and edge, backed by zero-cost cloud services:

```
[ Customer / Staff Browser ]
          │
          │ HTTPS (TLS 1.3)
          ▼
[ Cloudflare Global Edge Network (300+ PoPs) ]
    ├── DDoS Protection & Bot Fight Mode (Free)
    ├── Cloudflare Worker API Gateway (100k free req/day)
    │     ├── Web Crypto HMAC-SHA256 JWT Verification (<1ms)
    │     └── Cache API (0ms hit for Garment & Service Rates)
    └── Reverse Proxy to Backend API
          │
          ▼
[ Next.js 16 Standalone Server / Edge API ]
    ├── 14-Stage Logistics State Machine Validator
    ├── Server Pricing & GST Valuation Engine
    ├── Cryptographic PIN Verification (3 Attempts Max)
    └── Staff Shift RBAC Engine
          │
    ┌─────┴─────────────────────────┬──────────────────────────┐
    ▼                               ▼                          ▼
[ Supabase PostgreSQL 16 ]  [ Cloudflare R2 ]     [ Firebase Cloud Messaging ]
  ├── Port 6543 (Supavisor)   ├── Pre-wash Photos   ├── Operator Terminal Chimes
  ├── Strict RLS Policies     ├── Thermal Invoices  ├── Rider Dispatch Alerts
  └── Realtime WebSockets     └── Nightly Backups   └── Customer Stage Alerts
```

### Perpetually Free Quota Matrix

| Layer | Provider | Free Tier Allowance | DhobiGhat Projected Use | Cost / Month |
| :--- | :--- | :--- | :--- | :--- |
| **DNS, CDN & WAF** | **Cloudflare** | Unlimited bandwidth & DDoS mitigation | 100% of public web traffic | **$0.00** |
| **Edge Compute** | **Cloudflare Workers** | 100,000 req/day (3M/mo), 10ms CPU | Edge JWT auth & catalog routing | **$0.00** |
| **Object Storage** | **Cloudflare R2** | 10 GB storage, 1M Class A, 10M Class B, **$0 Egress** | Pre-wash photos & invoices | **$0.00** |
| **Database** | **Supabase** | 500 MB PostgreSQL 16, 50,000 MAU, Supavisor Pooler | Relational orders & audit logs | **$0.00** |
| **Realtime WebSockets** | **Supabase** | 200 concurrent connections, 2M messages/month | Active floor & rider sync | **$0.00** |
| **Push Notifications** | **Google FCM** | **Unlimited** web and mobile push notifications | Operational dispatch alerts | **$0.00** |
| **Crash Monitoring** | **Sentry** | 5,000 errors/month, 10,000 performance transactions | Production exception reporting | **$0.00** |
| **Uptime Watchdog** | **UptimeRobot** | 50 monitors at 5-minute intervals, SSL alerting | `/api/health` 24/7 ping | **$0.00** |
| **Total Cost** | | | **Capacity for 100+ orders/day** | **$0.00 / mo** |

---

## 🔒 Data Privacy & Zero-Local-Storage Mandate

To comply with enterprise data security guidelines and protect customer Personally Identifiable Information (PII) on shared store POS terminals:

1. **Zero Customer PII in Browser Storage**:
   - `localStorage` and `sessionStorage` **never store** customer names, telephone numbers, addresses, order items, or PIN hashes.
   - Any legacy keys are purged automatically on application boot.
   - Client order state resides exclusively in volatile JavaScript RAM (wiped cleanly when the tab or browser closes).
2. **Secure Cookie-Based Authentication**:
   - Session tokens are stored strictly in `__Host-dhobighat_session` cookies configured with:
     - `HttpOnly`: Inaccessible to JavaScript, neutralizing XSS credential theft.
     - `Secure`: Transmitted only over encrypted HTTPS connections.
     - `SameSite=Strict`: Immune to Cross-Site Request Forgery (CSRF).
3. **Role-Based Data Masking**:
   - Store counter screens mask customer phone numbers (`98****3210`).
   - Floor washing/ironing workers see only Garment Tags and Barcodes with zero customer identity exposure.
   - Delivery riders only receive address and telephone access for their currently assigned dispatch.

---

## ⚙️ Core Backend Services & APIs

All critical operations are enforced server-side:

### 14-Stage Logistics State Machine
- **Endpoint**: `PATCH /api/orders/[id]/stage`
- **Validation**: Enforces strictly allowed forward transitions and rejects skipping steps (e.g. attempting to jump from `order_placed` directly to `delivered` returns `400 Bad Request`).
- **Audit Log**: Appends immutable records with actor ID, role, timestamp, and notes.

### Server-Side Pricing & 18% GST Engine
- **Endpoint**: `POST /api/orders`
- **Integrity**: Garment line items are re-validated against the official catalog price matrix on the server.
- **Taxes**: Automatically calculates subtotal, 18% Goods & Services Tax (GST: 9% CGST + 9% SGST), discounts, and net grand total.

### Cryptographic Delivery PIN Verification
- **Endpoint**: `POST /api/orders/[id]/verify-pin`
- **Security**: The server issues a cryptographically secure 4-digit PIN upon order creation.
- **Brute-Force Guard**: Locks the order after 3 incorrect verification attempts.
- **Contactless Waiver**: Pre-paid verified UPI orders waive the delivery PIN automatically.

### Cloudflare R2 Direct Photo & Invoice Storage
- **Endpoint**: `POST /api/uploads/presign`
- **Operation**: Generates pre-signed S3-compatible URLs allowing mobile cameras and store webcams to upload garment stain photos directly to Cloudflare R2.
- **Zero Egress**: Thermal receipt snapshots and A4 PDFs are served with $0 egress fees.

### Firebase Cloud Messaging (FCM) Web Push
- **Service Worker**: `public/firebase-messaging-sw.js`
- **Notifications**:
  - Store Terminal Chime: Instant audio and visual toast when an online pickup is booked.
  - Rider Dispatch: Alerts assigned drivers of new pickups with addresses and garment counts.
  - Customer Updates: Automatic push notifications as clothes move from `washing` to `qc_packed` and `out_for_delivery`.

### 24/7 Monitoring & Health Watchdog
- **Endpoint**: `GET /api/health`
- **Checks**: Probes database pool latency and R2 connectivity.
- **Integration**: Linked to UptimeRobot/BetterUptime for 24/7 heartbeat monitoring and SMS/email alerts.

---

## 💻 Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | React Server Components, standalone output, edge runtime routes. |
| **UI Library** | **React 19** | Concurrent rendering, modern hooks, responsive layouts. |
| **Language** | **TypeScript 5 (Strict)** | Static type safety across models, APIs, and business rules. |
| **Styling** | **Tailwind CSS v4** | Utility-first styling with high-DPI 80mm thermal print formatting. |
| **Edge Compute** | **Cloudflare Workers** | Sub-1ms Web Crypto JWT verification, rate limiting, and reverse proxy. |
| **Database** | **PostgreSQL 16 (Supabase)** | Normalized schema with Row-Level Security (RLS) and Supavisor pooling. |
| **Object Storage** | **Cloudflare R2** | Zero-egress object storage for garment inspection photos and thermal receipts. |
| **Push Notifications**| **Firebase Cloud Messaging** | Free web push dispatch to store terminals, riders, and customers. |
| **Observability** | **Sentry & UptimeRobot** | Application exception capture, edge latency metrics, and 24/7 uptime pings. |
| **Containerization** | **Docker & Alpine Linux** | Standalone multi-stage production container (~110MB). |

---

## 📁 Project Structure

```
DhobiGhat/
├── Dockerfile                      # Production multi-stage Alpine Docker container
├── docker-compose.yml              # Container setup with automated health checks
├── cloudflare/                     # Cloudflare Edge Gateway
│   ├── wrangler.toml               # Workers deployment and route configuration
│   └── worker.ts                   # Edge reverse proxy, Web Crypto JWT & Cache API
├── public/                         # Brand assets & service worker
│   └── firebase-messaging-sw.js    # FCM Web Push Service Worker
├── sentry.client.config.ts         # Sentry client exception reporting
├── sentry.server.config.ts         # Sentry server exception reporting
├── supabase-schema.sql             # PostgreSQL 16 schema, RLS policies & seed data
├── test-regression.mjs             # End-to-end regression & concurrency test suite
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # Strict TypeScript compiler options
└── src/
    ├── app/                        # Next.js App Router
    │   ├── api/                    # Server-side REST Endpoints
    │   │   ├── auth/login/route.ts # HttpOnly cookie authentication
    │   │   ├── auth/logout/route.ts# Session invalidation
    │   │   ├── health/route.ts     # 24/7 Uptime watchdog endpoint
    │   │   ├── orders/route.ts     # Master orders & price valuation API
    │   │   ├── orders/[id]/stage/  # 14-stage state machine validator
    │   │   ├── orders/[id]/verify-pin/ # 4-digit delivery PIN check
    │   │   ├── orders/[id]/assign-rider/ # Rider dispatch & push trigger
    │   │   ├── store/shift-close/  # Drawer cash count reconciliation
    │   │   └── uploads/presign/    # Direct-to-R2 pre-signed upload URL generator
    │   ├── customer/               # Customer Booking & Tracking Portal
    │   ├── store/                  # Store Floor, Intake POS & Cash Settle
    │   ├── admin/                  # HQ Executive Desk, Ledger & Archive
    │   └── track/page.tsx          # Public order status tracker
    ├── components/                 # Reusable UI Components
    │   ├── ErrorBoundary.tsx       # Crash interceptor with recovery buttons
    │   ├── InvoiceModal.tsx        # 80mm thermal receipt & A4 invoice renderer
    │   ├── PosCheckoutModal.tsx    # Walk-in POS checkout with UPI simulation
    │   └── OrdersTable.tsx         # Unified orders table
    ├── context/
    │   └── LaundryContext.tsx      # In-memory reactive state (Zero-Local-Storage)
    ├── lib/
    │   ├── auth-server.ts          # Server-side JWT session generation & verification
    │   ├── fcm.ts                  # Firebase Cloud Messaging push dispatcher
    │   ├── r2.ts                   # S3-compatible Cloudflare R2 bucket manager
    │   ├── supabase-server.ts      # Server-side Supabase client with connection pooling
    │   ├── initial-data.ts         # Catalog rates and demo staff profiles
    │   └── utils.ts                # Formatters and currency calculations
    └── types/
        └── index.ts                # TypeScript interfaces for orders, items & roles
```

---

## 👥 User Roles & Pre-configured Staff Profiles

For testing and shift sign-in at `/store/login`:

| Role | Staff Name | Phone Number | 4-Digit PIN | Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Store Operator** | Ramesh Sharma | `9876543210` | `1234` | Queue dispatch, rider assignment, walk-in counter POS, shift cash close. |
| **Store Manager** | Vikas Patil | `9876543214` | `9999` | Full operational control, pipeline management, pricing & drawer audits. |
| **Floor Worker** | Sunil Gowda | `9876543211` | `2222` | Sorting, washing, drying, ironing, and packaging garments. |
| **Logistics Rider** | Mahesh Rider | `9876543216` | `6666` | Out-for-pickup, bag weighing, doorstep delivery with PIN. |
| **Logistics Rider** | Kiran Delivery | `9123456780` | `6667` | Doorstep collections and delivery routes. |
| **Logistics Rider** | Anand Kumar | `9845011223` | `6668` | Evening shift pickups and deliveries. |

---

## 🛠️ Step-by-Step Installation & Setup

### Prerequisites
- **Node.js**: `v20.x` or `v22.x`+ LTS
- **npm**: `v10.x` or `v11.x`+
- *(Optional)* **Docker**: For containerized deployments

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

Open **`http://localhost:3000`** in your browser. The application runs immediately in memory with sample data.

---

### 2. Production Build

```bash
# Compile optimized production bundle
npm run build

# Start production server
npm start
```

---

### 3. Running with Docker Compose

A production-ready multi-stage Docker build is included:

```bash
# Build and run container in background
docker-compose up -d --build

# Inspect container health and logs
docker-compose logs -f

# Stop container
docker-compose down
```

Access the app at **`http://localhost:3000`**.

---

### 4. Supabase Database Setup & RLS

To enable cloud PostgreSQL persistence:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open [`supabase-schema.sql`](./supabase-schema.sql), copy its contents, paste them into the SQL editor, and click **Run**.
4. Retrieve your **Project URL**, **Anon Key**, and **Service Role Key** under **Project Settings** -> **API**.
5. Create a `.env.local` file in your project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

---

### 5. Cloudflare Workers & R2 Setup

To deploy the edge reverse proxy and zero-egress photo storage:

1. Create a free account at [cloudflare.com](https://cloudflare.com).
2. Create three R2 buckets in your Cloudflare dashboard:
   - `dhobighat-photos` (Garment pre-wash and stain inspection photos)
   - `dhobighat-invoices` (PDF & thermal receipt snapshots)
   - `dhobighat-backups` (Automated nightly database dumps)
3. Generate R2 API credentials and add them to `.env.local`:
   ```env
   CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
   CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
   CLOUDFLARE_R2_BUCKET_NAME=dhobighat-photos
   CLOUDFLARE_R2_PUBLIC_DOMAIN=https://photos.yourdomain.com
   AUTH_JWT_SECRET=your-random-32-byte-hex-string
   ```
4. Deploy the Cloudflare Worker:
   ```bash
   cd cloudflare
   npx wrangler deploy
   ```

---

### 6. Firebase Cloud Messaging (Web Push) Setup

To enable free push notifications:

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Register a Web App and download `firebaseConfig`.
3. Add your VAPID key to `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-fcm-vapid-key
   FIREBASE_PROJECT_ID=your-firebase-project-id
   ```
4. Update `public/firebase-messaging-sw.js` with your Firebase project identifiers.

---

### 7. UptimeRobot 24/7 Watchdog

To configure 24/7 uptime monitoring at zero cost:

1. Sign up for a free account at [uptimerobot.com](https://uptimerobot.com).
2. Click **Add New Monitor**.
3. Set Monitor Type to **HTTP(s)**.
4. Enter URL: `https://your-domain.com/api/health`.
5. Set monitoring interval to **5 minutes**.
6. Select your email or phone for instant SMS/email downtime alerts.

---

## 📖 Operating Workflows (Step-by-Step)

### Flow 1: Customer Doorstep Pickup Booking
1. Open `/customer` and click **Book Doorstep Pickup** (or direct to `/customer/book`).
2. Add garments to cart (e.g., 3x Shirts, 1x Silk Saree) and select service (Dry Cleaning, Premium Wash, Steam Press).
3. Select pickup date and slot:
   - **Morning Window** (07:00 AM - 10:00 AM)
   - **Evening Window** (04:00 PM - 07:00 PM)
4. Choose payment: **COD**, **UPI on Delivery**, or **Online Instant UPI QR**.
5. Click **Place Doorstep Pickup Booking**.
6. Note the **Invoice Number** (`#IND-2409`) and secret **4-Digit Delivery PIN**.

---

### Flow 2: Operator Assigning Pickup Rider (Morning/Evening)
1. Sign in at `/store/login` with Phone `9876543210` and PIN `1234`.
2. Locate the incoming order under **Order Receive Queue**.
3. Click **Assign Pickup Rider (Morning/Evening)**.
4. Select the designated driver (*Mahesh Rider*, *Kiran Delivery*, or *Anand Kumar*) and shift.
5. Click **Confirm Rider Assignment**. The order transitions to **Pickup Assigned (M/E)**.

---

### Flow 3: Rider Collection & Gross Weight Intake
1. Rider starts the route: click **Rider En Route (Out for Pickup)**.
2. Rider collects the bag: click **Rider Collected Bag (Order Picked-up)**.
3. Weigh the intake bag and enter piece count and scale weight (e.g. `3.5 kg`).
4. Upon arrival at the hub: click **Bag Arrived at Store Floor (Reached Store)**.

---

### Flow 4: Shop Floor Garment Processing (Wash, Dry, Press, QC)
1. Check in garments at counter: click **Receive Garments (1. Received)**.
2. Advance through floor processing:
   - Click **Move to Sorting (2. Sorting)**
   - Click **Start Washing Cycle (3. Washing)**
   - Click **Transfer to Hot Tumbler (4. Drying)**
   - Click **Transfer to Steam Finishing (5. Ironing)**
   - Click **Perform QC Inspection & Pack (6. QC Check & Packed Ready)**. Garments are poly-wrapped and hanger-tagged.

---

### Flow 5: Doorstep Delivery & 4-Digit Security PIN Verification
1. Click **Assign Drop Rider** to designate the driver.
2. Click **Rider Out for Delivery**.
3. At customer doorstep:
   - Ask customer for their 4-digit PIN.
   - Enter PIN and click **Verify PIN & Complete Delivery**.
   - *(Note: Verified pre-paid online orders waive PIN requirement automatically).*
4. Order status updates to **Delivered**.

---

### Flow 6: Walk-in Counter POS Intake & Thermal Receipts
1. On `/store`, switch to **Walk-in Counter Orders**.
2. Enter customer name and phone.
3. Select items, quantity, starch, and packaging.
4. Click **+ Add Item to Intake Ticket**.
5. Select payment: Cash, UPI QR, or Card.
6. Click **Print Thermal Intake Receipt & Generate Tag Barcodes** to open the 80mm thermal receipt dialog.

---

### Flow 7: Shift Close & Cash Drawer Balancing
1. At the end of the day, click **Day-End Cash & UPI Close** on `/store`.
2. Inspect system ledger receipts for Cash, UPI, and Card.
3. Input physical drawer bill counts (₹500, ₹200, ₹100, ₹50, coins).
4. System automatically computes discrepancy.
5. Click **Submit End-of-Day Shift Close** to lock the drawer session and print the balance slip.

---

### Flow 8: Admin Management, Ledger & Settlement
1. Open `/admin`.
2. Review pipeline metrics, active dispatch queues, and overdue orders.
3. Click **Settle & Close Order** on delivered orders to reconcile final payment.
4. Click **Time Audit Trail** on any order to review timestamped actor logs across all 14 stages.
5. Navigate to `/admin/ledger` to inspect daily, monthly, and annual financial statements, tax collections, and payment channel distribution.
6. Navigate to `/admin/archive` to download CSV spreadsheets or JSON database backups.

---

## 🧪 Automated Testing & Quality Assurance

### Run Regression & Concurrency Test Suite
A automated end-to-end regression script validates security, scale, backend APIs, and data privacy:

```bash
node test-regression.mjs
```

**Verifications performed:**
- **Route Guard Protection**: Verifies RBAC redirects for Admin and Store consoles.
- **Scale Concurrency**: Simulates 60+ simultaneous orders with 0 ID or invoice collisions.
- **Input Sanitization**: Tests XSS, script injection, and SQL injection payloads.
- **Backend APIs**: Validates `/api/health` and `/api/orders` endpoints.
- **Data Privacy Compliance**: Verifies zero customer PII written to client `localStorage`.

### Run Strict TypeScript Check
```bash
npx tsc --noEmit
```

---

## 📄 License

This project is open-source and licensed under the [MIT License](./LICENSE).
