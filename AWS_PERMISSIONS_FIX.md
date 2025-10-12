# AWS IAM Permissions Required for DDC Management Deployment

## Current Issue:
Your AWS user 'Kumudha' (arn:aws:iam::708467047369:user/Kumudha) lacks permissions for:
- RDS operations
- EC2 operations  
- Elastic Beanstalk operations
- S3 operations

## Required IAM Policies:

### For Development & Deployment:
1. **AWSElasticBeanstalkFullAccess** - For EB deployments
2. **AmazonRDSFullAccess** - For RDS database operations
3. **AmazonEC2FullAccess** - For EC2 instance management
4. **AmazonS3FullAccess** - For S3 bucket operations

### Minimum Required Policies (More Secure):
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "rds:DescribeDBInstances",
                "rds:DescribeDBClusters",
                "rds:DescribeDBSecurityGroups",
                "rds:DescribeDBSubnetGroups",
                "rds:ModifyDBInstance",
                "rds:CreateDBInstance",
                "rds:DeleteDBInstance"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow", 
            "Action": [
                "elasticbeanstalk:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeInstances",
                "ec2:DescribeSecurityGroups",
                "ec2:DescribeVpcs",
                "ec2:DescribeSubnets",
                "ec2:AuthorizeSecurityGroupIngress",
                "ec2:RevokeSecurityGroupIngress"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::elasticbeanstalk-*",
                "arn:aws:s3:::elasticbeanstalk-*/*"
            ]
        }
    ]
}
```

## How to Apply (Ask Your Admin):

### Via AWS Console:
1. Go to IAM → Users → Kumudha
2. Click "Add permissions"
3. Choose "Attach existing policies directly"
4. Search and select the policies above
5. Click "Add permissions"

### Via AWS CLI (Admin must run):
```bash
# Attach full access policies (easier but less secure)
aws iam attach-user-policy --user-name Kumudha --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkFullAccess
aws iam attach-user-policy --user-name Kumudha --policy-arn arn:aws:iam::aws:policy/AmazonRDSFullAccess
aws iam attach-user-policy --user-name Kumudha --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess
aws iam attach-user-policy --user-name Kumudha --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

## Who Can Fix This:
- AWS Account Owner
- IAM Administrator
- User with IAM permissions to modify policies

## What to Send to Your Admin:
"Please attach the following AWS managed policies to user 'Kumudha':
- AWSElasticBeanstalkFullAccess  
- AmazonRDSFullAccess
- AmazonEC2FullAccess
- AmazonS3FullAccess

This is needed for deploying our DDC Management application to AWS."