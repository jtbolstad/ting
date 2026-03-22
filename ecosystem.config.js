module.exports = {
  apps: [
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
