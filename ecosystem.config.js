// PM2 Ecosystem Configuration for Production
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'pricing-backend',
      cwd: './backend',
      script: 'venv/bin/python',
      args: 'app/main.py',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PYTHONPATH: './backend',
        PYTHONUNBUFFERED: '1'
      },
      instances: 2,  // Run 2 instances for load balancing
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: '/var/log/pricing-workflow/backend-error.log',
      out_file: '/var/log/pricing-workflow/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000
    },
    {
      name: 'pricing-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run preview -- --port 5173 --host 0.0.0.0',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pricing-workflow/frontend-error.log',
      out_file: '/var/log/pricing-workflow/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],

  deploy: {
    production: {
      user: 'pricingapp',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/pricing-workflow-poc.git',
      path: '/home/pricingapp/pricing-workflow-poc',
      'pre-deploy': 'git fetch --all',
      'post-deploy': 'cd backend && source venv/bin/activate && pip install -r requirements.txt && cd ../frontend && npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};
