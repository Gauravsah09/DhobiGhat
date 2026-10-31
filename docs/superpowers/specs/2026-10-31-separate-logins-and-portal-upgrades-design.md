# DhobiGhat Multi-Portal Logins, Security Hardening & Workflow Upgrades Design Spec

## 1. Intent & Context
DhobiGhat's authentication and operational interfaces require complete segregation across Customer, Store Staff, and Admin HQ personas. 4-digit numeric PINs for staff and administration can be guessed, presenting an unacceptable vulnerability. This project replaces PIN authentication with multi-round salted+hashed passwords, redesigns login portals around specific user personas, eliminates visual order movement flickering on the store floor, provides a dedicated GST Tax Invoice generator for customers, and activates all non-rendered tabs in the Admin HQ command console.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Eliminate PINs**: Completely remove staff and admin login PINs from data models, state, and UI. Replace with secure password authentication using multi-round salted hashing (`hashPassword` / `verifyPassword` in `src/lib/security.ts`). (Note: Handover delivery PIN for customer orders remains strictly as an order verification code).
- **Dedicated Login Portals**:
  - `/customer/login`: Dedicated, frictionless Sign In & Sign Up with minimal navigation.
  - `/store/login`: 4 prominent interactive role tiles (Store Manager, Store Operator, Rider, Floor Worker) that prompt for that role's password.
  - `/admin/login`: Executive Superadmin aesthetic with master credentials and high-security visual cues.
- **Zero-Flicker Order Movement**: Smooth out stage transitions in `/store` by preventing abrupt list drop-outs and layout collapses.
- **Proper GST Tax Invoice**: Replace the customer orders `window.print()` with a modular, standards-compliant GST Tax Invoice (HSN/SAC 999719, 18% CGST/SGST itemization, company GSTIN, clean printable/downloadable layout).
- **Full Admin Tab Implementation**: Implement functional interfaces for the two unrendered tabs in `/admin`: `slots_capacity` (quotas, blackout dates, dispatch capacity) and `reports` (TAT latency, revenue breakdown, rider performance).

### Non-Goals
- Adding external heavy binary PDF libraries (e.g. `jspdf`, `pdfmake`); native CSS `@media print` isolation delivers identical fidelity with zero runtime weight.
- Splitting `LaundryContext` into three separate context providers; unified in-memory state provides instant client transitions.

### Anti-Goals
- Breaking any of the 13 automated tests in `tests/`.
- Introducing any unconfirmed `git push` commands.

---

## 3. Approaches Considered & Selected

### Approach A: Integrated Context-Driven Architecture & Native Components (Selected)
- **Security**: Upgrade `StoreStaff` and `AdminUser` interfaces to use `passwordHash`. Update `loginStaff(role, password)` and `loginAdmin(identifier, password)` in `LaundryContext`.
- **Store Login**: 4 role cards that highlight the staff member and show a password prompt upon selection.
- **Store Flickering**: Introduce an in-transition state cache that keeps the moving order gracefully fading into its new column or animating rather than disappearing abruptly.
- **Customer GST Invoice**: Create `<GstTaxInvoiceModal />` with full legal Indian GST formatting (SAC 999719, 9% CGST + 9% SGST, QR, GSTIN).
- **Admin Tabs**: Build functional components for `SlotsCapacityView` and `ReportsTatView`.
- **Trade-offs**: Fastest execution, 0 new dependencies, full test suite compatibility.

### Approach B: Heavy External Libraries & Sub-Route Segregation (Rejected)
- Adds heavy binary PDF dependencies (150KB+ bundle increase) and splits unified context into three disjoint contexts, increasing regression risk.

---

## 4. Architectural & Implementation Details

### A. Data Models & Hashing (`src/types/index.ts`, `src/lib/security.ts`, `src/lib/initial-data.ts`)
1. **Interface Updates**:
   - `StoreStaff`: Deprecate/remove `pin: string;`. Add `passwordHash: string;`.
   - `StaffSession`: Update `loginWithPin` to `loginWithPassword: (role: StoreOperatorRole, password: string, branchId?: string, shift?: 'morning' | 'evening') => boolean`.
   - `AdminSession`: Ensure `loginAdmin: (identifier: string, password: string) => boolean` validates against salted hashes.
2. **Seed Data (`initial-data.ts`)**:
   - Seed default secure passwords for staff:
     - Store Manager (Vikas Patil): `Manager@2026!` (hashed)
     - Store Operator (Ramesh Sharma): `Operator@2026!` (hashed)
     - Worker (Sunil Gowda): `Worker@2026!` (hashed)
     - Rider (Mahesh Rider): `Rider@2026!` (hashed)
   - Seed default password for Superadmin: `DhobiGhat@Admin2026!` (hashed).

### B. Customer Portal Upgrades (`src/app/customer/login/page.tsx`, `src/components/customer/CustomerNavbar.tsx`, `src/components/customer/GstInvoiceModal.tsx`)
1. **Dedicated Login (`/customer/login`)**:
   - Fast toggle between **Sign In** and **Sign Up**.
   - Input: Mobile Number or Email + Password.
   - Minimalist layout focused on fast authentication with automatic redirect back to previous order or `/customer`.
2. **Minimal Navigation (`CustomerNavbar.tsx`)**:
   - Clean, uncluttered header containing only:
     - Brand Logo
     - **Book Pickup**
     - **My Orders & Invoices**
     - **Pricing**
     - Profile / Logout toggle
3. **GST Tax Invoice Generator (`GstInvoiceModal.tsx`)**:
   - Standard Indian GST Tax Invoice format:
     - Header: DhobiGhat Logo, Legal Business Name, Registered Address, GSTIN (`29AABCU9603R1ZM`), State Code (29 - Karnataka).
     - Customer Details: Name, Phone, Delivery Address, Reverse Charge (No).
     - Invoice Details: Invoice Number (`IND-2401`), Invoice Date, Order ID.
     - Taxable Table: Item Description, SAC Code `999719` (Laundry & Dry Cleaning Services), Quantity, Unit Rate, Taxable Amount.
     - Summary Calculation: Total Taxable Value, CGST @ 9%, SGST @ 9%, Grand Total in Figures and Words.
     - Verification: QR Code + Digital Signature placeholder.
     - Action: One-click print button strictly targeting invoice print styles (`@media print` clean sheet).

### C. Store Operations Portal Upgrades (`src/app/store/login/page.tsx`, `src/app/store/page.tsx`)
1. **4 Role Tiles Login (`/store/login`)**:
   - 4 large interactive tiles:
     1. **Store Manager** (Full Operational Control & Cash Audits)
     2. **Store Operator** (Counter POS & Dispatch Queue)
     3. **Logistics Rider** (Pickup Bag Weighing & Doorstep Delivery)
     4. **Floor Worker** (Sorting, Washing, Drying, Ironing & QC Pack)
   - Selecting a tile activates the card with role-specific iconography, automatically sets the target role, and prompts for the secure staff password.
2. **Flickering Fix in Order Movement**:
   - In `src/app/store/page.tsx`, orders moving between stages are tracked in a transient transition map (`transitioningOrders`).
   - When an order transitions, apply a smooth CSS exit transition (opacity & transform) rather than abrupt array unmounting.
   - Ensure list keys are strictly order IDs (`key={ord.id}`) so React diffing does not trigger layout thrashing.

### D. Admin HQ Command Console Upgrades (`src/app/admin/login/page.tsx`, `src/app/admin/page.tsx`)
1. **Executive Superadmin Aesthetic (`/admin/login`)**:
   - Elevated dark command cockpit styling with subtle glowing borders, security shield badge, and master authentication feedback.
2. **Full Functional Tabs**:
   - **`slots_capacity`**:
     - Visual capacity dials for Morning (07:00 AM - 10:00 AM) and Evening (04:00 PM - 07:00 PM) slots.
     - Real-time order load vs daily capacity in kg.
     - Quick toggles to blackout slots for maintenance or rain emergencies.
   - **`reports`**:
     - Turnaround Time (TAT) analytics (Intake to Ready avg hours).
     - Garment service breakdown chart (Dry Clean vs Wash & Fold vs Steam Iron).
     - Channel revenue matrix (Online Doorstep vs Walk-in Counter).
     - Rider dispatch leaderboard with on-time delivery percentages.

---

## 5. Verification Plan
- **Security Suite**: Run `node --test tests/**/*.test.mjs` ensuring all 13 existing tests pass.
- **New Unit Tests**:
  - `tests/portal-auth.test.mjs`: Verify password hashing and rejection of legacy PINs for staff and admin.
  - `tests/gst-invoice.test.mjs`: Verify GSTIN, SAC 999719, and 18% tax calculation logic.
- **Production Build**: Verify `npm run build` succeeds with 0 lint/TypeScript errors.
- **Docker Refresh**: Ensure `docker compose up -d --build` runs and serves healthy on port 3000.
