module.exports = {
  apps: [
    {
      name: "codefied-api",
      cwd: __dirname,
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "450M",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        NODE_OPTIONS: "--max-old-space-size=384",
      },
    },
  ],
};