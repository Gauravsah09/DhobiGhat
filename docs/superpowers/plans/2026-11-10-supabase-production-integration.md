# Supabase Production-Grade Database & Authentication Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transition DhobiGhat from legacy in-memory/localStorage seed data to a production-grade **Render + Supabase + Cloudflare** architecture with PostgreSQL 16, Row-Level Security (RLS), salted `pgcrypto` password hashing, and zero client-side credential persistence.

**Architecture:** 
- **Database (Supabase PostgreSQL 16)**: Source of truth for `admin_users`, `store_staff`, `customers`, `customer_addresses`, `orders`, and `order_items`. Passwords hashed with salt via `pgcrypto` (`crypt(password, gen_salt('bf'))`).
- **Application Server (Next.js 16 on Render)**: Server-side route handlers (`/api/auth/login`, `/api/orders`, `/api/customers`) authenticate and query Supabase using the Supavisor pooled service-role client (`getSupabaseAdminClient()`), issuing signed HTTP-only JWT cookies (`dhobighat_token`).
- **Edge & Media (Cloudflare)**: CDN caching, WAF, and R2 object storage for doorstep pickup photo evidence.
- **Client (Browser / POS)**: Stateless RAM cache; zero customer PII or credentials persisted in `localStorage`. Seamless local test mock fallback when Supabase env variables are not present.

**Tech Stack:** Next.js 16 (App Router, Turbopack, standalone), React 19, Supabase JS v2, PostgreSQL 16, `pgcrypto`, jose (JWT), Node.js native test runner.

---

## Global Constraints

1. **Zero Client-Side Credential Storage**: Passwords, PINs, or raw customer identity records must NEVER be saved in browser `localStorage`. Only HttpOnly, Secure, SameSite=Strict session cookies are permitted.
2. **Deterministic Salted Hashing**: Passwords stored in Supabase must use bcrypt / pgcrypto blowfish hashing (`crypt(pass, gen_salt('bf'))`), compatible with server-side validation.
3. **No Breaking Changes in Local CI**: `npm test` and local offline builds without Supabase keys must continue to pass using graceful fallback mocks.
4. **Environment Secret Protection**: Secret keys (`SUPABASE_SERVICE_ROLE_KEY`, `AUTH_JWT_SECRET`) must never be committed to git; use `.env.local` and `render.yaml`.
5. **Strict Git Safety**: No `git push` without explicit user permission.

---

## Review Focus & Failure Modes

1. **Network Outage / Database Connection Flapping**: Fallback mechanism must keep the POS terminal responsive even during transient database disconnections.
2. **Schema Column Mismatch**: JSON camelCase fields (e.g. `invoiceNo`, `customerPhone`) must map cleanly to Postgres snake_case fields (`invoice_no`, `customer_phone`).
3. **JWT Expiry & Token Refresh**: Handle session expiration gracefully on both customer and store staff terminals without losing active booking form inputs.
4. **Concurrent Order Ingestion**: Atomic invoice sequence generation without race conditions during simultaneous online bookings and walk-in counter intakes.
5. **Role-Based Privilege Escalation**: Superadmin, Store Operator, and Customer APIs must strictly validate role claims before executing database modifications.

---

## Tasks

### Task 1: Database Schema Expansion (`supabase-schema.sql`)
- [ ] Add `admin_users` table to `supabase-schema.sql` with columns `id`, `username`, `email`, `full_name`, `role`, `password_hash`, `permissions`, `is_active`, `created_at`.
- [ ] Add `password_hash` column to `customers` table with index on email and phone.
- [ ] Update `store_staff` table to ensure `password_hash VARCHAR(255)` is used and indexed.
- [ ] Add SQL seed scripts utilizing `pgcrypto` (`crypt('...', gen_salt('bf', 10))`) for initial bootstrap accounts.
- [ ] Verify SQL syntax compatibility in PostgreSQL 16.

### Task 2: Supabase Server Client & Environment Configuration
- [ ] Update [src/lib/supabase-server.ts](file:///d:/Business/DhobiGhat/src/lib/supabase-server.ts) with helper utilities for database queries (`supabaseAdmin.from(...)`).
- [ ] Configure `.env.example` documenting `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `AUTH_JWT_SECRET`.
- [ ] Update [docker-compose.yml](file:///d:/Business/DhobiGhat/docker-compose.yml) and [render.yaml](file:///d:/Business/DhobiGhat/render.yaml) to forward Supabase service credentials.

### Task 3: Backend Authentication Route (`/api/auth/login`) Database Integration
- [ ] Update [src/app/api/auth/login/route.ts](file:///d:/Business/DhobiGhat/src/app/api/auth/login/route.ts) to query Supabase `admin_users`, `store_staff`, or `customers` when `isSupabaseConfigured === true`.
- [ ] Verify passwords against database hashes using `verifyPassword` / `pgcrypto`.
- [ ] Issue signed HttpOnly JWT session token with user ID, role, and permissions.
- [ ] Maintain seamless in-memory fallback for local unit tests when Supabase is unconfigured.
- [ ] Add test cases in `tests/portal-auth.test.mjs` verifying database authentication logic.

### Task 4: Orders API (`/api/orders`) Supabase Integration
- [ ] Update `GET /api/orders` to query Supabase `orders` table (with joined items) when configured.
- [ ] Update `POST /api/orders` to insert into Supabase `orders` and `order_items` inside a transactional batch.
- [ ] Map snake_case database records to camelCase application models cleanly.
- [ ] Add unit tests in `tests/order-logistics.test.mjs` verifying mapping and database roundtrip.

### Task 5: Customers API (`/api/customers`) Supabase Integration
- [ ] Update `POST /api/customers` and `GET /api/customers` to persist and retrieve from Supabase `customers` table.
- [ ] Ensure new customer signups insert into `customers` with salted password hash and welcome wallet credit.
- [ ] Sanitize phone numbers and emails to prevent duplicate entries.

### Task 6: Frontend Context (`LaundryContext.tsx`) RAM-Only Modernization
- [ ] Remove `localStorage.setItem(STORAGE_KEYS.ORDERS, ...)` and `localStorage.setItem(STORAGE_KEYS.STAFF, ...)` from persistent browser disk.
- [ ] Hydrate orders and staff directly from `/api/orders` and `/api/auth/session` on mount.
- [ ] Maintain BroadcastChannel for cross-tab RAM-to-RAM live synchronization without writing customer records to disk.

### Task 7: End-to-End Verification & Docker Deployment
- [ ] Run test suite (`npm test`) and verify 100% pass rate.
- [ ] Run Next.js 16 production build (`npm run build`).
- [ ] Rebuild and restart the Docker container (`docker compose up -d --build`).
- [ ] Verify `/api/health` reports Supabase connectivity status.

