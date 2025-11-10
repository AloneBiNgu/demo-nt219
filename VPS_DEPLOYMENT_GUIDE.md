# ===========================================
# VPS Production Deployment Guide
# ===========================================
# Domain: security-test.site
# Last Updated: November 11, 2025
# ===========================================

## 📋 Pre-Deployment Checklist

### 1. VPS Requirements
- [ ] Ubuntu 22.04 LTS or later
- [ ] Minimum 2GB RAM (4GB recommended)
- [ ] 20GB+ storage
- [ ] Root or sudo access
- [ ] Public IP address

### 2. Domain Setup
- [ ] Domain registered: security-test.site
- [ ] DNS A records created:
  - `security-test.site` → Your VPS IP
  - `www.security-test.site` → Your VPS IP
  - `api.security-test.site` → Your VPS IP
- [ ] Wait for DNS propagation (15 minutes - 48 hours)

### 3. Required Credentials
- [ ] MongoDB Atlas connection string (or use local MongoDB)
- [ ] Gmail App Password for email
- [ ] Stripe API keys (production)
- [ ] Google OAuth credentials (with production callback URL)
- [ ] Email for Let's Encrypt SSL

---

## 🚀 Automated Deployment

### Option 1: Using Deployment Script (Recommended)

```bash
# 1. SSH to your VPS
ssh root@your-vps-ip

# 2. Create project directory
mkdir -p /var/www
cd /var/www

# 3. Clone repository
git clone https://github.com/yourusername/demo-nt219.git nt219
cd nt219

# 4. Copy environment files
cp .env.production.example .env.production
cp frontend/.env.production.example frontend/.env.production

# 5. Edit environment variables
nano .env.production
nano frontend/.env.production

# 6. Update email in deploy script
nano deploy-vps.sh
# Change: EMAIL="your-email@example.com"

# 7. Make script executable
chmod +x deploy-vps.sh

# 8. Run deployment script
sudo ./deploy-vps.sh
```

The script will automatically:
- ✅ Install Docker, Nginx, Certbot
- ✅ Configure firewall
- ✅ Build Docker images
- ✅ Start containers
- ✅ Configure Nginx reverse proxy
- ✅ Obtain SSL certificates
- ✅ Setup auto-renewal
- ✅ Configure backups and monitoring

---

## 🔧 Manual Deployment

### Step 1: Update System

```bash
ssh root@your-vps-ip

apt-get update && apt-get upgrade -y
```

### Step 2: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt-get install -y docker-compose

# Start Docker
systemctl start docker
systemctl enable docker

# Verify
docker --version
docker-compose --version
```

### Step 3: Install Nginx

```bash
apt-get install -y nginx

systemctl start nginx
systemctl enable nginx
```

### Step 4: Install Certbot

```bash
apt-get install -y certbot python3-certbot-nginx
```

### Step 5: Configure Firewall

```bash
# Install UFW
apt-get install -y ufw

# Allow SSH (IMPORTANT - do this first!)
ufw allow OpenSSH

# Allow HTTP and HTTPS
ufw allow 'Nginx Full'

# Enable firewall
ufw enable

# Check status
ufw status
```

### Step 6: Clone Repository

```bash
cd /var/www
git clone https://github.com/yourusername/demo-nt219.git nt219
cd nt219
```

### Step 7: Configure Environment Variables

```bash
# Backend environment
cp .env.production.example .env.production
nano .env.production
```

**Update these values:**
```env
# MongoDB (use MongoDB Atlas for production)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# JWT Secrets (generate random)
JWT_ACCESS_SECRET=<run: openssl rand -hex 64>
JWT_REFRESH_SECRET=<run: openssl rand -hex 64>
COOKIE_SECRET=<run: openssl rand -hex 64>

# Email (Gmail App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Stripe (Production keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=https://api.security-test.site/oauth/google/callback

# Vault
VAULT_TOKEN=<run: openssl rand -hex 32>
```

```bash
# Frontend environment
cp frontend/.env.production.example frontend/.env.production
nano frontend/.env.production
```

**Update these values:**
```env
VITE_API_URL=https://api.security-test.site
VITE_APP_URL=https://security-test.site
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

### Step 8: Build and Start Containers

```bash
# Build images
docker-compose -f docker-compose.production.yml build

# Start containers
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### Step 9: Configure Nginx Reverse Proxy

```bash
# Copy nginx configuration
cp nginx-vps.conf /etc/nginx/sites-available/security-test.site

# Create symlink
ln -s /etc/nginx/sites-available/security-test.site /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

### Step 10: Obtain SSL Certificate

```bash
# Create directory for Let's Encrypt challenges
mkdir -p /var/www/certbot

# Obtain certificate
certbot --nginx \
    -d security-test.site \
    -d www.security-test.site \
    -d api.security-test.site \
    --email your-email@example.com \
    --agree-tos \
    --redirect

# Test auto-renewal
certbot renew --dry-run
```

### Step 11: Setup Automatic Backups

```bash
# Create backup directory
mkdir -p /var/www/nt219/backups

# Create backup script
cat > /usr/local/bin/backup-mongodb.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/www/nt219/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec nt219-mongodb-prod mongodump --out /backups/backup_$DATE
# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
echo "Backup completed: backup_$DATE"
EOF

# Make executable
chmod +x /usr/local/bin/backup-mongodb.sh

# Add to crontab (daily at 3 AM)
crontab -e
# Add this line:
# 0 3 * * * /usr/local/bin/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1
```

---

## 🔍 Verification

### Check Services

```bash
# Check Docker containers
docker-compose -f docker-compose.production.yml ps

# All should show "Up" and "healthy"
```

### Check Health Endpoints

```bash
# Backend health
curl https://api.security-test.site/health

# Frontend health
curl https://security-test.site/health

# Expected: {"status":"ok",...}
```

### Check SSL

```bash
# Test SSL certificate
curl -vI https://security-test.site 2>&1 | grep SSL

# Check SSL rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=security-test.site
```

### Test Application

1. ✅ Visit https://security-test.site
2. ✅ Create new account
3. ✅ Login
4. ✅ Test OAuth login
5. ✅ Test payment (with test card)
6. ✅ Check admin dashboard
7. ✅ View audit logs

---

## 📊 Monitoring

### View Logs

```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend

# Nginx logs
tail -f /var/log/nginx/security-test.site.access.log
tail -f /var/log/nginx/api.security-test.site.error.log
```

### Check Resource Usage

```bash
# Docker stats
docker stats

# System resources
htop

# Disk usage
df -h
```

### Setup Monitoring (Optional)

```bash
# Install monitoring tools
apt-get install -y htop nethogs iotop

# For advanced monitoring, consider:
# - Prometheus + Grafana
# - New Relic
# - Datadog
```

---

## 🔄 Updates and Maintenance

### Update Application

```bash
cd /var/www/nt219

# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build

# Check logs
docker-compose -f docker-compose.production.yml logs -f
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.production.yml restart

# Restart specific service
docker-compose -f docker-compose.production.yml restart backend
```

### Update SSL Certificate

```bash
# Renew manually
certbot renew

# Auto-renewal is configured via cron
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs backend

# Check if port is in use
netstat -tulpn | grep :5000

# Restart container
docker-compose -f docker-compose.production.yml restart backend
```

### SSL Certificate Issues

```bash
# Check certificate status
certbot certificates

# Force renewal
certbot renew --force-renewal

# Check nginx config
nginx -t
```

### Database Connection Failed

```bash
# Check MongoDB container
docker exec -it nt219-mongodb-prod mongosh

# Check connection string in .env.production
cat .env.production | grep MONGODB_URI
```

### 502 Bad Gateway

```bash
# Check if backend is running
docker ps | grep backend

# Check backend health
curl http://localhost:5000/health

# Check nginx error logs
tail -f /var/log/nginx/api.security-test.site.error.log
```

### Out of Disk Space

```bash
# Clean Docker
docker system prune -a --volumes

# Clean logs
find /var/log -type f -name "*.log" -mtime +30 -delete

# Check disk usage
df -h
```

---

## 🔒 Security Best Practices

### 1. Change Default Passwords

```bash
# MongoDB
# Update MONGO_INITDB_ROOT_PASSWORD in docker-compose.production.yml

# Vault
# Update VAULT_TOKEN
```

### 2. Setup Fail2Ban

```bash
apt-get install -y fail2ban

# Configure for nginx
cat > /etc/fail2ban/jail.local << EOF
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/*error.log
maxretry = 5
findtime = 600
bantime = 3600
EOF

systemctl restart fail2ban
```

### 3. Regular Updates

```bash
# Setup automatic security updates
apt-get install -y unattended-upgrades

# Configure
dpkg-reconfigure -plow unattended-upgrades
```

### 4. Backup Secrets

```bash
# Backup environment files
cp .env.production /root/backups/.env.production.backup
chmod 600 /root/backups/.env.production.backup

# Consider using encrypted storage or vault service
```

---

## 📞 Support

### Check Status

```bash
# Services
systemctl status nginx
systemctl status docker

# Containers
docker-compose -f docker-compose.production.yml ps

# Health
curl https://api.security-test.site/health
```

### Get Help

1. Check logs first
2. Review DOCKER_GUIDE.md
3. Check PRODUCTION_DEPLOYMENT.md
4. Search error messages online

---

## 🎯 Post-Deployment Tasks

- [ ] Test all features thoroughly
- [ ] Setup monitoring and alerts
- [ ] Configure backups (database + files)
- [ ] Setup error tracking (Sentry)
- [ ] Configure CDN for static assets (optional)
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation updates

---

## 📈 Performance Optimization

### Enable Redis Caching (Optional)

```bash
# Add to docker-compose.production.yml
redis:
  image: redis:7-alpine
  restart: unless-stopped
  ports:
    - "127.0.0.1:6379:6379"
  volumes:
    - redis_data:/data

# Update backend to use Redis
```

### Setup CDN

Consider using:
- Cloudflare (free tier available)
- AWS CloudFront
- Fastly

---

**🎉 Deployment Complete!**

Your application is now running in production at:
- Frontend: https://security-test.site
- API: https://api.security-test.site

Monitor regularly and keep everything updated! 🚀
