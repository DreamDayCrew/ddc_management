# AWS Amplify Deployment Guide for DDC Management

## 🚨 Important Note
Your project is a **full-stack Node.js Express application**. AWS Amplify is optimized for **static sites and serverless functions**. While possible, it may not be the ideal choice.

## 🎯 Better Alternatives:
1. **AWS Elastic Beanstalk** - Perfect for Node.js/Express apps
2. **AWS App Runner** - Containerized applications
3. **AWS ECS/Fargate** - Full container orchestration

## 📋 If You Still Want Amplify:

### Step 1: AWS Amplify Console Setup

1. **Go to AWS Amplify Console**
   - Navigate to https://console.aws.amazon.com/amplify/
   - Click "Create app" → "Host web app"

2. **Connect Repository**
   - Choose "GitHub"
   - Select your repository: `DreamDayCrew/ddc_management`
   - Branch: `Phase_1`
   - Click "Next"

3. **Build Settings**
   - Amplify should detect the `amplify.yml` file
   - If not, paste the contents from your `amplify.yml`

### Step 2: Environment Variables

In Amplify Console → App Settings → Environment Variables, add:

```
DATABASE_URL = postgresql://neondb_owner:npg_O6P5wsmlIjHc@ep-raspy-mouse-adpwqb3e-pooler.c-2.us-east-1.aws.neon.tech/ddc_db?sslmode=require&channel_binding=require
NODE_ENV = production
SESSION_SECRET = your-secure-session-secret-here
PORT = 3000
DISABLE_DB_SEEDING = true
AWS_REGION = us-east-1
```

### Step 3: Build Configuration

Your `amplify.yml` is configured to:
- Install dependencies
- Build the application
- Run database migrations
- Deploy both frontend and backend

### Step 4: Deploy

1. Click "Save and deploy"
2. Monitor the build process
3. Amplify will provide you with a URL like: `https://branch-name.appid.amplifyapp.com`

## ⚠️ Potential Issues with Amplify:

1. **Cold Starts**: Lambda functions have cold start delays
2. **Timeout Limits**: 15-minute maximum execution time
3. **Memory Limits**: May need adjustment for your app
4. **WebSocket Support**: Limited support for real-time features
5. **File System**: Read-only except `/tmp` directory

## 🔄 Alternative: Quick Elastic Beanstalk Setup

If Amplify doesn't work well, here's a quick EB setup:

```bash
# Install EB CLI
pip install awsebcli

# Initialize (make sure you have AWS permissions first)
eb init -p docker ddc-management

# Create environment
eb create ddc-management-prod

# Set environment variables
eb setenv DATABASE_URL="your-neon-db-url" NODE_ENV="production"

# Deploy
eb deploy
```

## 📞 Recommendation

Given your architecture (Express + PostgreSQL + Real-time features), I recommend:

1. **First Choice**: AWS Elastic Beanstalk with Docker
2. **Second Choice**: AWS App Runner
3. **Third Choice**: AWS Amplify (current setup)

Would you like me to help you set up any of these alternatives?