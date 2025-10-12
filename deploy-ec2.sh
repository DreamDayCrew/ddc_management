#!/bin/bash
# Automated Deployment Script for EC2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 DDC Management - EC2 Deployment Script${NC}"

# Check if running on EC2
if ! command -v aws &> /dev/null; then
    echo -e "${YELLOW}⚠️  This script should be run on an EC2 instance${NC}"
fi

# Update system
echo -e "${GREEN}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo -e "${GREEN}📦 Installing Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo -e "${GREEN}📦 Installing PM2...${NC}"
sudo npm install -g pm2

# Clone repository if not exists
if [ ! -d "ddc_management" ]; then
    echo -e "${GREEN}📥 Cloning repository...${NC}"
    git clone https://github.com/DreamDayCrew/ddc_management.git
    cd ddc_management
    git checkout Phase_1
else
    echo -e "${GREEN}🔄 Updating repository...${NC}"
    cd ddc_management
    git pull origin Phase_1
fi

# Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
npm ci

# Build application
echo -e "${GREEN}🔨 Building application...${NC}"
npm run build

# Create production environment
echo -e "${GREEN}⚙️  Creating production environment...${NC}"
cat > .env << EOF
DATABASE_URL="postgresql://neondb_owner:npg_O6P5wsmlIjHc@ep-raspy-mouse-adpwqb3e-pooler.c-2.us-east-1.aws.neon.tech/ddc_db?sslmode=require&channel_binding=require"
NODE_ENV="production"
SESSION_SECRET="$(openssl rand -base64 32)"
PORT=5000
DISABLE_DB_SEEDING=false
LOG_LEVEL="info"
EOF

# Run database migration
echo -e "${GREEN}🗃️  Running database migration...${NC}"
npm run db:push

# Start/Restart application with PM2
echo -e "${GREEN}🚀 Starting application...${NC}"
pm2 delete ddc-management 2>/dev/null || true
pm2 start dist/index.js --name "ddc-management"
pm2 startup ubuntu -u $USER --hp /home/$USER
pm2 save

# Install and configure Nginx
echo -e "${GREEN}🌐 Setting up Nginx...${NC}"
sudo apt install nginx -y

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/ddc-management << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Serve static files directly
    location /assets/ {
        alias /home/$USER/ddc_management/dist/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/ddc-management /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Start services
sudo systemctl enable nginx
sudo systemctl start nginx

# Get EC2 public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application is running at: http://$PUBLIC_IP${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "   1. Configure your domain DNS to point to: $PUBLIC_IP"
echo -e "   2. Setup SSL certificate with: sudo certbot --nginx"
echo -e "   3. Monitor logs with: pm2 logs ddc-management"
echo -e "   4. Check status with: pm2 status"