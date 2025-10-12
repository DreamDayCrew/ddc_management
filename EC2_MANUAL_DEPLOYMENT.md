# Manual EC2 Deployment Guide (Alternative to EB)
# Use this while waiting for EB permissions

## 🚀 Quick EC2 Deployment Steps

### Step 1: Launch EC2 Instance
1. Go to EC2 Console: https://console.aws.amazon.com/ec2/
2. Click "Launch Instance"
3. Choose: Ubuntu Server 22.04 LTS (Free Tier)
4. Instance Type: t2.micro (or t3.small for better performance)
5. Create or select Key Pair for SSH
6. Security Group: Allow HTTP (80), HTTPS (443), SSH (22)
7. Launch Instance

### Step 2: Connect to EC2 Instance
```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y
```

### Step 3: Deploy Your Application
```bash
# Clone your repository
git clone https://github.com/DreamDayCrew/ddc_management.git
cd ddc_management
git checkout Phase_1

# Create production environment file
cat > .env << EOF
DATABASE_URL="postgresql://neondb_owner:npg_O6P5wsmlIjHc@ep-raspy-mouse-adpwqb3e-pooler.c-2.us-east-1.aws.neon.tech/ddc_db?sslmode=require&channel_binding=require"
NODE_ENV="production"
SESSION_SECRET="ec2-production-secret-key"
PORT=5000
DISABLE_DB_SEEDING=false
EOF

# Install dependencies and build
npm ci
npm run build

# Run database migration
npm run db:push

# Start application (using PM2 for production)
sudo npm install -g pm2
pm2 start dist/index.js --name "ddc-management"
pm2 startup
pm2 save

# Setup Nginx reverse proxy
sudo apt install nginx -y
sudo tee /etc/nginx/sites-available/ddc-management << EOF
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or use EC2 IP

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
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/ddc-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: Access Your Application
- HTTP: `http://your-ec2-public-ip`
- If you have a domain: Point DNS to EC2 IP

### Step 5: Setup SSL (Optional)
```bash
# Install Certbot for Let's Encrypt SSL
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com
```

## 🔄 Updates and Maintenance
```bash
# To update your application
cd /home/ubuntu/ddc_management
git pull origin Phase_1
npm ci
npm run build
pm2 restart ddc-management
```

## 💰 Cost Estimate
- t2.micro (Free Tier): $0/month for first year
- t3.small: ~$15/month
- Data Transfer: Minimal for small apps
- Total: $0-20/month vs EB ~$30-50/month