
# mySafePlay™(TM) Deployment Guide

## Overview

This comprehensive deployment guide covers the complete process of deploying mySafePlay™(TM) to production environments, including staging setup, environment configuration, AWS service integration, and monitoring setup.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [AWS Services Setup](#aws-services-setup)
5. [Application Deployment](#application-deployment)
6. [SSL & Security Configuration](#ssl--security-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: Version 18.x or higher
- **npm/yarn**: Latest stable version
- **Database**: SQLite (production) or PostgreSQL (enterprise)
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: Minimum 10GB available space
- **SSL Certificate**: Valid SSL certificate for HTTPS

### Required Accounts & Services

- **AWS Account**: For Rekognition, SES, S3 services
- **Email Service**: SendGrid, Mailgun, or AWS SES
- **Domain**: Registered domain with DNS control
- **CDN**: CloudFlare or AWS CloudFront (recommended)

### Development Tools

```bash
# Install required tools
npm install -g @vercel/cli
npm install -g pm2
npm install -g prisma
```

## Environment Setup

### Environment Variables

Create a comprehensive `.env.production` file:

```bash
# Application Configuration
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secure-secret-key-here
PORT=3000

# Database Configuration
DATABASE_URL="file:./production.db"
# For PostgreSQL: DATABASE_URL="postgresql://user:password@localhost:5432/safeplay"

# Authentication & Security
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key
SESSION_SECRET=your-session-secret

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=safeplay-uploads
AWS_CLOUDFRONT_DOMAIN=your-cloudfront-domain.com

# AWS Rekognition (Identity Verification)
AWS_REKOGNITION_ENABLED=true
REKOGNITION_CONFIDENCE_THRESHOLD=85

# Email Service Configuration
EMAIL_SERVICE_PROVIDER=sendgrid
EMAIL_API_KEY=your-email-api-key
EMAIL_FROM_ADDRESS=noreply@your-domain.com
EMAIL_FROM_NAME=mySafePlay™(TM)

# Support System Configuration
SUPPORT_AI_ENABLED=true
SUPPORT_AI_MODEL=gpt-4
SUPPORT_AI_API_KEY=your-ai-api-key
SUPPORT_ESCALATION_THRESHOLD=0.7

# Monitoring & Analytics
SENTRY_DSN=your-sentry-dsn
GOOGLE_ANALYTICS_ID=your-ga-id
MIXPANEL_TOKEN=your-mixpanel-token

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=3600000

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# Demo System Configuration
DEMO_MODE_ENABLED=true
DEMO_DATA_RETENTION_DAYS=30

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=safeplay-backups

# SSL & Security
FORCE_HTTPS=true
HSTS_MAX_AGE=31536000
CSP_ENABLED=true

# Performance
CACHE_ENABLED=true
CACHE_TTL=3600
CDN_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_FILE_PATH=/var/log/safeplay/app.log
```

### Environment Validation

Create an environment validation script:

```typescript
// scripts/validate-environment.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string(),
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  EMAIL_API_KEY: z.string(),
  EMAIL_FROM_ADDRESS: z.string().email(),
});

export function validateEnvironment() {
  try {
    envSchema.parse(process.env);
    console.log(' Environment validation passed');
    return true;
  } catch (error) {
    console.error(' Environment validation failed:', error.errors);
    return false;
  }
}

// Run validation
if (require.main === module) {
  if (!validateEnvironment()) {
    process.exit(1);
  }
}
```

## Database Configuration

### Production Database Setup

```bash
# Initialize production database
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed initial data
npm run seed:production
```

### Database Migration Script

```typescript
// scripts/migrate-production.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runProductionMigrations() {
  console.log('* Starting production database migrations...');
  
  try {
    // Check database connection
    await prisma.$connect();
    console.log(' Database connection established');
    
    // Run migrations
    console.log(' Applying database migrations...');
    // Migrations are applied via `prisma migrate deploy`
    
    // Verify critical tables exist
    const userCount = await prisma.user.count();
    console.log(` Users table verified (${userCount} records)`);
    
    const venueCount = await prisma.venue.count();
    console.log(` Venues table verified (${venueCount} records)`);
    
    console.log(' Production database setup complete');
  } catch (error) {
    console.error(' Database migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runProductionMigrations()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
```

### Database Backup Configuration

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

BACKUP_DIR="/var/backups/safeplay"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="safeplay_backup_${TIMESTAMP}.db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup SQLite database
cp ./production.db "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Upload to S3 (if configured)
if [ ! -z "$BACKUP_S3_BUCKET" ]; then
    aws s3 cp "$BACKUP_DIR/${BACKUP_FILE}.gz" "s3://$BACKUP_S3_BUCKET/database/"
    echo " Backup uploaded to S3"
fi

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "safeplay_backup_*.db.gz" -mtime +30 -delete

echo " Database backup completed: ${BACKUP_FILE}.gz"
```

## AWS Services Setup

### AWS Rekognition Configuration

```typescript
// lib/aws/rekognition.ts
import { RekognitionClient, DetectTextCommand, DetectFacesCommand } from '@aws-sdk/client-rekognition';

export class RekognitionService {
  private client: RekognitionClient;
  
  constructor() {
    this.client = new RekognitionClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  
  async analyzeDocument(imageBuffer: Buffer): Promise<DocumentAnalysisResult> {
    try {
      // Detect text in document
      const textCommand = new DetectTextCommand({
        Image: { Bytes: imageBuffer },
      });
      
      const textResponse = await this.client.send(textCommand);
      
      // Detect faces for identity verification
      const faceCommand = new DetectFacesCommand({
        Image: { Bytes: imageBuffer },
        Attributes: ['ALL'],
      });
      
      const faceResponse = await this.client.send(faceCommand);
      
      return {
        textDetections: textResponse.TextDetections || [],
        faceDetails: faceResponse.FaceDetails || [],
        confidence: this.calculateOverallConfidence(textResponse, faceResponse),
      };
    } catch (error) {
      console.error('Rekognition analysis failed:', error);
      throw new Error('Document analysis failed');
    }
  }
  
  private calculateOverallConfidence(textResponse: any, faceResponse: any): number {
    // Calculate confidence based on text and face detection results
    const textConfidence = textResponse.TextDetections?.reduce((avg: number, detection: any) => 
      avg + (detection.Confidence || 0), 0) / (textResponse.TextDetections?.length || 1);
    
    const faceConfidence = faceResponse.FaceDetails?.[0]?.Confidence || 0;
    
    return Math.min((textConfidence + faceConfidence) / 2, 100);
  }
}
```

### S3 File Upload Configuration

```typescript
// lib/aws/s3.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Service {
  private client: S3Client;
  private bucket: string;
  
  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = process.env.AWS_S3_BUCKET!;
  }
  
  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    });
    
    await this.client.send(command);
    
    return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }
  
  async getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    
    return await getSignedUrl(this.client, command, { expiresIn });
  }
}
```

## Application Deployment

### Build Process

```bash
#!/bin/bash
# scripts/build-production.sh

set -e

echo "* Starting production build..."

# Install dependencies
echo " Installing dependencies..."
npm ci --only=production

# Validate environment
echo "* Validating environment..."
npm run validate:env

# Build application
echo "* Building application..."
npm run build

# Generate Prisma client
echo "* Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "* Running database migrations..."
npx prisma migrate deploy

# Optimize build
echo "* Optimizing build..."
npm run optimize

echo " Production build completed successfully!"
```

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'safeplay-production',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/safeplay',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      log_file: '/var/log/safeplay/combined.log',
      out_file: '/var/log/safeplay/out.log',
      error_file: '/var/log/safeplay/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      
      // Memory management
      max_memory_restart: '1G',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
    },
    {
      name: 'safeplay-worker',
      script: './workers/email-queue-worker.js',
      instances: 2,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'email_queue',
      },
    },
    {
      name: 'safeplay-scheduler',
      script: './workers/scheduler.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'scheduler',
      },
    },
  ],
};
```

### Deployment Script

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

DEPLOY_DIR="/var/www/safeplay"
BACKUP_DIR="/var/backups/safeplay/deployments"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "* Starting mySafePlay™(TM) deployment..."

# Create backup of current deployment
if [ -d "$DEPLOY_DIR" ]; then
    echo " Creating deployment backup..."
    mkdir -p $BACKUP_DIR
    tar -czf "$BACKUP_DIR/deployment_backup_$TIMESTAMP.tar.gz" -C "$DEPLOY_DIR" .
fi

# Stop application
echo "* Stopping application..."
pm2 stop safeplay-production || true
pm2 stop safeplay-worker || true
pm2 stop safeplay-scheduler || true

# Deploy new version
echo " Deploying new version..."
rsync -av --delete ./ $DEPLOY_DIR/ \
    --exclude node_modules \
    --exclude .git \
    --exclude .env.local \
    --exclude *.log

cd $DEPLOY_DIR

# Install dependencies and build
echo "* Building application..."
npm ci --only=production
npm run build

# Run database migrations
echo "* Running database migrations..."
npx prisma migrate deploy

# Start application
echo "* Starting application..."
pm2 start ecosystem.config.js --env production

# Health check
echo " Running health check..."
sleep 10
curl -f http://localhost:3000/api/health || {
    echo " Health check failed, rolling back..."
    pm2 stop all
    # Restore backup if needed
    exit 1
}

echo " Deployment completed successfully!"

# Clean old backups
find $BACKUP_DIR -name "deployment_backup_*.tar.gz" -mtime +7 -delete
```

## SSL & Security Configuration

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/safeplay
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self'; object-src 'none'; child-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    # File Upload Limits
    client_max_body_size 10M;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # API Rate Limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Login Rate Limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files caching
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3000;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:3000/api/health;
    }
}
```

### SSL Certificate Setup

```bash
#!/bin/bash
# scripts/setup-ssl.sh

# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Set up automatic renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet

# Test renewal
sudo certbot renew --dry-run
```

## Monitoring & Logging

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Database health check
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - startTime;
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    
    // Uptime
    const uptime = process.uptime();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: uptime,
      database: {
        status: 'connected',
        responseTime: dbResponseTime,
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
    };
    
    return NextResponse.json(healthData);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
```

### Logging Configuration

```typescript
// lib/logger.ts
import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'safeplay' },
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    
    // File logging
    new winston.transports.File({
      filename: path.join(process.env.LOG_FILE_PATH || './logs', 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(process.env.LOG_FILE_PATH || './logs', 'combined.log'),
    }),
  ],
});

// Production logging enhancements
if (process.env.NODE_ENV === 'production') {
  // Add Sentry for error tracking
  if (process.env.SENTRY_DSN) {
    // Sentry integration would go here
  }
  
  // Add log rotation
  logger.add(new winston.transports.File({
    filename: 'logs/app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
  }));
}
```

### Monitoring Dashboard

```typescript
// app/admin/monitoring/page.tsx
import { MonitoringDashboard } from '@/components/admin/monitoring-dashboard';

export default function MonitoringPage() {
  return (
    <div className="monitoring-page">
      <h1>System Monitoring</h1>
      <MonitoringDashboard />
    </div>
  );
}

// components/admin/monitoring-dashboard.tsx
export const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>();
  
  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch('/api/admin/metrics');
      const data = await response.json();
      setMetrics(data);
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="monitoring-dashboard">
      <div className="metrics-grid">
        <MetricCard
          title="System Health"
          value={metrics?.health?.status}
          color={metrics?.health?.status === 'healthy' ? 'green' : 'red'}
        />
        <MetricCard
          title="Active Users"
          value={metrics?.users?.active}
          trend={metrics?.users?.trend}
        />
        <MetricCard
          title="Database Response"
          value={`${metrics?.database?.responseTime}ms`}
          color={metrics?.database?.responseTime < 100 ? 'green' : 'yellow'}
        />
        <MetricCard
          title="Memory Usage"
          value={`${metrics?.memory?.used}MB`}
          max={metrics?.memory?.total}
        />
      </div>
      
      <div className="charts-section">
        <ResponseTimeChart data={metrics?.responseTime} />
        <ErrorRateChart data={metrics?.errors} />
        <UserActivityChart data={metrics?.activity} />
      </div>
    </div>
  );
};
```

## Backup & Recovery

### Automated Backup System

```bash
#!/bin/bash
# scripts/backup-system.sh

set -e

BACKUP_ROOT="/var/backups/safeplay"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"

echo " Starting system backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
echo "* Backing up database..."
cp ./production.db "$BACKUP_DIR/database.db"

# Application files backup
echo " Backing up application files..."
tar -czf "$BACKUP_DIR/application.tar.gz" \
    --exclude=node_modules \
    --exclude=.next \
    --exclude=logs \
    --exclude=*.log \
    .

# Configuration backup
echo "** Backing up configuration..."
cp .env.production "$BACKUP_DIR/env.backup"
cp ecosystem.config.js "$BACKUP_DIR/"
cp /etc/nginx/sites-available/safeplay "$BACKUP_DIR/nginx.conf"

# Upload to S3
if [ ! -z "$BACKUP_S3_BUCKET" ]; then
    echo "* Uploading to S3..."
    aws s3 sync "$BACKUP_DIR" "s3://$BACKUP_S3_BUCKET/backups/$TIMESTAMP/"
fi

# Create backup manifest
cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date -Iseconds)",
  "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "files": [
    "database.db",
    "application.tar.gz",
    "env.backup",
    "ecosystem.config.js",
    "nginx.conf"
  ]
}
EOF

# Compress entire backup
tar -czf "$BACKUP_ROOT/backup_$TIMESTAMP.tar.gz" -C "$BACKUP_ROOT" "$TIMESTAMP"
rm -rf "$BACKUP_DIR"

# Clean old backups (keep last 30 days)
find "$BACKUP_ROOT" -name "backup_*.tar.gz" -mtime +30 -delete

echo " System backup completed: backup_$TIMESTAMP.tar.gz"
```

### Recovery Procedures

```bash
#!/bin/bash
# scripts/restore-backup.sh

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_timestamp>"
    echo "Available backups:"
    ls -la /var/backups/safeplay/backup_*.tar.gz
    exit 1
fi

BACKUP_TIMESTAMP="$1"
BACKUP_FILE="/var/backups/safeplay/backup_$BACKUP_TIMESTAMP.tar.gz"
RESTORE_DIR="/tmp/safeplay_restore_$BACKUP_TIMESTAMP"

if [ ! -f "$BACKUP_FILE" ]; then
    echo " Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo " Starting system restore from backup: $BACKUP_TIMESTAMP"

# Stop application
echo "* Stopping application..."
pm2 stop all

# Extract backup
echo " Extracting backup..."
mkdir -p "$RESTORE_DIR"
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

# Restore database
echo "* Restoring database..."
cp "$RESTORE_DIR/$BACKUP_TIMESTAMP/database.db" ./production.db

# Restore application files
echo " Restoring application files..."
tar -xzf "$RESTORE_DIR/$BACKUP_TIMESTAMP/application.tar.gz" -C .

# Restore configuration
echo "** Restoring configuration..."
cp "$RESTORE_DIR/$BACKUP_TIMESTAMP/env.backup" .env.production
cp "$RESTORE_DIR/$BACKUP_TIMESTAMP/ecosystem.config.js" .
sudo cp "$RESTORE_DIR/$BACKUP_TIMESTAMP/nginx.conf" /etc/nginx/sites-available/safeplay

# Rebuild application
echo "* Rebuilding application..."
npm ci --only=production
npm run build

# Restart services
echo "* Restarting services..."
sudo nginx -t && sudo systemctl reload nginx
pm2 start ecosystem.config.js --env production

# Health check
echo " Running health check..."
sleep 10
curl -f http://localhost:3000/api/health || {
    echo " Health check failed after restore"
    exit 1
}

# Cleanup
rm -rf "$RESTORE_DIR"

echo " System restore completed successfully!"
```

## Troubleshooting

### Common Issues & Solutions

#### 1. Application Won't Start

```bash
# Check logs
pm2 logs safeplay-production

# Check environment variables
npm run validate:env

# Check database connection
npx prisma db pull

# Check port availability
netstat -tulpn | grep :3000
```

#### 2. Database Connection Issues

```bash
# Check database file permissions
ls -la production.db

# Test database connection
npx prisma studio

# Reset database (CAUTION: Data loss)
npx prisma migrate reset --force
```

#### 3. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect your-domain.com:443
```

#### 4. High Memory Usage

```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart safeplay-production

# Check for memory leaks
node --inspect app.js
```

### Debugging Tools

```typescript
// lib/debug.ts
export const debugInfo = {
  environment: process.env.NODE_ENV,
  version: process.env.npm_package_version,
  nodeVersion: process.version,
  platform: process.platform,
  uptime: process.uptime(),
  memoryUsage: process.memoryUsage(),
  cpuUsage: process.cpuUsage(),
};

export function logDebugInfo() {
  console.log(' Debug Information:', JSON.stringify(debugInfo, null, 2));
}
```

### Performance Monitoring

```bash
# Monitor application performance
pm2 monit

# Check system resources
htop
iostat -x 1
free -h

# Monitor network connections
netstat -tulpn

# Check disk usage
df -h
du -sh /var/www/safeplay/*
```

---

*This deployment guide provides comprehensive instructions for deploying mySafePlay™(TM) to production. For specific environment configurations or troubleshooting, refer to the individual component documentation.*
