# AWS Deployment Options for DDC Management

## Option 1: AWS Elastic Beanstalk (Recommended for Beginners)

### Advantages:
- Easy deployment and management
- Auto-scaling
- Load balancing
- Health monitoring
- Rolling deployments

### Setup Steps:

#### 1. Install EB CLI:
```bash
pip install awsebcli
```

#### 2. Initialize Elastic Beanstalk:
```bash
cd /path/to/your/project
eb init
# Choose:
# - Region: us-east-1 (or your preferred region)
# - Platform: Docker
# - Application name: ddc-management
```

#### 3. Create Elastic Beanstalk Environment:
```bash
eb create ddc-management-prod
# This will:
# - Create load balancer
# - Launch EC2 instances
# - Set up auto-scaling
```

#### 4. Set Environment Variables:
```bash
eb setenv DATABASE_URL="your-rds-connection-string" \
         NODE_ENV="production" \
         SESSION_SECRET="your-secret-key"
```

#### 5. Deploy:
```bash
eb deploy
```

---

## Option 2: AWS ECS (Elastic Container Service)

### Advantages:
- Better for microservices
- More control over infrastructure
- Cost-effective scaling
- Integration with AWS services

### Setup Steps:

#### 1. Create ECS Cluster:
```bash
aws ecs create-cluster --cluster-name ddc-management-cluster
```

#### 2. Build and Push Docker Image to ECR:
```bash
# Create ECR repository
aws ecr create-repository --repository-name ddc-management

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag image
docker build -t ddc-management .
docker tag ddc-management:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ddc-management:latest

# Push image
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ddc-management:latest
```

#### 3. Create Task Definition and Service (see ecs-task-definition.json)

---

## Option 3: AWS EC2 with Docker

### Advantages:
- Full control
- Cost-effective for single instance
- Easy to debug and manage

### Setup Steps:

#### 1. Launch EC2 Instance:
- AMI: Amazon Linux 2
- Instance Type: t3.small or larger
- Security Groups: Allow HTTP (80), HTTPS (443), SSH (22)
- Key Pair: Create or use existing

#### 2. Connect to Instance and Install Docker:
```bash
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Docker
sudo yum update -y
sudo yum install -y docker git
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 3. Clone and Deploy:
```bash
git clone https://github.com/DreamDayCrew/ddc_management.git
cd ddc_management
git checkout Phase_1

# Create production .env file
cp .env.production .env
# Edit .env with your RDS connection string

# Build and run
docker-compose up -d
```

---

## Recommended Deployment Path:

### For Production: **AWS Elastic Beanstalk**
- Simplest to manage
- Built-in monitoring and scaling
- Easy rollbacks

### For Advanced Users: **AWS ECS**
- Better performance control
- More cost-effective at scale
- Better CI/CD integration