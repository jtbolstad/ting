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
        PORT: 3001,
        DATABASE_URL: "file:/var/data/db.sqlite",
      },
      env_file: "/var/www/ting/packages/server/.env",
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
