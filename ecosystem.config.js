module.exports = {
  apps: [
    {
      name: 'downloadcenter',
      script: 'server.js',
      cwd: '/var/www/downloadcenter',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
