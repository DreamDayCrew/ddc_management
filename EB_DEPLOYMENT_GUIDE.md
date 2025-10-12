# AWS Elastic Beanstalk Deployment Guide

## 🎯 Overview
Your DDC Management application is now configured for AWS Elastic Beanstalk deployment. EB is perfect for Node.js/Express applications with PostgreSQL.

## 📋 Prerequisites
1. AWS CLI configured with proper permissions
2. EB CLI installed: `pip install awsebcli`
3. Neon Database connection string ready

## 🚀 Deployment Steps

### Step 1: Initialize Elastic Beanstalk Application
```bash
# Navigate to project directory
cd /home/kumudha/ddc/ddc_management

# Initialize EB application
eb init

# Configuration options:
# - Region: us-east-1 (to match your Neon DB)
# - Platform: Node.js
# - Application name: ddc-management
# - Setup SSH: Yes (recommended)
```

### Step 2: Create Environment
```bash
# Create production environment
eb create ddc-management-prod

# This will:
# - Create Load Balancer
# - Launch EC2 instance(s)
# - Set up Auto Scaling
# - Configure Security Groups
```

### Step 3: Set Environment Variables
```bash
# Set all required environment variables
eb setenv \
  DATABASE_URL="postgresql://neondb_owner:npg_O6P5wsmlIjHc@ep-raspy-mouse-adpwqb3e-pooler.c-2.us-east-1.aws.neon.tech/ddc_db?sslmode=require&channel_binding=require" \
  NODE_ENV="production" \
  SESSION_SECRET="your-secure-256-bit-session-secret" \
  DISABLE_DB_SEEDING="false" \
  LOG_LEVEL="info"
```

### Step 4: Deploy Application
```bash
# Deploy your application
eb deploy

# Monitor deployment
eb status
eb logs
```

### Step 5: Access Your Application
```bash
# Open application in browser
eb open

# Get application URL
eb status | grep CNAME
```

## 🔧 Configuration Files Created

### `.ebextensions/01-nodejs.config`
- Node.js runtime configuration
- Static file serving
- Health monitoring
- Auto scaling settings

### `.ebextensions/02-commands.config`
- Build commands
- Database migration
- Node.js version management

### Package.json Updates
- Added `eb:start` script for EB-specific startup
- Added `postinstall` hook for automatic builds
- Optimized for production deployment

## 🌐 Production Environment Variables

Set these in EB Console (Configuration → Software → Environment properties):

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Your Neon database connection string |
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | Secure random 256-bit string |
| `PORT` | `8080` (EB default) |
| `DISABLE_DB_SEEDING` | `false` |
| `AWS_REGION` | `us-east-1` |

## 🔍 Monitoring & Troubleshooting

### Check Application Health
```bash
eb health
eb status
```

### View Logs
```bash
eb logs
eb logs --all
```

### SSH into Instance
```bash
eb ssh
```

### Update Application
```bash
# After making changes
git add .
git commit -m "Update application"
eb deploy
```

## 🔄 Rollback if Needed
```bash
# List application versions
eb appversion

# Deploy previous version
eb deploy --version-label [previous-version]
```

## 💡 Benefits of Elastic Beanstalk for Your App

1. **✅ Perfect for Express.js** - Native Node.js support
2. **✅ Auto Scaling** - Handles traffic spikes automatically
3. **✅ Load Balancing** - Built-in application load balancer
4. **✅ Health Monitoring** - Automatic health checks and recovery
5. **✅ Easy Updates** - Blue-green deployments
6. **✅ Database Integration** - Works perfectly with external PostgreSQL
7. **✅ Logging & Monitoring** - CloudWatch integration
8. **✅ SSL/HTTPS** - Easy SSL certificate management

## 🎯 Next Steps After Deployment

1. **Configure Custom Domain** (if needed)
2. **Set up SSL Certificate**
3. **Configure Auto Scaling policies**
4. **Set up monitoring alerts**
5. **Configure backup strategy**

## 📞 Support
If you encounter issues:
1. Check `eb logs` for application errors
2. Verify environment variables in EB Console
3. Test database connection from EB instance
4. Check security group settings for database access