# Design Specification: DhobiGhat "No Monkey" Warm Editorial Craft Redesign

* **Document Date:** 2026-10-28
* **Status:** Approved by User (with Light/Dark Theme Toggle)
* **Target Version:** DhobiGhat Next.js 16 Web Application
* **Inspiration:** [nomonkey.work](https://www.nomonkey.work/en)
* **Design Philosophy:** Industrial, Editorial Technical Craft (Swiss Minimal + Monospace Precision + Warm Canvas + Espresso Dark Mode)

---

## 1. Intent and The "Why"

DhobiGhat is an active enterprise laundry and garment care platform managing physical operations: garment intake, washing, steam ironing, packaging, delivery dispatch, and counter POS transactions.

Previous explorations demonstrated that:
1. Ultra-dark neo-luxury (CRED style) lacked operational legibility, felt claustrophobic, and was rejected.
2. Rigid enterprise SaaS (Atlassian style) leaned overly generic corporate.

In contrast, **nomonkey.work** demonstrates a distinctive, high-credibility aesthetic:
- **Warm Canvas & Espresso Dark Mode:** Provides a warm parchment/cream surface (`#fffbf2`) in light mode and a deep espresso charcoal foundation (`#0c0a07`) in dark mode, easily toggleable via an accessible header control.
- **Honest Technical Precision:** Monospace hierarchy, technical uppercase kickers, precise 1px hairline borders, and live status dots.
- **Physical Craft Feeling:** Perfectly aligns with garment care, linen finishing, and industrial laundry machinery—conveying meticulous precision, reliability, and human craftsmanship.
- **Zero Fluff ("Earns Its Keep"):** Focused strictly on operational speed, clear data tables, and rapid order processing.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
1. **Design Tokens & Palette:** Introduce the warm editorial token system into `src/app/globals.css` with CSS variables for canvas, ink, lines, and amber glowing accents in both **Light Mode** and **Dark Mode**.
2. **Accessible Theme Toggle:** A persistent, 1-click theme switch (Sun/Moon) in the global navigation bar, remembering user preference via `localStorage` with a zero-flash inline script.
3. **Typography Hierarchy:** Implement a clean technical monospace / sans pairing (`ui-monospace`, `JetBrains Mono` stack) with tight headline tracking (`-0.03em`) and uppercase section kickers.
4. **Core Primitives:**
   - Tactile dark gradient action buttons (`linear-gradient(180deg, #35332e, #1b1a17)`).
   - Warm paper / espresso cards with 1px hairline borders (`#e5e2da` / `#2e2a24`).
   - Status lozenges/chips with pulsing glowing indicator dots for order lifecycle stages.
5. **Surface Transformation:**
   - **Root Landing (`/`)**: High-impact editorial technical portal introducing the DhobiGhat operations suite with direct routing to Customer, Store POS, and Admin HQ.
   - **Customer Portal (`/customer/*`)**: Artisanal concierge booking, price list rates, and live order tracking.
   - **Store POS (`/store`)**: High-efficiency counter intake terminal with quick garment tagging and receipt preview.
   - **Admin HQ (`/admin`)**: Operational control console for fleet logistics, shift closing, and business analytics.
6. **Print Integrity:** Preserve `@media print` so walk-in POS receipts and delivery invoices render in pure black ink on clean white paper regardless of active theme.
7. **Zero Test Regressions:** Keep all 13 security and business logic tests passing with 0 errors.

### Non-Goals
- **No Heavy 3D / WebGL:** We explicitly skip Three.js, canvas bees, or WebGL shaders from nomonkey.work. DhobiGhat is an operational business tool, not an interactive marketing stunt.
- **No Scroll Physics Engines:** Avoid complex Lenis/GSAP scroll jank that disrupts mobile viewports or counter POS terminals.
- **No Backend Changes:** Zero changes to Supabase schema, JWT verification, S3 storage, or API contract signatures.
- **No Third-Party Bloat:** Zero new npm packages. Implemented 100% using native Tailwind CSS v4 and standard Next.js components.

### Anti-Goals
- **No Pitch-Black Minimalist Voids:** Even in dark mode, use warm espresso (`#0c0a07`) with high-contrast parchment text (`#f5f2e9`) rather than unreadable low-contrast black-on-black.
- **No Stock Emojis:** Strictly use stroke-calibrated Lucide React SVG icons.
- **No Layout Thrashing / CLS:** Prevent horizontal overflow or unaligned grids on mobile screens.

---

## 3. Constraints

- **Framework:** Next.js 16.4.3 (Turbopack), React 19.3.0.
- **Styling:** Tailwind CSS v4 with native CSS custom properties.
- **Icons:** `lucide-react`.
- **Accessibility:** WCAG AA compliance (4.5:1 text contrast minimum in both themes).
- **Git Policy:** NEVER execute `git push` without explicit user permission.

---

## 4. Approaches Considered

### Approach 1: Unified Warm Editorial Craft with Instant Theme Toggle (Picked)
- **Concept:** All surfaces (Customer, POS, Admin) share the warm cream `#fffbf2` canvas in light mode and deep espresso `#0c0a07` in dark mode, toggleable via a 1-click header button. Both modes utilize hairline borders and glowing amber accents `#d97706` / `#f59e0b`.
- **Why Selected:** Satisfies the desire for warm, readable daytime operations while offering a sleek, low-glare espresso mode for evening shifts or dark-mode users.

---

## 5. Design System Specifications (Tokens & Primitives)

### 5.1 Color Tokens (`globals.css`)

```css
/* Light Theme (Default: Warm Paper & Parchment) */
:root {
  --c-canvas: #fffbf2;          /* Warm cream parchment background */
  --c-canvas-surface: #ffffff;  /* Pure card / modal surface */
  --c-canvas-sunken: #f5f2e9;   /* Table headers, inputs, subtle wells */
  
  --c-ink: #1b1a17;             /* Deep warm charcoal body text */
  --c-ink-muted: #57534e;       /* Secondary labels and descriptions */
  --c-ink-faint: #78716c;       /* Footnotes, timestamps, placeholders */
  
  --c-border: #e5e2da;          /* Hairline divider & card outline */
  --c-border-strong: #d6d3d1;   /* Hover borders and active inputs */
  
  --c-accent: #d97706;          /* Amber-600 warm glowing primary accent */
  --c-accent-hover: #b45309;    /* Amber-700 hover state */
  --c-accent-subtle: #fef3c7;   /* Amber-100 tag/chip background */
  --c-accent-glow: rgba(217, 119, 6, 0.25); /* Focus & status pulse glow */
  
  --c-status-pending: #d97706;  /* Warm amber */
  --c-status-process: #0284c7;  /* Cyan/Sky */
  --c-status-ready: #059669;    /* Forest emerald */
  --c-status-alert: #dc2626;    /* Crimson red */
}

/* Dark Theme: Deep Warm Espresso & Amber Glow */
.dark, [data-theme="dark"] {
  --c-canvas: #0c0a07;          /* Deep espresso background */
  --c-canvas-surface: #171512;  /* Raised card / panel surface */
  --c-canvas-sunken: #110f0c;   /* Sunken wells, search bars, header cells */
  
  --c-ink: #f5f2e9;             /* Warm off-white parchment text */
  --c-ink-muted: #a8a29e;       /* Stone-400 secondary labels */
  --c-ink-faint: #78716c;       /* Stone-500 timestamps, borders */
  
  --c-border: #2e2a24;          /* Warm dark hairline border */
  --c-border-strong: #443e35;   /* Active border / input focus */
  
  --c-accent: #f59e0b;          /* Vibrant amber-500 accent */
  --c-accent-hover: #fbbf24;    /* Amber-400 hover */
  --c-accent-subtle: #291c0a;   /* Deep amber-tinted badge background */
  --c-accent-glow: rgba(245, 158, 11, 0.35); /* Amber focus glow */
  
  --c-status-pending: #f59e0b;
  --c-status-process: #38bdf8;
  --c-status-ready: #34d399;
  --c-status-alert: #f87171;
}
```

### 5.2 Theme Toggle Architecture
- Component: `src/components/ThemeToggle.tsx`
- State: Stored in `localStorage.getItem('dhobighat-theme')` ('light' | 'dark' | system).
- FOUC Prevention: Lightweight inline script in `src/app/layout.tsx` `<head>` reads `localStorage` before paint and adds `.dark` class to `<html>` if dark mode is active.
- Placement: Top-right corner of the global navigation bar on Root, Customer, POS, and Admin.

### 5.3 Typography Stack
- **Mono Technical Stack:**
  `font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace`
- **Headings:** Semibold (600) or Bold (700), tight letter-spacing (`-0.03em`), crisp line-height.
- **Kickers / Eyebrows:** Monospace, `text-[11px]`, uppercase, tracking-wider (`0.12em`), color `--c-accent`.

### 5.3 Component Language

1. **Tactile Primary Button:**
   - Background: `linear-gradient(180deg, #35332e, #1b1a17)`
   - Text: `#ffffff`
   - Border radius: Full pill (`rounded-full`) or `rounded-lg`
   - Shadow: `shadow-sm`, subtle top inset highlight `inset 0 1px 0 rgba(255,255,255,0.15)`
   - Hover: Amber glow ring (`hover:ring-2 hover:ring-amber-500/50`)

2. **Amber Accent Button:**
   - Background: `bg-amber-600 hover:bg-amber-700 text-white`
   - Border radius: Full pill (`rounded-full`)
   - Click feedback: Active scale down `active:scale-[0.98]`

3. **Status Chips & Lozenges:**
   - Style: Pill-shaped (`rounded-full`), `bg-[#f5f2e9]`, `border border-[#e5e2da]`
   - Indicator: Pulsing 7px dot with `box-shadow: 0 0 0 3px var(--glow-color)`
   - Text: `text-xs font-mono font-medium text-stone-800`

4. **Cards & Containers:**
   - Surface: Pure white `bg-white` on warm cream canvas
   - Outline: Crisp 1px hairline `border border-[#e5e2da]`
   - Corners: `rounded-2xl` for containers, `rounded-xl` for interactive items
   - Shadow: Ultra-subtle `shadow-[0_2px_8px_rgba(27,26,23,0.04)]`

5. **Data Grids & Tables:**
   - Headers: `bg-[#f5f2e9] text-stone-600 font-mono text-[11px] uppercase tracking-wider`
   - Rows: Hairline borders `border-b border-[#e5e2da]`, hover highlight `hover:bg-[#faf8f2]`
   - Cells: Clean padding `px-4 py-3 text-sm font-mono`

---

## 6. Surface-by-Surface Layout Specification

### 6.1 Landing Page (`/`)
- **Hero:**
  - Kicker: `[ SYSTEM STATUS: ALL LAUNDRY HUBS OPERATIONAL ]`
  - Headline: **DhobiGhat — Precision Garment Care OS**
  - Subhead: Industrial fabric processing, walk-in store counter POS, and doorstep logistics dispatch engineered for modern laundry operations.
- **Three Core Gateway Cards:**
  1. **Customer Lounge:** Self-service order booking, price catalog & live garment tracking.
  2. **Store Intake POS:** Counter intake terminal, garment piece-rate calculator & receipt printing.
  3. **Admin Operations HQ:** Factory pipeline queues, fleet driver management & shift cash reconciliation.
- **Metrics Footer:** Total active orders, turnaround time guarantee (24-48h), organic solvent compliance.

### 6.2 Customer Portal (`/customer/*`)
- **Navigation:** Clean sticky top bar with logo, active route indicators, and phone login status.
- **Rates (`/customer/rates`):** Clean categorized cards (Wash & Fold, Steam Press, Dry Cleaning, Premium Silk & Wool) with unit prices and turn-around tags.
- **Booking (`/customer/book`):** Step-by-step form with pickup slot selector, address capture, and service type toggles.
- **Orders & Tracking (`/customer/orders` & `/track`):** Live telemetry timeline showing: `Order Received → Garment Tagged → Washing & Drying → Quality Inspection → Out for Delivery`.

### 6.3 Store POS (`/store`)
- **Walk-in Counter Intake:**
  - Customer phone search / quick create.
  - Garment grid with fast item increment (+/-).
  - Live subtotal, tax calculation, discount apply, and payment mode toggle (Cash / UPI QR).
  - Action buttons: "Confirm & Generate Tag", "Print Receipt" (triggers `@media print`).

### 6.4 Admin HQ (`/admin`)
- **Telemetry Overview:** Active floor orders, revenue breakdown, shift variance monitor.
- **Order Pipeline Manager:** Stage transition controls with state machine integrity.
- **Shift Closing Register:** Cash drawer denomination counter with automated variance calculation.

---

## 7. What's Left to the Builder

- Choosing exact Lucide icon associations for minor garment sub-items.
- Tuning responsive breakpoints on small mobile devices (375px) for the POS counter grid.
- Crafting micro-animations for the status pulse dots.
