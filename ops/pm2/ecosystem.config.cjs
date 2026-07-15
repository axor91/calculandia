module.exports = {
  apps: [
    {
      name: "calculandia-web",
      cwd: "/var/www/calculandia/current",
      script: "server.js",
      interpreter: "/opt/nodejs/node-v22.22.2-linux-x64/bin/node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      kill_timeout: 10_000,
      listen_timeout: 10_000,
      wait_ready: false,
      time: true,
      out_file: "/var/lib/calculandia/logs/application.log",
      error_file: "/var/lib/calculandia/logs/application-error.log",
      merge_logs: true,
      env: {
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: "3212",
        NEXT_PUBLIC_SITE_URL: "https://calculandia.ru",
      },
    },
  ],
};
