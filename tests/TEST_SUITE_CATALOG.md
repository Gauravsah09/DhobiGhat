# DhobiGhat Permanent Test Suite Catalog

This catalog documents the permanent regression and security test suites executed automatically before every application build.

---

## 1. Automated Execution Hook (`prebuild`)

The test suite is wired directly into the npm lifecycle in `package.json`:

```json
"scripts": {
  "prebuild": "node tests/run-all.mjs",
  "build": "next build",
  "test": "node tests/run-all.mjs"
}
```

Whenever `npm run build` or a Docker image build is triggered:
1. `npm` automatically executes `prebuild` (`node tests/run-all.mjs`).
2. All 33 tests across all 10 suites must pass (`exit code 0`).
3. If **any** test fails, the build halts immediately before compilation, preventing defective or insecure code from ever deploying.

---

## 2. Test Suite Breakdown

| Suite File | Scope & Invariants Guarded | Test Count |
| :--- | :--- | :---: |
| [`tests/portal-auth.test.mjs`](file:///d:/Business/DhobiGhat/tests/portal-auth.test.mjs) | Admin & Store portal authentication, RBAC privileges, 4-role tile rendering. | 3 |
| [`tests/store-portal.test.mjs`](file:///d:/Business/DhobiGhat/tests/store-portal.test.mjs) | Store floor live order rendering, smooth transition tracking, order key stability. | 2 |
| [`tests/customer-portal.test.mjs`](file:///d:/Business/DhobiGhat/tests/customer-portal.test.mjs) | Customer sign-in/up forms, navigation bar simplicity, invoice ownership matching. | 3 |
| [`tests/admin-portal.test.mjs`](file:///d:/Business/DhobiGhat/tests/admin-portal.test.mjs) | Slots & Capacity controls, TAT reports, zero credential leakage on screen. | 3 |
| [`tests/security-fixes.test.mjs`](file:///d:/Business/DhobiGhat/tests/security-fixes.test.mjs) | XSS SVG sanitization, salted password hashing, SQL injection regex defense, JWT tampering. | 5 |
| [`tests/api-authorization.test.mjs`](file:///d:/Business/DhobiGhat/tests/api-authorization.test.mjs) | Deletion authorization, delivery PIN redaction, 5MB upload size caps, MIME checking. | 4 |
| [`tests/gst-invoice.test.mjs`](file:///d:/Business/DhobiGhat/tests/gst-invoice.test.mjs) | Indian GST 18% calculation (9% CGST + 9% SGST), legal invoice format, modal trigger. | 2 |
| [`tests/order-logistics.test.mjs`](file:///d:/Business/DhobiGhat/tests/order-logistics.test.mjs) | Online (`IND-`) vs Walk-in (`WLK-`) channel segregation, state machine transitions, shift closing. | 4 |
| [`tests/supabase-schema-auth.test.mjs`](file:///d:/Business/DhobiGhat/tests/supabase-schema-auth.test.mjs) | PostgreSQL table parity, pgcrypto seeds, snake_case ↔ camelCase mapping, login API route. | 6 |
| [`tests/health-watchdog.test.mjs`](file:///d:/Business/DhobiGhat/tests/health-watchdog.test.mjs) | `/api/health` watchdog implementation, database latency checks, degraded mode handling. | 2 |

**Total Permanent Tests:** **34 Tests** (All passing, duration < 1.2s)

---

## 3. Maintenance Rules (Ponytail & Superpowers)

1. **Zero New Dependencies**: All tests run on Node.js's built-in `node:test` and `node:assert/strict`. No external heavy test framework overhead.
2. **Update on Every Change**: When modifying a domain (e.g. adding a new order stage or auth field), add or update the corresponding test file in `tests/` before pushing code.
3. **Run Command**:
   ```bash
   npm test
   ```
   To run a single suite during development:
   ```bash
   node --test tests/portal-auth.test.mjs
   ```

