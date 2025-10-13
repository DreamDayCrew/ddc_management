# Simple Node.js startup script for EB
# This ensures the application starts correctly

cd /var/app/current
npm run build 2>&1
npm start