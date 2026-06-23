# Security Review — Ting

**Date:** 2026-06-09  
**Scope:** `packages/server` (Express + Prisma API), deploy config, schema, email service  
**Method:** Static source analysis  
**Framework:** OWASP Top 10 (2021)

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 6 |
| Medium | 9 |
| Low | 8 |
| **Total** | **25** |

---

## Critical

### C1 — Hardcoded JWT fallback secret
**OWASP:** A02 Cryptographic Failures  
**File:** `packages/server/src/services/auth.ts:12`

```ts
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
```

If `JWT_SECRET` is not set in the environment, all JWTs are signed with the publicly known string `"your-secret-key"`. An attacker can forge arbitrary tokens — including platform admin — without credentials.

**Remediation:**
```ts
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");
```
Throw on startup; never accept a default.

---

### C2 — World-writable `/var/data` in production container
**OWASP:** A05 Security Misconfiguration  
**File:** `Dockerfile:61`

```dockerfile
RUN mkdir -p /var/data/uploads && chmod -R 777 /var/data
```

`/var/data` holds both the production SQLite database and all uploaded files. `777` means any process running in the container (including a compromised dependency) can read or overwrite the full database — all user PII, bcrypt hashes, audit logs, email logs.

**Remediation:**
```dockerfile
RUN adduser -D -u 1001 appuser && \
    mkdir -p /var/data/uploads && \
    chown -R appuser:appuser /var/data && \
    chmod -R 750 /var/data
USER appuser
```

---

## High

### H1 — Unauthenticated debug endpoint exposes file listing
**OWASP:** A01 Broken Access Control  
**File:** `packages/server/src/index.ts:77`

```ts
app.get("/api/debug/uploads", async (req, res) => {
  const files = await fs.readdir(UPLOADS_DIR, { recursive: true, ...});
  res.json({ uploadsDir: UPLOADS_DIR, totalFiles: ..., files: fileList.slice(0, 20) });
});
```

Accessible by anyone with no authentication. Leaks the server filesystem path for uploads and a listing of uploaded filenames (which include org IDs). Active in `IS_PRODUCTION` mode.

**Remediation:** Remove the endpoint entirely, or at minimum gate it with `authenticate` + `requireAdmin`.

---

### H2 — Open CORS policy
**OWASP:** A05 Security Misconfiguration  
**File:** `packages/server/src/index.ts:34`

```ts
app.use(cors());
```

No origin restriction. Any website can make credentialed requests to this API. Since auth uses `Authorization: Bearer` (not cookies), the impact is limited to cross-origin API calls from attacker-controlled pages when a user visits them while logged in.

**Remediation:**
```ts
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") ?? "http://localhost:5173",
  methods: ["GET", "POST", "PATCH", "DELETE"],
}));
```

---

### H3 — No rate limiting on authentication endpoints
**OWASP:** A07 Identification and Authentication Failures  
**File:** `packages/server/src/routes/auth.ts`

`POST /api/auth/login`, `/register`, and `/request-reset-password` have no throttling. Unlimited brute-force of passwords or reset tokens is possible.

**Remediation:** Add `express-rate-limit`:
```ts
import rateLimit from "express-rate-limit";
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
router.post("/login", authLimiter, ...);
router.post("/request-reset-password", authLimiter, ...);
```

---

### H4 — Password reset link logged to console; email not sent
**OWASP:** A02 Cryptographic Failures  
**File:** `packages/server/src/routes/auth.ts:291–294`

```ts
const resetLink = `...?token=${resetToken}`;
console.log(`Password reset link for ${email}: ${resetLink}`);
// TODO: Send actual email in production
// await emailService.sendPasswordReset(email, user.name, resetLink);
```

Two issues:
1. A valid password reset token is written to stdout (PM2 logs). Anyone with server log access can reset any user's account.
2. The reset email is never sent. Users cannot self-serve reset their password.

**Remediation:** Implement `emailService.sendPasswordReset()`, remove the `console.log`.

---

### H5 — User can self-confirm reservations (status manipulation)
**OWASP:** A01 Broken Access Control  
**File:** `packages/server/src/routes/reservations.ts:330`

```ts
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, status } = req.body;
  // Users can update their own reservations
  if (reservation.userId !== req.user!.id && req.user!.role !== "ADMIN") {
    return res.status(403)...;
  }
  if (status) updateData.status = status;  // no role check on status field
```

A regular member can PATCH their own PENDING reservation with `{ "status": "CONFIRMED" }`, bypassing the manager approval flow entirely.

**Remediation:** Only allow members to set status to `"CANCELLED"`. Status transitions to CONFIRMED/COMPLETED must require MANAGER+ role:
```ts
if (status) {
  if (status !== "CANCELLED" && !hasOrgRole(req, "MANAGER") && req.user!.role !== "ADMIN") {
    return res.status(403).json({ success: false, error: "Only managers can change reservation status" });
  }
  updateData.status = status;
}
```

---

### H6 — Missing HTTP security headers
**OWASP:** A05 Security Misconfiguration  
**File:** `packages/server/src/index.ts`

No `helmet` or equivalent. Missing:
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`
- `Referrer-Policy`

**Remediation:**
```ts
import helmet from "helmet";
app.use(helmet());
```

---

## Medium

### M1 — Email HTML injection via unescaped user input
**OWASP:** A03 Injection  
**File:** `packages/server/src/services/email.ts` (multiple templates)

All email templates interpolate user-controlled strings directly into HTML without escaping:

```ts
const html = `<p>Hei ${userName},</p>
  <p><strong>${itemName}</strong> er nå godkjent...</p>
  ${noteHtml}`;  // noteHtml = `<p><strong>Begrunnelse:</strong> ${note}</p>`
```

Affected fields: `userName`, `itemName`, `orgName`, `note` (rejection reason), `reason` (cancellation), `inviterName`. A malicious item name like `<img src=x onerror="...">` or phishing content lands in emails to all admins and other members.

**Remediation:** HTML-escape all interpolated values:
```ts
function escHtml(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
```

---

### M2 — Public comments endpoint leaks user emails
**OWASP:** A01 Broken Access Control  
**File:** `packages/server/src/routes/comments.ts:24`

```ts
function serializeComment(comment: any): Comment {
  return {
    ...
    user: comment.user ? {
      id: comment.user.id,
      email: comment.user.email,   // exposed to unauthenticated callers
      name: comment.user.name,
      role: comment.user.role,
      ...
    } : undefined,
```

`GET /api/comments/item/:id` is public (no `authenticate` middleware). Any anonymous visitor can harvest email addresses of all members who have commented.

**Remediation:** Remove `email` and `role` from the serialized user in comment responses. For reviews, the serializer (`reviews.ts:22`) already excludes email — apply the same pattern.

---

### M3 — Cross-org comment and review posting
**OWASP:** A01 Broken Access Control  
**File:** `packages/server/src/routes/comments.ts:78`, `routes/reviews.ts:137`

```ts
router.post("/", authenticate, async (req, res) => {
  const item = await prisma.item.findFirst({
    where: { OR: [{ id: itemId }, { slug: itemId }] },  // no org filter
  });
  // No check that req.user is a member of item.organizationId
  await prisma.comment.create({ data: { organizationId: item.organizationId, ... } });
```

An authenticated user from org A can post comments and reviews on items belonging to org B without being a member.

**Remediation:** After resolving the item, check membership:
```ts
const membership = await prisma.membership.findFirst({
  where: { userId: req.user!.id, organizationId: item.organizationId, status: "ACTIVE" },
});
if (!membership && req.user!.role !== "ADMIN") {
  return res.status(403).json({ success: false, error: "Organization membership required" });
}
```

---

### M4 — Any member can send organization invitations
**OWASP:** A01 Broken Access Control  
**File:** `packages/server/src/routes/organizations.ts:676`

```ts
router.post("/invitations/send",
  authenticate,
  withOrganizationContext(),
  requireOrgRole(["MEMBER", "MANAGER", "ADMIN", "OWNER"]),  // any member
```

Any member can invite arbitrary email addresses (with MEMBER role). This means any member can grow the org without manager knowledge.

**Remediation:** Raise minimum role to `"MANAGER"`.

---

### M5 — Invitation role value not validated
**OWASP:** A01 Broken Access Control  
**File:** `packages/server/src/routes/organizations.ts:680`

```ts
const { email, role = "MEMBER" } = req.body;
// Only checks: if role !== "MEMBER", need ADMIN/OWNER
// No whitelist check on what `role` value is
```

A MANAGER/ADMIN/OWNER can invite with an arbitrary string role (e.g. `"SUPERADMIN"`). Stored in DB and returned in API responses, but likely harmless now since Prisma uses string columns. Still invalid state.

**Remediation:** Validate `role` against `["MEMBER", "MANAGER", "ADMIN", "OWNER"]` before use.

---

### M6 — DB backup files not covered by `.gitignore`
**OWASP:** A02 Cryptographic Failures  
**File:** `.gitignore`

`.gitignore` contains `*.db` and `*.db-journal` but **not** `*.db.bak*` or `*.db.backup*`. The files `prisma/dev.db.backup.20260427` and `prisma/dev.db.bak.20260427_225847` (both currently untracked per git status) would not be blocked from being committed. They contain full user data: emails, names, bcrypt hashes, loans, reservations.

**Remediation:** Add to `.gitignore`:
```
*.db.*
*.db.bak*
*.db.backup*
```
Confirm neither file has ever been committed: `git log --all --full-history -- "**/dev.db*"`.

---

### M7 — No automated backup for production database
**OWASP:** A04 Insecure Design  
**File:** `planning/deploy-plan.md`

Production runs SQLite on a Render persistent disk. The deploy plan documents no scheduled backup, no off-site copy, no restore procedure. Disk failure or accidental data deletion = permanent data loss.

**Remediation:** Use [Litestream](https://litestream.io/) to stream SQLite WAL to S3/R2 in real time. Or schedule nightly `sqlite3 /var/data/ting.db .dump | gzip > backup.sql.gz` and ship to object storage. Test restores.

---

### M8 — Seed script runs on every container startup
**OWASP:** A05 Security Misconfiguration  
**File:** `Dockerfile:71`

```sh
CMD ["sh", "-c", "... && node prisma/seed.js && node dist/src/index.js"]
```

The seed runs on every restart. If it inserts default admin users or known test credentials, these re-appear after every deploy.

**Remediation:** Remove `seed.js` from production CMD. Run seed once during initial setup only, or ensure all seed upserts use `skipDuplicates`/idempotent patterns and contain no plaintext passwords.

---

### M9 — `express.json()` has no explicit body size limit
**OWASP:** A05 Security Misconfiguration  
**File:** `packages/server/src/index.ts:35`

```ts
app.use(express.json());
```

Default limit is 100 KB. While not immediately exploitable, a small explicit limit reduces DoS surface.

**Remediation:**
```ts
app.use(express.json({ limit: "10kb" }));
```

---

## Low

### L1 — JWT 7-day lifetime with no revocation mechanism
**OWASP:** A07 Identification and Authentication Failures  
**File:** `packages/server/src/services/auth.ts:41`

Tokens expire after 7 days with no server-side revocation list. A password change (`POST /api/auth/change-password`) does not invalidate existing tokens — a stolen token remains valid for up to 7 days after discovery.

**Remediation:** Shorten to 1–24h. On password change, include a `tokenVersion` in the token payload and increment it in the DB; `verifyToken` rejects tokens with an old version.

---

### L2 — Minimum password length of 6 characters
**OWASP:** A07 Identification and Authentication Failures  
**File:** `packages/server/src/routes/auth.ts:315`, `routes/organizations.ts:627`, `routes/admin.ts:665`

Six characters is well below the NIST SP 800-63B recommendation of 8+ (ideally 12+).

**Remediation:** Raise minimum to 12. Consider adding `zxcvbn` for strength scoring rather than just length.

---

### L3 — Login failures not audited
**OWASP:** A09 Security Logging and Monitoring Failures  
**File:** `packages/server/src/routes/auth.ts`

`auth.login.success` is recorded, but failed login attempts are not. Brute-force attacks are invisible in the audit trail.

**Remediation:**
```ts
// In login route, after failed credential check:
audit({ organizationId: loginOrgId ?? "platform", actorUserId: null,
  action: "auth.login.failure", entityType: "User", entityId: user?.id ?? null,
  metadata: { email } });
```

---

### L4 — Password change does not log security event
**OWASP:** A09 Security Logging and Monitoring Failures  
**File:** `packages/server/src/routes/auth.ts:234`

Password changes are not recorded in the audit log. Security-sensitive event with no trace.

**Remediation:** Add `audit(...)` call in the change-password handler on success.

---

### L5 — Admin user role update allows unknown value `"ORG_ADMIN"`
**OWASP:** A01 Broken Access Control  
**File:** `packages/server/src/routes/admin.ts:205`

```ts
if (role && !["ADMIN", "ORG_ADMIN", "MEMBER"].includes(role)) {
```

`"ORG_ADMIN"` is not used anywhere else in the codebase as a platform role (only `"ADMIN"` and `"MEMBER"` are valid). Setting it creates an inconsistent state in the `User.role` field.

**Remediation:** Change allowed values to `["ADMIN", "MEMBER"]`.

---

### L6 — Overdue reminder job emails on every run without dedup
**OWASP:** A04 Insecure Design  
**File:** `packages/server/src/jobs/reminders.ts:44`

`checkOverdueReminders()` emails every overdue borrower every time it runs, with no per-loan "last notified" tracking. If the job runs multiple times per day (e.g. cron misconfiguration), users get flooded.

**Remediation:** Add `lastNotifiedAt` field to `Loan` model; only send if `lastNotifiedAt` is null or > 24h ago.

---

### L7 — Webhook deployment endpoint relies on single shared secret
**OWASP:** A05 Security Misconfiguration  
**File:** `planning/deploy-plan.md`

`POST https://ting.hpvel.no/deploy` triggers `deploy.sh` (git pull + pnpm build + pm2 restart) on valid HMAC. HMAC verification is correct. Risk: if `WEBHOOK_SECRET` is weak or leaked via logs, attacker can trigger arbitrary redeploy. Redeploy with controlled repo content = RCE.

**Remediation:** Ensure `WEBHOOK_SECRET` is ≥ 32 random bytes. Optionally add a GitHub IP allowlist in Nginx (`allow 192.30.252.0/22; deny all;` for GitHub's published ranges).

---

### L8 — `react-markdown` included in server dependencies
**OWASP:** A06 Vulnerable and Outdated Components  
**File:** `packages/server/package.json`

`react-markdown` is a client-side rendering library. It has no apparent use in the server package and adds unnecessary dependency surface area (React, remark, rehype trees) to the server bundle.

**Remediation:** Remove from `packages/server/package.json`. If needed for server-side markdown rendering (e.g. email), use a minimal alternative like `marked` with sanitization.

---

## Database & Backup Assessment

| Concern | Detail |
|---------|--------|
| **Engine** | SQLite — single file, no network access controls, no per-user permissions |
| **Location** | `/var/data/ting.db` on Render persistent disk |
| **Encryption at rest** | None — full DB readable if disk/snapshot accessed |
| **Access model** | Single Prisma client with full read/write. No least-privilege DB user concept possible with SQLite. |
| **Connection string** | `DATABASE_URL` from env — correct. Not committed. |
| **Migrations in prod** | `prisma migrate deploy` on startup — correct. |
| **Backup automation** | None identified. No mention in deploy plan. |
| **Backup hygiene** | Ad-hoc `.bak` files in `prisma/` not covered by `.gitignore` (see M6). |
| **Restore tested?** | Not evidenced. |
| **Data remanence** | Org deletion removes DB rows but not uploaded files on disk (see below). |

**Upload file remanence on org deletion:**  
`routes/admin.ts` deletes all `ItemImage` and `ItemManual` records via transaction but does not delete the corresponding files from `/var/data/uploads/{orgId}/`. Files remain on disk indefinitely after org deletion.

**Remediation:** After the delete transaction completes, recursively delete `path.join(UPLOAD_BASE_DIR, orgId)`.

---

## OWASP Coverage Summary

| Category | Findings |
|----------|---------|
| A01 Broken Access Control | C1 (token forgery), H1 (debug endpoint), H5 (reservation self-confirm), M2 (email leak), M3 (cross-org), M4 (member invite), M5 (role validation), L5 (ORG_ADMIN) |
| A02 Cryptographic Failures | C1, H4 (reset token in logs), M6 (backup gitignore) |
| A03 Injection | M1 (email HTML injection) |
| A04 Insecure Design | M7 (no backup), M8 (seed on start), L6 (reminder dedup) |
| A05 Security Misconfiguration | C2 (world-writable), H2 (CORS), H6 (no helmet), M9 (body limit), L7 (webhook) |
| A06 Vulnerable Components | L8 (react-markdown) |
| A07 Auth Failures | H3 (no rate limit), L1 (JWT lifetime), L2 (weak password policy) |
| A08 Software Integrity | — |
| A09 Logging & Monitoring | H4 (reset link in log), L3 (login failures), L4 (password change) |
| A10 SSRF | — (ItemManual LINK type stored but not server-side fetched) |

---

## Recommended Fix Priority

1. **C1** — JWT secret fallback (token forgery) — fix before any production traffic
2. **H4** — password reset tokens in logs + reset email TODO — implement now
3. **H3** — rate limiting on auth endpoints
4. **C2** — world-writable `/var/data` in Dockerfile
5. **H5** — reservation status self-confirm
6. **H1** — remove unauthenticated debug endpoint
7. **M1** — HTML-escape email templates
8. **M2** — remove email from public comment response
9. **M3** — add org membership check to comment/review create
10. **M6 + M7** — `.gitignore` backup patterns + implement DB backup
