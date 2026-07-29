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
      name: "ting",
      script: "./packages/server/dist/src/index.js",
      cwd: "/var/www/ting",
      env: {
        NODE_ENV: "production",
        APP_ENV: "production",
        PORT: 3001,
        DATABASE_URL: "file:/var/data/db.sqlite",
        UPLOADS_DIR: "/var/data/uploads",
      },
      env_file: "/var/www/ting/packages/server/.env",
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      // Staging: same VPS, own port, own checkout, own database and uploads.
      // Runs NODE_ENV=production so the built client is served, but APP_ENV
      // marks it as staging (noindex header, banner, /health reporting).
      // SMTP_HOST is deliberately absent from its .env — the email service
      // then logs instead of sending, so tests never mail real members.
      name: "ting-staging",
      script: "./packages/server/dist/src/index.js",
      cwd: "/var/www/ting-staging",
      env: {
        NODE_ENV: "production",
        APP_ENV: "staging",
        PORT: 3002,
        DATABASE_URL: "file:/var/data/staging/db.sqlite",
        UPLOADS_DIR: "/var/data/staging/uploads",
      },
      env_file: "/var/www/ting-staging/packages/server/.env",
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
