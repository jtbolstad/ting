# Staging Environment — One-Time VPS Setup

The repo side of staging is done (PM2 app, `deploy-staging.yml`, `refresh-staging-db.sh`, banner, `/health`). These steps run once on the VPS and need `sudo` — the deploy workflow cannot do them.

Target: `staging.ting.hpvel.no` → `127.0.0.1:3002` → PM2 `ting-staging` in `/var/www/ting-staging`, branch `staging`.

## 1. Branch

```bash
# locally
git checkout -b staging && git push -u origin staging
```

Push after the VPS is provisioned, or the first workflow run will fail its health check.

## 2. DNS

`A` record `staging.ting.hpvel.no` → the VPS IP. Wait for it to resolve before running certbot.

## 3. Checkout and data directories

```bash
sudo git clone -b staging <repo-url> /var/www/ting-staging
sudo mkdir -p /var/data/staging/uploads
sudo chown -R deploy:deploy /var/www/ting-staging /var/data/staging
```

Use the same user as `secrets.VPS_USER`, since the workflow SSHes in as that user.

## 4. Staging `.env`

```bash
sudo -u deploy tee /var/www/ting-staging/packages/server/.env >/dev/null <<EOF
JWT_SECRET="$(openssl rand -hex 32)"
EOF
sudo chmod 600 /var/www/ting-staging/packages/server/.env
```

A **fresh** `JWT_SECRET`, different from production, so a token from one environment is not valid in the other.

This step is not optional. `packages/server/src/services/auth.ts:12` still reads

```ts
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
```

so if the staging `.env` is missing, unreadable by the PM2 user, or has a typo, the app starts normally and signs every token with the publicly known string `"your-secret-key"`. Anyone could then forge a platform-admin token against a host that holds pseudonymized production data. This is finding **C1** in `planning/security-review.md`, still unremediated; adding a second deployment makes a second chance to trip over it. Verify after starting (step 7) rather than assuming.

Do not add `SMTP_HOST` here. Its absence is what keeps staging from emailing real members (see `packages/server/src/services/email.ts`). `NODE_ENV`, `APP_ENV`, `PORT`, `DATABASE_URL` and `UPLOADS_DIR` all come from `ecosystem.config.js` — don't duplicate them.

Note that this file gets loaded twice by two independent mechanisms: PM2's `env_file`, and `@prisma/client`, which reads `packages/server/.env` as an import side effect. Both resolve relative to the checkout, so staging only ever sees its own file — but it does mean the `.env` is read even if the PM2 `env_file` line is removed. Values already present in the environment win, so the `ecosystem.config.js` settings above are not overridden by it.

## 5. nginx vhost

Mirror the production block, changing only the server name and upstream port:

```nginx
server {
    server_name staging.ting.hpvel.no;
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
sudo ln -s /etc/nginx/sites-available/ting-staging /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d staging.ting.hpvel.no
```

## 6. First build and start

```bash
sudo -u deploy bash -lc '
  cd /var/www/ting-staging
  pnpm install --frozen-lockfile
  pnpm --filter @ting/shared build
  pnpm --filter @ting/server exec prisma generate
  pnpm --filter @ting/server exec prisma migrate deploy
  pnpm --filter @ting/server build
  VITE_APP_ENV=staging pnpm --filter @ting/client build
  pm2 start ecosystem.config.js --only ting-staging
  pm2 save
'
```

`migrate deploy` on an empty `/var/data/staging/db.sqlite` creates the schema. Populate it with `scripts/refresh-staging-db.sh` (see README) or `pnpm --filter @ting/server db:seed`.

## 7. Verify

```bash
curl -s https://staging.ting.hpvel.no/health   # env: "staging", commit: <sha>
curl -sI https://staging.ting.hpvel.no/ | grep -i x-robots-tag
curl -s https://ting.hpvel.no/health           # env: "production", unaffected
pm2 list                                       # ting and ting-staging both online

# Confirm the staging process actually picked up its JWT_SECRET (see step 4).
# Empty output, or "your-secret-key", means the .env was not loaded.
pm2 env $(pm2 id ting-staging | tr -d '[]') | grep '^JWT_SECRET'
```

Then upload an image on staging and confirm the file lands in `/var/data/staging/uploads` and **not** in `/var/data/uploads`. That is the isolation check that matters most — before the `UPLOADS_DIR` change in `packages/server/src/index.ts`, staging would have written into the production uploads directory.

## 8. Optional: restrict access

The staging database holds pseudonymized but still inference-identifiable production data. Consider basic auth on the vhost:

```bash
sudo htpasswd -c /etc/nginx/.htpasswd-staging tester
```

```nginx
auth_basic "Staging";
auth_basic_user_file /etc/nginx/.htpasswd-staging;

location = /health {                  # exempt, or the deploy check gets a 401
    auth_basic off;
    proxy_pass http://127.0.0.1:3002;
}
```

Playwright runs would then need `PLAYWRIGHT_BASE_URL=https://tester:pass@staging.ting.hpvel.no`.

## Known issue, unrelated to staging

`ecosystem.config.js` line 8 has a real 64-hex-character `WEBHOOK_SECRET` committed to git, and the file is tracked. That token authenticates deploy triggers to `webhook.js`, and a redeploy with controlled repo content is remote code execution — the impact half of finding **L7** in `planning/security-review.md`, which assumed the secret was only *potentially* leaked rather than sitting in the repository.

Rotating it means all of: generate a new value, write it to `/home/deploy/.env` on the VPS, update the webhook configuration in GitHub, remove the literal from `ecosystem.config.js` so PM2 reads it from `env_file`, and treat the old value as burned regardless of whether git history is rewritten. Independent of the staging work, but worth doing before a second environment shares the box.
