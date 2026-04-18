# Local Deploy via GitHub Webhook + PM2

## Current State (2026-03-28)

### Done
- [x] **PM2 installed** — `ting` app running (pid 898, uptime 2h, port 3001)
- [x] **Nginx** — configured with SSL (Let's Encrypt), proxying `ting.hpvel.no` → `localhost:3001`
- [x] **`/home/deploy/webhook.js`** — Node.js webhook listener (port 9000, localhost only)
  - Verifies GitHub HMAC-SHA256 signature
  - Filters by branch (default: `main`)
  - Runs `deploy.sh` on valid push, with concurrency lock
- [x] **`/home/deploy/deploy.sh`** — `git pull` → `pnpm install` → `pnpm build` → `pm2 restart ting`
- [x] **`/home/deploy/.env`** — `WEBHOOK_SECRET`, `WEBHOOK_PORT=9000`, `WEBHOOK_BRANCH=main` set
- [x] **`/var/www/ting/ecosystem.config.js`** — defines both `ting` and `webhook` PM2 apps
- [x] **`deploy.sh` fixed** — removed `sudo` from `pm2 restart ting`
- [x] **Nginx `/deploy` route** — proxies `https://ting.hpvel.no/deploy` → `127.0.0.1:9000`
- [x] **Webhook PM2 process running** — `Webhook listener on 127.0.0.1:9000` confirmed
- [x] **PM2 saved + startup enabled** — survives reboots (`pm2-root` systemd service enabled)

---

## Remaining Steps

### 1. Configure GitHub webhook
In the GitHub repo → Settings → Webhooks → Add webhook:
- **Payload URL**: `https://ting.hpvel.no/deploy`
- **Content type**: `application/json`
- **Secret**: value from `/home/deploy/.env` (`WEBHOOK_SECRET`)
- **Events**: Just the push event
- **Active**: checked

### 2. Test the full pipeline
```bash
# Watch logs in one terminal:
pm2 logs webhook --lines 0 -f

# In another terminal, make a small change, commit, and push to main
git commit --allow-empty -m "test deploy hook"
git push origin main
```

GitHub should POST to `/deploy` → nginx proxies to port 9000 → `deploy.sh` runs → `ting` restarts.

---

## Architecture Summary

```
GitHub push (main)
    │
    ▼
POST https://ting.hpvel.no/deploy
    │
    ▼
Nginx (port 443, SSL)
    │
    ▼
webhook.js (127.0.0.1:9000) — verifies HMAC secret
    │
    ▼
/home/deploy/deploy.sh
    ├── git pull /var/www/ting
    ├── pnpm install --frozen-lockfile
    ├── pnpm build (all packages)
    └── pm2 restart ting
```
