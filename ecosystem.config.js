module.exports = {
  apps: [{
    name: 'ecommerce-api',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',

    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },

    // Auto restart
    watch: false,
    max_memory_restart: '500M',

    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true,

    // Auto restart on crash
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,

    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    wait_ready: true,

    // Health check
    exp_backoff_restart_delay: 100,

    // Source map support
    node_args: '--enable-source-maps',

    // Instance var
    instance_var: 'INSTANCE_ID'
  }]
};