# DhobiGhat Multi-Portal Logins, Security Hardening & Workflow Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Segregate and redesign login experiences across Customer, Store, and Admin portals; eliminate staff and admin PINs in favor of salted+hashed passwords; replace raw page printing with a compliant GST Tax Invoice; eliminate store order movement flickering; and fully activate all non-rendered Admin tabs (`slots_capacity` and `reports`).

**Architecture:** Upgrade data types and `LaundryContext` authentication methods to validate salted password hashes natively via `src/lib/security.ts`. Build dedicated role-specific login views for Customer (`/customer/login` with minimal nav), Store (`/store/login` with 4 interactive role tiles), and Admin (`/admin/login` with superadmin aesthetic). Implement `<GstInvoiceModal />` with SAC 999719 and dual 9% tax breakdown, and render interactive dashboards for Slots & Capacity and TAT Reports in `/admin`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Lucide React, Node.js Native Test Runner (`node --test`).

**Spec:** [docs/superpowers/specs/2026-10-31-separate-logins-and-portal-upgrades-design.md](file:///d:/Business/DhobiGhat/docs/superpowers/specs/2026-10-31-separate-logins-and-portal-upgrades-design.md)

## Global Constraints

- Never execute `git push` without explicit user permission.
- Zero new external runtime dependencies.
- Completely remove PINs for staff and admin authentication; use salted+hashed passwords.
- Maintain customer order handover delivery PIN strictly as a delivery verification code.
- Comply with Indian GST tax invoice rules (SAC code `999719`, 18% GST split into 9% CGST + 9% SGST, GSTIN `29AABCU9603R1ZM`).
- All 13 core tests in `tests/` must remain passing after every task.

## Review Focus

- **Password Verification Security:** Attempting login with legacy 4-digit PINs or empty strings must be firmly rejected.
- **Invoice Print Isolation:** Printing a customer invoice must output only the legal tax invoice sheet, not the browser navbars, action buttons, or sidebar elements.
- **Store Role Switching:** Selecting any of the 4 role tiles on `/store/login` must strictly isolate permissions to that persona (e.g. Worker cannot access Walk-in POS or Cash Drawer).
- **Zero Flickering During Transitions:** Moving an order between stages in `/store` must not cause scroll jumping, layout thrashing, or abrupt visual disappears.
- **Admin Tabs Completeness:** Clicking on `Slots & Capacity` and `Reports & TAT` in `/admin` must display live interactive operational metrics, not empty screens.

---

### Task 1: Security Model & Salted Password Authentication Engine

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/initial-data.ts`
- Modify: `src/context/LaundryContext.tsx`
- Create: `tests/portal-auth.test.mjs`

**Interfaces:**
- Consumes: `hashPassword`, `verifyPassword` from `src/lib/security.ts`.
- Produces: `StoreStaff.passwordHash`, `StaffSession.loginWithPassword(role, password, branchId, shift)`, `AdminSession.loginAdmin(identifier, password)`.

- [ ] **Step 1: Write the failing portal auth test**

```javascript
// tests/portal-auth.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/lib/security.ts';
import { initialStaffList } from '../src/lib/initial-data.ts';

test('Security Hardening: Staff profiles use passwordHash and lack plaintext PINs', () => {
  for (const staff of initialStaffList) {
    assert.ok(staff.passwordHash, `Staff ${staff.name} missing passwordHash`);
    assert.strictEqual('pin' in staff, false, `Staff ${staff.name} must not contain plaintext PIN`);
  }
});

test('Password Authentication: Validates secure passwords and rejects numeric PINs', () => {
  const managerHash = hashPassword('Manager@2026!');
  assert.strictEqual(verifyPassword('Manager@2026!', managerHash), true);
  assert.strictEqual(verifyPassword('9999', managerHash), false);
  assert.strictEqual(verifyPassword('1234', managerHash), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/portal-auth.test.mjs`
Expected: FAIL (types and initialStaffList still contain PIN and lack passwordHash)

- [ ] **Step 3: Update `src/types/index.ts`, `src/lib/initial-data.ts`, and `src/context/LaundryContext.tsx`**

1. In `src/types/index.ts`:
   - In `StoreStaff`: Remove `pin: string;` and add `passwordHash: string;`.
   - In `StaffSession`: Replace `loginWithPin` with `loginWithPassword: (role: StoreOperatorRole, password: string, branchId?: string, shift?: 'morning' | 'evening') => boolean`.
2. In `src/lib/initial-data.ts`:
   - Compute salted hashes for all default staff (`Manager@2026!`, `Operator@2026!`, `Worker@2026!`, `Rider@2026!`).
   - Remove `pin` fields from `initialStaffList`.
3. In `src/context/LaundryContext.tsx`:
   - Update `loginStaff` / `loginWithPassword` to compare `verifyPassword(password, matchedStaff.passwordHash)`.
   - Update `loginAdmin` to verify against admin `passwordHash`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/portal-auth.test.mjs && npm test`
Expected: PASS (all 14 tests pass)

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/lib/initial-data.ts src/context/LaundryContext.tsx tests/portal-auth.test.mjs
git commit -m "feat(security): replace staff and admin PINs with salted password authentication"
```

---

### Task 2: Customer Portal: Dedicated Login & Minimal Navigation

**Files:**
- Create: `src/app/customer/login/page.tsx`
- Modify: `src/components/customer/CustomerNavbar.tsx`
- Create: `tests/customer-portal.test.mjs`

**Interfaces:**
- Consumes: `CustomerNavbar`, `useLaundry().customerSession`.
- Produces: Dedicated `/customer/login` page with Sign In & Sign Up tabbed view; stripped-down navigation.

- [ ] **Step 1: Write the failing Customer Portal test**

```javascript
// tests/customer-portal.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Customer Login: Page exports dedicated Sign In and Sign Up form with password verification', () => {
  const content = fs.readFileSync('src/app/customer/login/page.tsx', 'utf8');
  assert.match(content, /Sign In|Sign Up/i, 'Must support Sign In and Sign Up');
  assert.match(content, /loginWithPassword/i, 'Must use loginWithPassword');
  assert.match(content, /signupCustomer/i, 'Must use signupCustomer');
});

test('Customer Navigation: Navbar provides minimal essential links', () => {
  const content = fs.readFileSync('src/components/customer/CustomerNavbar.tsx', 'utf8');
  assert.match(content, /\/customer\/book/, 'Must link to book');
  assert.match(content, /\/customer\/orders/, 'Must link to orders');
  assert.match(content, /\/customer\/rates/, 'Must link to rates');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/customer-portal.test.mjs`
Expected: FAIL (`src/app/customer/login/page.tsx` does not exist)

- [ ] **Step 3: Implement `/customer/login/page.tsx` and streamline `CustomerNavbar.tsx`**

1. Create `src/app/customer/login/page.tsx` with a high-conversion, responsive card containing clean tabs for Sign In and Sign Up, phone/email input, password input with show/hide toggle, and instant error feedback.
2. In `src/components/customer/CustomerNavbar.tsx`:
   - Keep only essential links: **Book Pickup**, **My Orders & Invoices**, **Rate Card**, and User Profile / Sign In button.
   - Clean up excessive promotional links to ensure minimal, distraction-free navigation.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/customer-portal.test.mjs && npm test`
Expected: PASS (all 15 tests pass)

- [ ] **Step 5: Commit**

```bash
git add src/app/customer/login/page.tsx src/components/customer/CustomerNavbar.tsx tests/customer-portal.test.mjs
git commit -m "feat(customer): add dedicated customer login page and minimal navigation bar"
```

---

### Task 3: Customer Portal: Compliant GST Tax Invoice Generator

**Files:**
- Create: `src/components/customer/GstInvoiceModal.tsx`
- Modify: `src/app/customer/orders/page.tsx`
- Create: `tests/gst-invoice.test.mjs`

**Interfaces:**
- Consumes: `Order`, `ShopSettings` from `LaundryContext`.
- Produces: `<GstInvoiceModal order={selectedOrder} onClose={...} />` with isolated `@media print` rules.

- [ ] **Step 1: Write the failing GST Invoice test**

```javascript
// tests/gst-invoice.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('GST Invoice: Component implements legal Indian GST tax invoice specifications', () => {
  const code = fs.readFileSync('src/components/customer/GstInvoiceModal.tsx', 'utf8');
  assert.match(code, /999719/, 'Must include Laundry SAC Code 999719');
  assert.match(code, /CGST/i, 'Must itemize CGST (9%)');
  assert.match(code, /SGST/i, 'Must itemize SGST (9%)');
  assert.match(code, /Taxable Value|Taxable Amount/i, 'Must display taxable value');
  assert.match(code, /GSTIN/i, 'Must display company GSTIN');
});

test('Customer Orders: Triggers dedicated GST Invoice modal rather than raw window.print()', () => {
  const ordersPage = fs.readFileSync('src/app/customer/orders/page.tsx', 'utf8');
  assert.match(ordersPage, /GstInvoiceModal/, 'Orders page must import GstInvoiceModal');
  assert.doesNotMatch(ordersPage, /onClick=\{\(\)\s*=>\s*window\.print\(\)\}/, 'Must not use raw window.print() on page');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/gst-invoice.test.mjs`
Expected: FAIL (`GstInvoiceModal.tsx` does not exist)

- [ ] **Step 3: Implement `GstInvoiceModal.tsx` and integrate into `orders/page.tsx`**

1. Build `src/components/customer/GstInvoiceModal.tsx`:
   - Professional Indian GST Tax Invoice layout.
   - Header with DhobiGhat details, registered state code (29 - Karnataka), and GSTIN (`29AABCU9603R1ZM`).
   - Customer bill-to details and order date.
   - Line items table with SAC `999719`, item description, qty, unit rate, and total.
   - Tax summary breakdown: Subtotal, CGST 9%, SGST 9%, and Grand Total.
   - Digital verification badge and print button styled with `@media print { body * { visibility: hidden; } #gst-invoice-sheet, #gst-invoice-sheet * { visibility: visible; } }`.
2. In `src/app/customer/orders/page.tsx`:
   - Replace `<button onClick={() => window.print()}>` with a button setting `activeInvoiceOrder(ord)`.
   - Render `<GstInvoiceModal order={activeInvoiceOrder} onClose={() => setActiveInvoiceOrder(null)} />`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/gst-invoice.test.mjs && npm test`
Expected: PASS (all 16 tests pass)

- [ ] **Step 5: Commit**

```bash
git add src/components/customer/GstInvoiceModal.tsx src/app/customer/orders/page.tsx tests/gst-invoice.test.mjs
git commit -m "feat(invoice): implement legal GST Tax Invoice modal and replace raw window.print"
```

---

### Task 4: Store Operations: 4-Tile Role Login & Zero-Flicker Order Movement

**Files:**
- Modify: `src/app/store/login/page.tsx`
- Modify: `src/app/store/page.tsx`
- Create: `tests/store-portal.test.mjs`

**Interfaces:**
- Consumes: `StaffSession.loginWithPassword`, `StoreOperatorRole`.
- Produces: 4-tile role login interface; zero-flicker order movement pipeline.

- [ ] **Step 1: Write the failing Store Portal test**

```javascript
// tests/store-portal.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Store Login: Renders 4 prominent role tiles and password input', () => {
  const code = fs.readFileSync('src/app/store/login/page.tsx', 'utf8');
  assert.match(code, /Store Manager/i, 'Must have Store Manager tile');
  assert.match(code, /Store Operator/i, 'Must have Store Operator tile');
  assert.match(code, /Rider/i, 'Must have Rider tile');
  assert.match(code, /Worker/i, 'Must have Worker tile');
  assert.match(code, /type=["']password["']/, 'Must require password input');
  assert.doesNotMatch(code, /4-digit shift PIN/i, 'Must remove references to 4-digit PIN');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/store-portal.test.mjs`
Expected: FAIL (store login currently mentions 4-digit shift PIN and lacks 4 dedicated role tiles)

- [ ] **Step 3: Redesign `src/app/store/login/page.tsx` and eliminate order movement flickering in `src/app/store/page.tsx`**

1. In `src/app/store/login/page.tsx`:
   - Create a clean 4-tile grid for the 4 canonical roles:
     - Tile 1: **Store Manager** (Vikas Patil - Full access)
     - Tile 2: **Store Operator** (Ramesh Sharma - Counter & Dispatch)
     - Tile 3: **Logistics Rider** (Mahesh Rider - Collections & Deliveries)
     - Tile 4: **Floor Worker** (Sunil Gowda - Sorting, Wash, Press, QC)
   - Clicking a tile selects that role, displays their avatar/name, and unlocks the password entry form calling `loginWithPassword(selectedRole, password, selectedBranch, selectedShift)`.
2. In `src/app/store/page.tsx`:
   - Fix order movement flickering:
     - Wrap order card transitions with smooth CSS animations (`transition-all duration-300 ease-in-out`).
     - Introduce an in-transition tracker so that when an order advances to another stage, it performs a smooth exit rather than an abrupt visual vanish.
     - Prevent list layout thrashing by maintaining stable element keys (`key={ord.id}`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/store-portal.test.mjs && npm test`
Expected: PASS (all 17 tests pass)

- [ ] **Step 5: Commit**

```bash
git add src/app/store/login/page.tsx src/app/store/page.tsx tests/store-portal.test.mjs
git commit -m "feat(store): implement 4-tile role login and zero-flicker order movement"
```

---

### Task 5: Admin HQ: Superadmin Login Cockpit & Missing Tab Implementations

**Files:**
- Modify: `src/app/admin/login/page.tsx`
- Modify: `src/app/admin/page.tsx`
- Create: `tests/admin-portal.test.mjs`

**Interfaces:**
- Consumes: `useLaundry().adminSession`, `orders`, `branches`, `settings`.
- Produces: Executive Superadmin login aesthetic; interactive views for `slots_capacity` and `reports`.

- [ ] **Step 1: Write the failing Admin Portal test**

```javascript
// tests/admin-portal.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Admin Console: Renders full views for Slots & Capacity and Reports tabs', () => {
  const code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
  assert.match(code, /activeTab === 'slots_capacity'/, 'Must render slots_capacity tab view');
  assert.match(code, /activeTab === 'reports'/, 'Must render reports tab view');
  assert.match(code, /Turnaround Time|TAT/i, 'Reports must include TAT metrics');
  assert.match(code, /Morning|Evening|Capacity/i, 'Slots must include slot capacity controls');
});

test('Admin Login: High-privilege Superadmin styling and password validation', () => {
  const code = fs.readFileSync('src/app/admin/login/page.tsx', 'utf8');
  assert.match(code, /Superadmin|Executive/i, 'Must convey superadmin authority');
  assert.match(code, /type=["']password["']/, 'Must require secure password');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/admin-portal.test.mjs`
Expected: FAIL (missing `slots_capacity` and `reports` view rendering)

- [ ] **Step 3: Update `src/app/admin/login/page.tsx` and `src/app/admin/page.tsx`**

1. In `src/app/admin/login/page.tsx`:
   - Design an executive Superadmin cockpit aesthetic with dark gold/emerald security badges, master credentials authentication, and password validation.
2. In `src/app/admin/page.tsx`:
   - Implement `activeTab === 'slots_capacity'`:
     - Visual dials for Morning (07:00 AM - 10:00 AM) and Evening (04:00 PM - 07:00 PM) booking limits.
     - Hub daily capacity thresholds (kg) and active loads.
     - Emergency slot blackout and surge threshold toggles.
   - Implement `activeTab === 'reports'`:
     - Turnaround Time (TAT) analytics (average duration from intake to QC packed).
     - Service share breakdown (Dry Cleaning, Premium Wash, Steam Press).
     - Channel revenue split (Online Doorstep vs Walk-in Counter).
     - Rider on-time delivery leaderboard.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/admin-portal.test.mjs && npm test`
Expected: PASS (all 18 tests pass)

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/login/page.tsx src/app/admin/page.tsx tests/admin-portal.test.mjs
git commit -m "feat(admin): build superadmin login cockpit and implement slots and reports tabs"
```

---

### Task 6: Full Verification, Production Build & Docker Container Refresh

**Files:**
- Test: all test suites (`npm test`)
- Build: Next.js standalone build (`npm run build`)
- Deploy: Refresh Docker container (`docker compose up -d --build`)

- [ ] **Step 1: Run complete automated test suite**

Run: `npm test`
Expected: PASS (all 18+ tests passing)

- [ ] **Step 2: Validate production bundle build**

Run: `npm run build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 3: Rebuild and deploy to local Docker container**

Run: `docker compose up -d --build`
Expected: Container `laundry-modern-pos` running and healthy.

- [ ] **Step 4: Verify live endpoint responsiveness**

Run: `curl -I http://localhost:3000`
Expected: `HTTP/1.1 200 OK`
