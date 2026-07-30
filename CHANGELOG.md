# Changelog

Operational changes: deploy pipeline, process management, secrets, infrastructure.

Feature and release history lives in [VERSJONERING.md](VERSJONERING.md) — that file
tracks what users see, versioned `v0.1`, `v0.2`, … This one tracks what runs and how
it gets there, dated rather than versioned, newest first. Entries marked **VPS** are
changes to the server itself and are not reproducible from this repo alone.

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
