module.exports = {
  apps: [
    {
      name: 'yeti-frontend',
      cwd: '/app/yeti-frontend2',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || '3000',
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      merge_logs: true,
      log_type: 'json',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'orderbook-server',
      cwd: '/app/orderbook-server',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.ORDERBOOK_PORT || '3002',
        DB_PATH: '/app/orderbook-server/data/orders.db',
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      merge_logs: true,
      log_type: 'json',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}; 