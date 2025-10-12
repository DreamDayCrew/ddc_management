# AWS RDS Setup Instructions

## 1. Create RDS PostgreSQL Instance

### Via AWS Console:
1. Go to AWS RDS Console
2. Click "Create database"
3. Choose "Standard create"
4. Engine: PostgreSQL (latest version)
5. Template: Production (or Dev/Test for testing)
6. DB instance identifier: ddc-management-db
7. Master username: ddcadmin
8. Master password: (set secure password)
9. DB instance class: db.t3.micro (for testing) or db.t3.small+ (production)
10. Storage: 20 GB GP2 (adjust as needed)
11. VPC: Default or create new
12. Public access: Yes (for initial setup, secure later)
13. VPC security group: Create new with PostgreSQL port 5432
14. Create database

### Via AWS CLI:
```bash
aws rds create-db-instance \
    --db-instance-identifier ddc-management-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username ddcadmin \
    --master-user-password YOUR_SECURE_PASSWORD \
    --allocated-storage 20 \
    --vpc-security-group-ids sg-xxxxxxxxx \
    --backup-retention-period 7 \
    --multi-az \
    --storage-encrypted
```

## 2. Security Group Configuration
- Inbound Rules:
  - Type: PostgreSQL
  - Protocol: TCP
  - Port: 5432
  - Source: Your EC2 security group or 0.0.0.0/0 (less secure)

## 3. Get Connection Details
After RDS instance is created:
- Endpoint: ddc-management-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
- Port: 5432
- Database name: postgres (default) or create custom database

## 4. Connection String Format:
DATABASE_URL="postgresql://ddcadmin:YOUR_PASSWORD@ddc-management-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432/ddc_management"