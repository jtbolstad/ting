# Security Review Plan — Ting

**Status: COMPLETE — 2026-06-09**  
Full report: [`security-review.md`](./security-review.md)

Scope: `packages/server` (Express + Prisma API), deploy config, schema, email service. OWASP Top 10 (2021).

---

## Results

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 6 |
| Medium | 9 |
| Low | 8 |
| **Total** | **25** |

---

## Review areas (checklist)

### 1. Authentication & session — A07
- [x] JWT secret handling — **C1: fallback `"your-secret-key"` in `services/auth.ts:12`**
- [x] Token expiry, no revocation — **L1: 7d lifetime, password change doesn't invalidate**
- [x] Password policy — **L2: min 6 chars**
- [x] Login throttling — **H3: no rate limiting on auth endpoints**
- [x] Password reset token — secure (`crypto.randomBytes(32)`), 1h expiry, single-use ✓; email never sent (TODO) — **H4**
- [x] `optionalAuthenticate` silent-fail — safe by design ✓

### 2. Access control & multi-tenant isolation — A01
- [x] `requireAdmin` / `requirePlatformAdmin` consistent ✓
- [x] `withOrganizationContext` / `requireOrgRole` — no header spoofing possible ✓
- [x] IDOR: items/loans/reservations scoped to org ✓; comments/reviews cross-org — **M3**
- [x] Privilege escalation via role PATCH — guarded ✓; reservation status self-confirm — **H5**
- [x] Owner-only checks on items/manuals/images — correct ✓

### 3. Injection — A03
- [x] No `$queryRaw`/`$executeRaw` usage found ✓
- [x] Search `contains` — Prisma parameterised, not injectable ✓
- [x] Email HTML injection — **M1: all templates interpolate unescaped user input**
- [x] Path traversal — `sanitizeFilename()` present; org-dir isolation in place ✓

### 4. Insecure design / config — A04 / A05
- [x] Open CORS — **H2: `cors()` with no origin allowlist**
- [x] Missing security headers — **H6: no helmet**
- [x] No rate limiting — **H3**
- [x] Unauthenticated debug endpoint — **H1: `/api/debug/uploads`**
- [x] Body size limit — **M9: no explicit limit**
- [x] Static upload serving — `express.static` with `fallthrough: true`, cache headers set ✓

### 5. Secrets & cryptographic failures — A02
- [x] JWT fallback — **C1**
- [x] `.env` / `dev.db` not committed (`*.db` in `.gitignore`) ✓; backup patterns missing — **M6**
- [x] Reset link in logs — **H4**
- [x] Tokens in Authorization header (not cookie), no SameSite concerns ✓

### 6. File upload — A04 / A08
- [x] Image magic-number validation present and complete ✓
- [x] PDF magic bytes validated ✓
- [x] Size limits: images 10MB, PDFs 20MB ✓
- [x] Org-dir isolation in place; filename sanitised ✓

### 7. Data exposure — A01 / A04
- [x] Comment endpoint leaks user email — **M2**
- [x] Admin-only endpoints (`/waiting-users`, `/admin/users`) behind `requireAdmin` ✓
- [x] Debug endpoint leaks fs paths — **H1**
- [x] Audit/email logs behind `requirePlatformAdmin` ✓

### 8. SSRF & integrations — A10
- [x] `ItemManual` LINK url — stored, no server-side fetch; client renders as anchor only — not server-side SSRF ✓

### 9. Vulnerable components — A06
- [x] `react-markdown` in server deps — **L8: unnecessary, adds surface**
- [x] `jsonwebtoken@^9.0.2`, `express@^4.18`, `multer@^2.1`, `sharp@^0.34` — current major versions ✓ (full `npm audit` not run; recommend running in CI)

### 10. Logging & monitoring — A09
- [x] Login failure not audited — **L3**
- [x] Password change not audited — **L4**
- [x] Reset token in logs — **H4**

### 11. Database setup, access & backup — A02 / A04 / A05
- [x] SQLite on Render persistent disk; `DATABASE_URL` from env ✓
- [x] DB not in web-served path ✓
- [x] World-writable `/var/data` — **C2: `chmod -R 777` in Dockerfile**
- [x] `prisma migrate deploy` on startup (correct); seed also runs on every startup — **M8**
- [x] No backup automation — **M7**
- [x] Backup `.bak` files not in `.gitignore` — **M6**
- [x] SQLite unencrypted at rest — noted (L-level, accepted risk for current threat model)
- [x] Org delete leaves upload files on disk — noted in report (data remanence)
- [x] Overdue reminder no dedup — **L6**

---

## Files reviewed
- `src/index.ts` ✓
- `src/middleware/auth.ts` ✓
- `src/middleware/organization.ts` ✓
- `src/services/auth.ts` ✓
- `src/services/email.ts` ✓ (full)
- `src/services/imageProcessor.ts` ✓
- `src/services/auditLog.ts` ✓
- `src/utils/upload.ts` ✓
- `src/routes/` — all 12 route files ✓
- `src/jobs/reminders.ts` ✓
- `prisma/schema.prisma` ✓
- `package.json` ✓
- `.gitignore` ✓
- `Dockerfile` ✓
- `planning/deploy-plan.md` ✓
- `npm audit` — **not run** (recommend adding to CI)
