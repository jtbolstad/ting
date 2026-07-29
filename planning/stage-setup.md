# Stage Environment — One-Time VPS Setup

The repo side of stage is done (PM2 app, `deploy-stage.yml`, `refresh-stage-db.sh`, banner, `/health`). These steps run once on the VPS and need `sudo` — the deploy workflow cannot do them.

Target: `stage.ting.hpvel.no` → `127.0.0.1:3002` → PM2 `ting-stage` in `/var/www/ting-stage`, branch `stage`.

## 1. Branch

```bash
# locally
git checkout -b stage && git push -u origin stage
```

Push after the VPS is provisioned, or the first workflow run will fail its health check.

## 2. DNS

`A` record `stage.ting.hpvel.no` → the VPS IP. Wait for it to resolve before running certbot.

## 3. Checkout and data directories

```bash
sudo git clone -b stage <repo-url> /var/www/ting-stage
sudo mkdir -p /var/data/stage/uploads
sudo chown -R deploy:deploy /var/www/ting-stage /var/data/stage
```

Use the same user as `secrets.VPS_USER`, since the workflow SSHes in as that user.

## 4. Stage `.env`

```bash
sudo -u deploy tee /var/www/ting-stage/packages/server/.env >/dev/null <<EOF
JWT_SECRET="$(openssl rand -hex 32)"
DATABASE_URL="file:/var/data/stage/db.sqlite"
EOF
sudo chmod 600 /var/www/ting-stage/packages/server/.env
```

A **fresh** `JWT_SECRET`, different from production, so a token from one environment is not valid in the other.

This step is not optional. `packages/server/src/services/auth.ts:12` still reads

```ts
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
```

so if the stage `.env` is missing, unreadable by the PM2 user, or has a typo, the app starts normally and signs every token with the publicly known string `"your-secret-key"`. Anyone could then forge a platform-admin token against a host that holds pseudonymized production data. This is finding **C1** in `planning/security-review.md`, still unremediated; adding a second deployment makes a second chance to trip over it. Verify after starting (step 7) rather than assuming.

`DATABASE_URL` must also be here. `ecosystem.config.js` injects it into the PM2-managed server process, but the deploy workflow runs `prisma migrate deploy` as a plain shell command — Prisma CLI reads `.env` directly and never sees PM2's env. Omitting it causes every CI deploy to fail at the migrate step with `P1012: Environment variable not found: DATABASE_URL`.

Do not add `SMTP_HOST` here. Its absence is what keeps stage from emailing real members (see `packages/server/src/services/email.ts`). `NODE_ENV`, `APP_ENV`, `PORT`, and `UPLOADS_DIR` all come from `ecosystem.config.js` — don't duplicate them.

Note that this file gets loaded twice by two independent mechanisms: PM2's `env_file`, and `@prisma/client`, which reads `packages/server/.env` as an import side effect. Both resolve relative to the checkout, so stage only ever sees its own file — but it does mean the `.env` is read even if the PM2 `env_file` line is removed. Values already present in the environment win, so the `ecosystem.config.js` settings above are not overridden by it.

## 5. nginx vhost

Mirror the production block, changing only the server name and upstream port:

Create it as **HTTP only**. Certbot adds the `listen 443`, the certificate paths and the HTTPS redirect itself in the next step.

```nginx
server {
    listen 80;
    server_name stage.ting.hpvel.no;
    client_max_body_size 25M;          # PDF manuals are up to 20 MB; match whatever prod uses

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Do **not** copy the production `/deploy` webhook route into this vhost — one webhook listener is enough, and a second entry point to `deploy.sh` is a second thing to secure.

```bash
sudo ln -s /etc/nginx/sites-available/ting-stage /etc/nginx/sites-enabled/
sudo nginx -t                       # check BEFORE reloading — the reload also affects prod
sudo systemctl reload nginx
```

### Certificate (Let's Encrypt)

The vhost above must exist and be reloaded first. Two reasons:

1. Without a server block matching `stage.ting.hpvel.no`, requests fall through to the default server — which is production. Verified on 2026-07-30: `https://stage.ting.hpvel.no/health` returned production's response while presenting prod's certificate (`CN=ting.hpvel.no`, SAN `ting.hpvel.no` only).
2. That default server 301-redirects HTTP to HTTPS, which can intercept the `/.well-known/acme-challenge/` fetch that HTTP-01 validation depends on. An exact `server_name` match takes precedence over `default_server`, so the stage vhost fixes it.

With no matching vhost, `certbot --nginx` may also offer to add the name to **production's** certificate. Don't — a shared lineage means one renewal failure affects both hosts.

Dry run first. Let's Encrypt permits 5 duplicate certificates per week for an identical name set, and 5 failed validations per hostname per hour, so a retry loop can lock you out for the week:

```bash
sudo certbot certonly --nginx --dry-run -d stage.ting.hpvel.no
```

Then the real issuance:

```bash
sudo certbot --nginx -d stage.ting.hpvel.no --redirect -n --agree-tos -m jtbolstad@gmail.com
sudo certbot certificates                      # expect a lineage separate from ting.hpvel.no
sudo systemctl list-timers | grep -i certbot    # renewal timer active
sudo certbot renew --dry-run
```

The certificate will validate before anything is listening on :3002, so the vhost returns 502 until step 6 starts `ting-stage`. That is expected and not a certificate problem.

## 6. First build and start

```bash
sudo -u deploy bash -lc '
  cd /var/www/ting-stage
  pnpm install --frozen-lockfile
  pnpm --filter @ting/shared build
  pnpm --filter @ting/server exec prisma generate
  pnpm --filter @ting/server exec prisma migrate deploy
  pnpm --filter @ting/server build
  VITE_APP_ENV=stage pnpm --filter @ting/client build
  pm2 start ecosystem.config.js --only ting-stage
  pm2 save
'
```

`migrate deploy` on an empty `/var/data/stage/db.sqlite` creates the schema. Populate it with `scripts/refresh-stage-db.sh` (see README) or `pnpm --filter @ting/server db:seed`.

## 7. Verify

```bash
curl -s https://stage.ting.hpvel.no/health   # env: "stage", commit: <sha>
curl -sI https://stage.ting.hpvel.no/ | grep -i x-robots-tag
curl -s https://ting.hpvel.no/health           # env: "production", unaffected
pm2 list                                       # ting and ting-stage both online

# Confirm the stage process actually picked up its JWT_SECRET (see step 4).
# Empty output, or "your-secret-key", means the .env was not loaded.
pm2 env $(pm2 id ting-stage | tr -d '[]') | grep '^JWT_SECRET'
```

Then upload an image on stage and confirm the file lands in `/var/data/stage/uploads` and **not** in `/var/data/uploads`. That is the isolation check that matters most — before the `UPLOADS_DIR` change in `packages/server/src/index.ts`, stage would have written into the production uploads directory.

## 8. Optional: restrict access

The stage database holds pseudonymized but still inference-identifiable production data. Consider basic auth on the vhost:

```bash
sudo htpasswd -c /etc/nginx/.htpasswd-stage tester
```

```nginx
auth_basic "Stage";
auth_basic_user_file /etc/nginx/.htpasswd-stage;

location = /health {                  # exempt, or the deploy check gets a 401
    auth_basic off;
    proxy_pass http://127.0.0.1:3002;
}
```

Playwright runs would then need `PLAYWRIGHT_BASE_URL=https://tester:pass@stage.ting.hpvel.no`.

## Known issue, unrelated to stage

`ecosystem.config.js` line 8 has a real 64-hex-character `WEBHOOK_SECRET` committed to git, and the file is tracked. That token authenticates deploy triggers to `webhook.js`, and a redeploy with controlled repo content is remote code execution — the impact half of finding **L7** in `planning/security-review.md`, which assumed the secret was only *potentially* leaked rather than sitting in the repository.

Rotating it means all of: generate a new value, write it to `/home/deploy/.env` on the VPS, update the webhook configuration in GitHub, remove the literal from `ecosystem.config.js` so PM2 reads it from `env_file`, and treat the old value as burned regardless of whether git history is rewritten. Independent of the stage work, but worth doing before a second environment shares the box.
