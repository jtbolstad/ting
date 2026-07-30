const fs = require("node:fs");

// pm2's `env_file` option is silently ignored on pm2 6.0.14: an app started
// from this file with env_file set had none of the file's variables in its
// environment, which is how production ran for months signing JWTs with the
// `|| "your-secret-key"` fallback in services/auth.ts. So read the file here,
// where it is just JS that pm2 evaluates at start time. Secrets stay in these
// .env files and out of this tracked config.
//
// Only read at `pm2 start`, never at `pm2 restart` — the deploy workflows go
// through ecosystem.config.js for exactly that reason.
function envFile(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    // A missing .env must not break the start: the env{} blocks below still
    // supply everything the app strictly needs to boot.
    return {};
  }
  const vars = {};
  for (const line of raw.split("\n")) {
    // Anchored on KEY=, so blank lines and # comments simply don't match.
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    // Strip one matching pair of surrounding quotes: the .env files write
    // DATABASE_URL="file:/var/data/db.sqlite", and the quotes are not part
    // of the value.
    vars[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
  return vars;
}

module.exports = {
  apps: [
    {
      name: "webhook",
      script: "/home/deploy/webhook.js",
      cwd: "/home/deploy",
      env: {
        WEBHOOK_SECRET: "f736d26461e685d28b849085ea0182b43ef67513e1004b0d5e6e900514a49c94",
        WEBHOOK_PORT: 9000,
        WEBHOOK_BRANCH: "main",
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      // Production runs in ROOT's pm2 daemon. deploy-vps.yml reaches it through
      // sudo /usr/local/sbin/ting-deploy-restart, which starts this entry so
      // the env below is re-evaluated.
      name: "ting",
      script: "./packages/server/dist/src/index.js",
      cwd: "/var/www/ting",
      env: {
        // Spread first, so the explicit values below always win. That ordering
        // is deliberate: a stray NODE_ENV=development in .env must not be able
        // to flip production out of serving the built client.
        ...envFile("/var/www/ting/packages/server/.env"),
        NODE_ENV: "production",
        APP_ENV: "production",
        PORT: 3001,
        DATABASE_URL: "file:/var/data/db.sqlite",
        UPLOADS_DIR: "/var/data/uploads",
        // Read from the shell that starts pm2; the sudo wrapper exports it.
        GIT_COMMIT: process.env.GIT_COMMIT || "",
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      // Stage: same VPS, own port, own checkout, own database and uploads.
      // Started by deploy-stage.yml under the DEPLOY user's pm2 daemon, not
      // root's — /var/data/stage is deploy-owned. Don't `pm2 start` this entry
      // as root; two daemons fighting over port 3002 is invisible except as a
      // stale commit in /health.
      // Runs NODE_ENV=production so the built client is served, but APP_ENV
      // marks it as stage (noindex header, banner, /health reporting).
      // SMTP_HOST is deliberately absent from its .env — the email service
      // then logs instead of sending, so tests never mail real members.
      name: "ting-stage",
      script: "./packages/server/dist/src/index.js",
      cwd: "/var/www/ting-stage",
      env: {
        // Same precedence rule as production above: .env first, explicit last.
        ...envFile("/var/www/ting-stage/packages/server/.env"),
        NODE_ENV: "production",
        APP_ENV: "stage",
        PORT: 3002,
        DATABASE_URL: "file:/var/data/stage/db.sqlite",
        UPLOADS_DIR: "/var/data/stage/uploads",
        // Read from the deploying shell; set by deploy-stage.yml before pm2 start.
        GIT_COMMIT: process.env.GIT_COMMIT || "",
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
