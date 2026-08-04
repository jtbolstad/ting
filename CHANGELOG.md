# Changelog

Operational changes: deploy pipeline, process management, secrets, infrastructure.

Feature and release history lives in [VERSJONERING.md](VERSJONERING.md) — that file
tracks what users see, versioned `v0.1`, `v0.2`, … This one tracks what runs and how
it gets there, dated rather than versioned, newest first. Entries marked **VPS** are
changes to the server itself and are not reproducible from this repo alone.

---

## 2026-08-04 — Migrations run as root on production

### Fixed

- **`prisma migrate deploy` could not write the production database.**
  `/var/data/db.sqlite` is owned by root, because production runs in root's pm2
  daemon, while the deploy workflow runs as `VPS_USER`. Every deploy since
  2026-07-30 shipped a migration set the database already had, so `migrate
  deploy` only ever read and the mismatch stayed hidden. The first migration
  that actually needed to write — `20260731000000_add_oauth_accounts`, the
  Google sign-in work — failed the deploy with `SQLite database error: attempt
  to write a readonly database`. Nothing was written, not even a
  `_prisma_migrations` row, so there is no failed migration to `resolve`; the
  deploy stopped before build and restart, leaving production up on the previous
  commit.
  Migrations now go through `scripts/ting-deploy-migrate`, installed to
  `/usr/local/sbin` and permitted by `/etc/sudoers.d/ting-deploy`, mirroring how
  the restart is already handled. The deploy user still has no write access to
  the production database outside that reviewed script.
- Stage was never affected: `/var/data/stage` is deploy-owned, so
  `deploy-stage.yml` still calls prisma directly.

### VPS

Not reproducible from this repo — recorded here so the server's state has a history.

- Installed `/usr/local/sbin/ting-deploy-migrate` (root:root, 0755) and added
  `deploy ALL=(root) NOPASSWD: /usr/local/sbin/ting-deploy-migrate` to
  `/etc/sudoers.d/ting-deploy`.

---

## 2026-07-30 — Deploy pipeline, process ownership, secrets

Stage reported a stale commit in `/health` after a green deploy. The cause turned out
to be three pm2 daemons with overlapping app definitions racing for the same ports,
and workflows that could not fail. Everything below follows from that.

### Security

- **`JWT_SECRET` never reached the server process.** `services/auth.ts` falls back to
  a hardcoded `"your-secret-key"` when the variable is absent, so production signed
  and verified tokens with a publicly known secret. Nothing loaded `.env` at runtime:
  there is no `dotenv` in the server package, and pm2's `env_file` silently does
  nothing (see below). Fixed by loading `.env` in `ecosystem.config.js`.
  **Every token issued before 2026-07-30 12:38 UTC must be treated as forgeable** —
  that is when the real secret first reached the process. Sessions from before then
  are invalid, so users have to sign in again.
- **`WEBHOOK_SECRET` was hardcoded in `ecosystem.config.js`**, so it was committed and
  pushed to GitHub. nginx exposed the listener publicly at `/deploy`, and the HMAC
  signature was the only thing guarding it — anyone who read the repo could trigger a
  root-level deploy on demand. The value was rotated, moved out of tracked source, and
  then removed entirely when the webhook was retired. No `Invalid signature` entries
  appear in its logs, so there is no evidence it was ever abused.
- The old published webhook secret was verified to return `401` after rotation, and
  the replacement to be accepted, before the endpoint was removed.

### Fixed

- **Deploys could not fail.** `deploy-vps.yml` had no `set -e`, so a failed install,
  migration, or build scrolled past and the job still went green. Added to both
  workflows.
- **`pm2` commands hit the wrong daemon.** Both workflows ran `pm2` as the SSH user,
  whose daemon is a separate instance from the one actually serving traffic. The
  commands succeeded against the wrong daemon and exited 0, while the real process
  kept serving stale code. Stage's duplicate had crash-looped 381 times on
  `EADDRINUSE :::3002`; production's, 1.4 GB of logs' worth on `:::3001`.
- **`git pull origin main` merged into whatever branch was checked out.** The
  production checkout was sitting on `stage`, so a deploy could have shipped a
  `stage`+`main` merge. Both workflows now check out the target branch explicitly and
  hard reset to the remote. Untracked files (`.env`, `node_modules`) are untouched,
  and a stray tracked edit can no longer block the pull.
- **`pnpm` blocked on an interactive prompt.** It asks before purging a `node_modules`
  it considers stale (`confirmModulesPurge`); over SSH nothing can answer, so it exits
  non-zero — which `set -e` correctly turns into a failed deploy. `CI=true` added to
  both workflows.
- **pm2's `env_file` is silently ignored** on pm2 6.0.14. An app started from
  `ecosystem.config.js` with `env_file` set had none of the file's variables in its
  environment. `ecosystem.config.js` now parses the `.env` itself — it is plain JS that
  pm2 evaluates at start — and the `env_file` keys were removed so nobody trusts them
  again. Values from `.env` are spread *first*, so the explicit ones still win and a
  stray `NODE_ENV=development` cannot flip production out of serving the built client.

### Changed

- `/health` now reports the deployed commit on production as well as stage, and both
  verify steps assert it. A restart that silently fails to replace the process can no
  longer pass a deploy.
- Production restarts go through `scripts/ting-deploy-restart` (installed to
  `/usr/local/sbin`, permitted by `/etc/sudoers.d/ting-deploy`), which starts the app
  *from* `ecosystem.config.js` so its `env` block is re-evaluated. Notes on the two
  approaches that do **not** work are in that script: `pm2 restart` reuses the stored
  environment, and `startOrRestart --update-env` only re-reads the config when pm2's
  definition was created from it.
- Process ownership is now explicit and documented in `ecosystem.config.js`:
  production `ting` in **root's** daemon, `ting-stage` in the **deploy** user's
  (`/var/data/stage` is deploy-owned).

### Removed

- **The deploy webhook**, which duplicated `deploy-vps.yml`. Both fired on a push to
  main, so every production deploy ran twice concurrently — `deploy.sh` doing
  `git pull`, install, build and `pm2 restart ting` as root while the workflow was
  replacing the same process in the same directory. GitHub's delivery log shows
  `202 Deploying` at 12:08:54 and 12:39:35, matching both pushes to main; the second
  orphaned production and left it crash-looping. `deploy.sh` also lacked every guard
  the workflow has since gained. Removed: the GitHub hook, the nginx `/deploy`
  location, the pm2 app, and the secret file. `/deploy` now returns 404 from the app.

### VPS

Not reproducible from this repo — recorded here so the server's state has a history.

- **Disabled `pm2-jt.service`.** A third pm2 daemon had its own `ting` definition,
  created 2026-03-22, which had crash-looped **13,434 times** on `EADDRINUSE :::3001`
  and grabbed the port whenever the legitimate process released it. This was the root
  cause of production's missing environment: the process serving traffic had been
  started by that daemon long ago with a minimal env. Its saved `dump.pm2` still lists
  `ting`, so **re-enabling that unit brings the conflict back.**
- **Created `pm2-deploy.service`.** The deploy user's daemon had no systemd unit, so a
  reboot would have left stage down entirely.
- **Installed `pm2-logrotate`** on both remaining daemons (`max_size 10M`,
  `retain 7`), and truncated ~4 GB of accumulated crash-loop logs. Note that
  `compress` cannot be enabled: pmx's `autocast` turns the string `"true"` into a
  boolean, and pm2-logrotate's `parseBool` only accepts strings, so it falls back to
  `false`. It is set to `false` explicitly rather than left claiming otherwise.
- Took a consistent backup of the production database to
  `/var/data/backups/db.sqlite.20260730-preflight` before the release. The DB was
  quiescent and was never written to by any of this work.
- `/home/deploy/webhook.js` and `/home/deploy/deploy.sh` remain on disk but are
  unreferenced by anything. **Dead code — safe to delete.**

### Released

Production moved from `e705911` (2026-06-23) to `5a3134c`, a clean fast-forward.
Migration sets were already identical, so `prisma migrate deploy` was a no-op and the
database was not written to. `UPLOADS_DIR`'s production fallback resolves to
`/var/data/uploads`, matching where uploads already live.

---

## 2026-07-30 — Stage environment

Earlier the same day, before the pipeline work above. A second environment on the
same VPS, so changes can be seen running before they reach production.

### Added

- **`ting-stage` on port 3002**, checkout at `/var/www/ting-stage`, with its own
  SQLite database and uploads directory under `/var/data/stage`. Pushing to the
  `stage` branch deploys it (`deploy-stage.yml`); merging into `main` still deploys
  production.
- **`/health` reports `env` and `commit`**, so a deploy can assert the expected build
  is actually live instead of assuming the restart worked. Production was added to
  this later in the day.
- **`scripts/refresh-stage-db.sh`** snapshots the production database through
  SQLite's online backup API and rewrites emails, names, comments and email logs
  before installing it. The result is **pseudonymized, not anonymous** — reservation
  history, loan history and organization names survive, so stage access should stay
  internal. Its `.env` deliberately omits `SMTP_HOST`, which makes the email service
  log instead of send.

### Changed

- **The uploads path comes from `UPLOADS_DIR`** rather than being derived from
  `NODE_ENV`. Stage has to run `NODE_ENV=production` to serve the built client, which
  under the old rule would have pointed it at production's uploads directory. A new
  `APP_ENV` carries deployment identity separately, driving the `noindex` header, the
  UI banner and `/health`. Fallbacks are unchanged when the variables are unset.
- **The environment was renamed `staging` → `stage`** across branch, subdomain, pm2
  app, and filesystem paths, one day after it was introduced.
- `DATABASE_URL` documented as required in stage's `.env`, because
  `prisma migrate deploy` reads it directly rather than through the app.

### Security

- **`/api/debug/uploads` is now gated to non-production.** It enumerated the uploads
  directory to unauthenticated callers — H1 in the security review below.

---

## 2026-06-23 — Security review recorded

`planning/security-review.md` — a static review of `packages/server`, deploy config,
schema and the email service against the OWASP Top 10 (2021), dated 2026-06-09 and
committed as `e705911`. **The commit adds documentation only; no code was changed by
it.** 25 findings: 2 critical, 6 high, 9 medium, 8 low.

Status of the ones that have moved since, as of 2026-07-30:

- **C1 — hardcoded JWT fallback secret.** Mitigated operationally: `.env` now reaches
  the process, so the real secret is used (see the entry at the top of this file for
  what that means for tokens issued before then). **The fallback itself is still in
  the code** — `packages/server/src/services/auth.ts:12` still reads
  `process.env.JWT_SECRET || "your-secret-key"`, so a future environment regression
  fails silently and insecurely again rather than refusing to start. The review's
  remediation — throw on startup — has not been applied.
- **C2 — world-writable `/var/data` in the production container.** Moot in practice:
  deploys have run on the VPS via pm2 since 2026-03-28 and nothing builds the
  `Dockerfile` any more. The file is still in the repo with the `chmod 777`.
- **H1 — unauthenticated debug endpoint listing uploads.** Fixed 2026-07-30.
- **L7 — webhook deploy endpoint relying on one shared secret.** Resolved by removing
  the webhook entirely.

The rest are open. Notably **H2 (open CORS), H3 (no rate limiting on auth) and H6 (no
security headers)** are unaddressed — there is no `helmet` or `express-rate-limit` in
`packages/server`.

---

## 2026-03-28 – 2026-03-29 — Fly.io out, VPS and pm2 in

- **Deploys moved to the VPS over SSH with pm2** (`deploy-vps.yml`), replacing
  `fly-deploy.yml`. This is the pipeline that everything in the 2026-07-30 entry is
  fixing; it started as 25 lines with no `set -e` and no verification.
- **`nvm`/`pnpm` were not on the PATH** in a non-interactive SSH session, and the
  first deploy had no existing pm2 app to restart. Fixed by sourcing nvm and using
  `startOrRestart`.
- **Build order in the workflow corrected** — `@ting/shared` has to be built before
  the server and client can compile against it. The same commit dropped the
  `/api/locations` route by accident; it was restored the next day.
- **No workflow runs the tests.** The three-layer test setup added in this period
  (Vitest unit, Vitest browser, Playwright E2E) runs locally only — neither deploy
  workflow invokes it, so a deploy can go green on code that fails its own suite.
- Fly.io and Render leftovers deleted: `fly.toml`, `.flyignore`, `deploy.ps1`,
  `DEPLOYMENT.md`, `FLY_QUICK_REF.md`. Remaining references in env examples and docs
  were cleaned out later, on 2026-06-07.

---

## 2026-03-16 – 2026-03-17 — Container deploys (historical)

The first deployment attempts, superseded within two weeks and kept here only so the
`Dockerfile` and the `/var/data` layout have an origin.

- Fly.io deploy via Docker, then a switch to Render.
- **The database was moved to `/var/data`** so it would survive container replacement
  on Render. Production still keeps its SQLite database and uploads there, which is
  why that path appears throughout this file.
- Prisma had to be a real dependency and be invoked with `npx`, `openssl` added to the
  image, and the client build output directory corrected — the usual round of
  container fixes.
- Image upload and API calls were pointing at `localhost` in production.
