# DhobiGhat "No Monkey" Warm Editorial Craft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "No Monkey" warm editorial craft design system across DhobiGhat's entire web application, supporting an instant light (warm parchment)/dark (deep espresso) theme toggle, monospace precision typography, and glowing status lozenges, while preserving print invoice styling and all 13 core tests.

**Architecture:** Implement dual-theme CSS variables in `globals.css` with a zero-FOUC inline script in `layout.tsx` and an accessible `ThemeToggle.tsx` component. Build modular UI primitives (tactile gradient buttons, hairline cards, pulsing status chips) and refresh all four surfaces (Landing, Customer Portal, Store POS, Admin HQ) without adding external runtime dependencies.

**Tech Stack:** Next.js 16.4.3 (App Router, Turbopack), React 19.3.0, Tailwind CSS v4, Lucide React, Node.js Test Runner.

**Spec:** [docs/superpowers/specs/2026-10-28-nomonkey-editorial-craft-design.md](file:///d:/Business/DhobiGhat/docs/superpowers/specs/2026-10-28-nomonkey-editorial-craft-design.md)

## Global Constraints

- Never execute `git push` without explicit user permission.
- Zero new npm dependencies; use native Tailwind CSS v4 and CSS variables.
- Maintain WCAG AA contrast (minimum 4.5:1 for body copy in both light and dark themes).
- Preserve `@media print` black-ink on pure white paper styling for POS receipt printing.
- No raw emojis; strictly use Lucide React SVG icons.
- All 13 existing security and logistics tests in `tests/` must pass after every task.

## Review Focus

- **Theme Toggle Flash (FOUC):** Initial page load must not flash light mode if user previously saved dark mode in `localStorage`.
- **Print Contrast:** Printing an invoice from dark mode must not output dark backgrounds or illegible white text on physical paper.
- **Table Overflow on Mobile:** Monospace numbers and garment tags on Store POS and Admin HQ must not trigger horizontal scrollbars on 375px mobile screens.
- **Button Hover Consistency:** Tactile dark gradient buttons must maintain accessible focus rings in both light and dark modes.
- **Order Stage Sync:** Status lozenges across Customer and Store views must match the state machine transitions (Pending → In-Wash → Ready → Delivered).

---

### Task 1: Design Tokens, Dual-Theme CSS Engine & Theme Toggle Component

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/components/ThemeToggle.tsx`
- Test: `tests/editorial-theme.test.mjs`

**Interfaces:**
- Consumes: Tailwind CSS `@import "tailwindcss";`, Lucide React `Sun`, `Moon`.
- Produces: CSS variables (`--c-canvas`, `--c-canvas-surface`, `--c-ink`, `--c-border`, `--c-accent`, etc.) on `:root` and `.dark`, and exported `<ThemeToggle />` component.

- [ ] **Step 1: Write the failing theme test**

```javascript
// tests/editorial-theme.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Theme Tokens: globals.css defines both light (:root) and dark (.dark) CSS custom properties', () => {
  const css = fs.readFileSync('src/app/globals.css', 'utf8');
  assert.match(css, /--c-canvas:\s*#fffbf2/i, 'Missing light canvas #fffbf2');
  assert.match(css, /--c-canvas:\s*#0c0a07/i, 'Missing dark canvas #0c0a07');
  assert.match(css, /--c-accent:\s*#d97706/i, 'Missing light accent #d97706');
  assert.match(css, /--c-accent:\s*#f59e0b/i, 'Missing dark accent #f59e0b');
});

test('Theme Toggle Component: ThemeToggle exports a functional client switch using dhobighat-theme', () => {
  const file = fs.readFileSync('src/components/ThemeToggle.tsx', 'utf8');
  assert.match(file, /dhobighat-theme/, 'ThemeToggle must use localStorage key dhobighat-theme');
  assert.match(file, /Sun|Moon/, 'ThemeToggle must render Sun/Moon icons');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/editorial-theme.test.mjs`
Expected: FAIL (missing tokens and ThemeToggle file)

- [ ] **Step 3: Implement tokens in `src/app/globals.css` and `ThemeToggle.tsx`**

1. In `src/app/globals.css`, add `:root` and `.dark` variables as specified in the design doc, update body styling with `font-family: var(--font-mono, ui-monospace, ...)` and `background: var(--c-canvas); color: var(--c-ink)`.
2. In `src/components/ThemeToggle.tsx`, build a client component reading/writing `localStorage.getItem('dhobighat-theme')`, toggling the `dark` class on `document.documentElement`, and displaying Sun/Moon icons.
3. In `src/app/layout.tsx`, insert a lightweight pre-hydration `<script>` in `<head>` to prevent FOUC.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/editorial-theme.test.mjs && npm test`
Expected: PASS (all 14 tests pass)

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/components/ThemeToggle.tsx tests/editorial-theme.test.mjs
git commit -m "feat(theme): add warm editorial dual-theme tokens and ThemeToggle"
```

---

### Task 2: Core Primitives (Buttons, Cards, and Pulsing Status Lozenges)

**Files:**
- Create: `src/components/editorial/Primitives.tsx`
- Test: `tests/editorial-primitives.test.mjs`

**Interfaces:**
- Consumes: Theme tokens from `globals.css`, Lucide React icons.
- Produces: Exported `<EditorialButton>`, `<EditorialCard>`, `<StatusLozenge status="pending|process|ready|delivered" />`.

- [ ] **Step 1: Write the failing primitives test**

```javascript
// tests/editorial-primitives.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Editorial Primitives: components define tactile buttons, hairline cards, and pulsing status dots', () => {
  const code = fs.readFileSync('src/components/editorial/Primitives.tsx', 'utf8');
  assert.match(code, /export function EditorialButton/, 'Missing EditorialButton');
  assert.match(code, /export function EditorialCard/, 'Missing EditorialCard');
  assert.match(code, /export function StatusLozenge/, 'Missing StatusLozenge');
  assert.match(code, /rounded-full/, 'Status lozenge must be pill-shaped');
  assert.match(code, /animate-pulse|box-shadow|ring/, 'Status lozenge must have glowing indicator dot');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/editorial-primitives.test.mjs`
Expected: FAIL (missing `src/components/editorial/Primitives.tsx`)

- [ ] **Step 3: Implement primitives in `src/components/editorial/Primitives.tsx`**

1. `EditorialButton`: Variants `'primary'` (tactile gradient `from-[#35332e] to-[#1b1a17]`), `'accent'` (amber-600), `'ghost'` (hairline border), and `'danger'` (crimson).
2. `EditorialCard`: `bg-[var(--c-canvas-surface)] border border-[var(--c-border)] rounded-2xl p-6`.
3. `StatusLozenge`: Pill container with monospace stage label and glowing dot with color mapping:
   - `pending` -> amber
   - `intake` / `washing` / `ironing` -> cyan
   - `ready` / `delivered` -> emerald
   - `cancelled` -> rose

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/editorial-primitives.test.mjs && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/editorial/Primitives.tsx tests/editorial-primitives.test.mjs
git commit -m "feat(ui): create warm editorial button, card, and status lozenge primitives"
```

---

### Task 3: Root Landing Page Gateway (`/`)

**Files:**
- Modify: `src/app/page.tsx`
- Test: `tests/landing-page.test.mjs`

**Interfaces:**
- Consumes: `<ThemeToggle>`, `<EditorialButton>`, `<EditorialCard>`, `lucide-react` (`Shirt`, `Store`, `Sliders`, `ShieldCheck`, `ArrowRight`).
- Produces: Root operational gateway page with direct navigation to `/customer`, `/store`, and `/admin`.

- [ ] **Step 1: Write the failing landing test**

```javascript
// tests/landing-page.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Landing Page: renders editorial industrial layout with portal links and theme toggle', () => {
  const code = fs.readFileSync('src/app/page.tsx', 'utf8');
  assert.match(code, /ThemeToggle/, 'Landing page must include ThemeToggle');
  assert.match(code, /href="\/customer"/, 'Landing page must link to /customer');
  assert.match(code, /href="\/store"/, 'Landing page must link to /store');
  assert.match(code, /href="\/admin"/, 'Landing page must link to /admin');
  assert.doesNotMatch(code, /[\u{1F300}-\u{1F9FF}]/u, 'Zero raw emojis permitted');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/landing-page.test.mjs`
Expected: FAIL (missing `ThemeToggle` import on landing)

- [ ] **Step 3: Implement redesigned `src/app/page.tsx`**

1. Build hero section with uppercase status kicker: `[ SYSTEM STATUS: ALL PROCESSING HUBS OPERATIONAL ]`.
2. Title: **DhobiGhat — Precision Garment Care OS**.
3. Three large gateway cards linking to Customer Lounge, Store Counter POS, and Operations Admin HQ.
4. Operational metrics footer: 24h Express Turnaround, Organic Hydrocarbon Solvent standard, 99.98% On-Time Dispatch.
5. Include `ThemeToggle` in the top header.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/landing-page.test.mjs && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx tests/landing-page.test.mjs
git commit -m "feat(landing): redesign root gateway in warm editorial technical style"
```

---

### Task 4: Customer Portal Redesign (`/customer/*`)

**Files:**
- Modify: `src/components/customer/CustomerNavbar.tsx`
- Modify: `src/app/customer/page.tsx`
- Modify: `src/app/customer/rates/page.tsx`
- Modify: `src/app/customer/book/page.tsx`
- Modify: `src/app/customer/orders/page.tsx`
- Modify: `src/app/track/page.tsx`
- Test: `tests/customer-portal.test.mjs`

**Interfaces:**
- Consumes: `<ThemeToggle>`, `<StatusLozenge>`, `<EditorialButton>`, customer order data.
- Produces: Artisanal customer concierge with live rate tables, order placement form, and tracking timeline.

- [ ] **Step 1: Write the failing customer portal test**

```javascript
// tests/customer-portal.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Customer Portal: CustomerNavbar includes ThemeToggle and routes to rates, book, and orders', () => {
  const nav = fs.readFileSync('src/components/customer/CustomerNavbar.tsx', 'utf8');
  assert.match(nav, /ThemeToggle/, 'CustomerNavbar must include ThemeToggle');
  assert.match(nav, /\/customer\/rates/, 'Navbar must link to rates');
  assert.match(nav, /\/customer\/book/, 'Navbar must link to book');
  assert.match(nav, /\/customer\/orders/, 'Navbar must link to orders');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/customer-portal.test.mjs`
Expected: FAIL (ThemeToggle not yet in CustomerNavbar)

- [ ] **Step 3: Implement Customer Portal updates**

1. Update `CustomerNavbar.tsx` with warm hairline styling and embedded `<ThemeToggle />`.
2. Update `/customer/page.tsx` with boutique welcome hero, quick action cards, and active order shortcuts.
3. Update `/customer/rates/page.tsx` with clean categorical tables (Wash & Fold, Steam Press, Dry Cleaning, Silk Care) with unit prices and turnaround tags.
4. Update `/customer/book/page.tsx` with step-by-step form cards, slot pickers, and service item selections.
5. Update `/customer/orders/page.tsx` and `/track/page.tsx` with live timeline tracking using `<StatusLozenge>`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/customer-portal.test.mjs && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/customer/CustomerNavbar.tsx src/app/customer/ tests/customer-portal.test.mjs src/app/track/page.tsx
git commit -m "feat(customer): apply warm editorial craft design to customer portal"
```

---

### Task 5: Store POS Counter Terminal & Print Receipt Formatting (`/store`)

**Files:**
- Modify: `src/app/store/page.tsx`
- Modify: `src/app/globals.css` (ensure print rules are bulletproof)
- Test: `tests/store-pos.test.mjs`

**Interfaces:**
- Consumes: `<ThemeToggle>`, `<StatusLozenge>`, `<EditorialButton>`, walk-in order state.
- Produces: Fast counter intake register, garment piece incrementer, and thermal print invoice generator.

- [ ] **Step 1: Write the failing Store POS test**

```javascript
// tests/store-pos.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Store POS: renders workshop terminal layout with print invoice preservation', () => {
  const code = fs.readFileSync('src/app/store/page.tsx', 'utf8');
  assert.match(code, /ThemeToggle/, 'Store POS header must include ThemeToggle');
  assert.match(code, /no-print/, 'Must use no-print utility for interactive controls');
  assert.match(code, /print-only/, 'Must use print-only utility for invoice paper receipt');
  assert.match(code, /window\.print/, 'Must trigger native print dialog');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/store-pos.test.mjs`
Expected: FAIL (missing `ThemeToggle` in store/page.tsx)

- [ ] **Step 3: Implement Store POS updates**

1. In `src/app/store/page.tsx`, redesign header with store status badge and `<ThemeToggle />`.
2. Format garment category selection into an industrial high-contrast counter grid with instant increment buttons.
3. Clean up the customer lookup / phone entry panel with autofocus and clear validation.
4. Ensure the receipt print container uses `@media print` rules ensuring pure white paper, black text, and crisp borders regardless of whether the terminal is in light or dark mode.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/store-pos.test.mjs && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/store/page.tsx tests/store-pos.test.mjs
git commit -m "feat(pos): update store counter terminal with editorial layout and verified print receipt"
```

---

### Task 6: Admin HQ Operations Console (`/admin`)

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/components/StatsCards.tsx`
- Test: `tests/admin-hq.test.mjs`

**Interfaces:**
- Consumes: `<ThemeToggle>`, `<StatusLozenge>`, `<EditorialCard>`, `StatsCards`, shift closing logic.
- Produces: Factory pipeline control room, dispatch queue, and cashier drawer variance tool.

- [ ] **Step 1: Write the failing Admin HQ test**

```javascript
// tests/admin-hq.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Admin HQ: console includes ThemeToggle, telemetry stats, and order stage management', () => {
  const code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
  assert.match(code, /ThemeToggle/, 'Admin HQ header must include ThemeToggle');
  assert.match(code, /Shift|Cash|Drawer/i, 'Admin HQ must include shift reconciliation controls');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/admin-hq.test.mjs`
Expected: FAIL (missing ThemeToggle in admin/page.tsx)

- [ ] **Step 3: Implement Admin HQ & StatsCards updates**

1. Update `src/components/StatsCards.tsx` with monospace metric cards, hairline dividers, and positive/negative trend pills.
2. In `src/app/admin/page.tsx`, implement the operations control bar with `<ThemeToggle />` and quick filter buttons.
3. Style the garment processing queue table with monospace timestamps, order IDs, and `<StatusLozenge>`.
4. Style the cash drawer reconciliation card with denomination counters and live variance status.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/admin-hq.test.mjs && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/page.tsx src/components/StatsCards.tsx tests/admin-hq.test.mjs
git commit -m "feat(admin): redesign operations console and telemetry cards in warm editorial style"
```

---

### Task 7: Full System Verification, Production Build & Docker Container Refresh

**Files:**
- Test: all test files (`tests/**/*.test.mjs`)
- Verify: Next.js build bundle (`npm run build`)
- Deploy: Local Docker container `laundry-modern-pos` (`docker compose up -d --build`)

- [ ] **Step 1: Run complete automated test suite**

Run: `npm test`
Expected: PASS (all tests passing)

- [ ] **Step 2: Validate production build**

Run: `npm run build`
Expected: Build succeeds with 0 TypeScript or lint errors.

- [ ] **Step 3: Rebuild and deploy to local Docker container**

Run: `docker compose up -d --build`
Expected: Container `laundry-modern-pos` starts and serves HTTP 200 on `http://localhost:3000`.

- [ ] **Step 4: Verify live endpoints via curl or browser check**

Run: `curl -I http://localhost:3000`
Expected: `HTTP/1.1 200 OK`
