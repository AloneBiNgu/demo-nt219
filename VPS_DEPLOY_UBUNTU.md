# 🚀 Hướng Dẫn Deploy Lên VPS Ubuntu Chi Tiết

## 📋 Mục Lục
1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Bước 1: Chuẩn Bị VPS](#bước-1-chuẩn-bị-vps)
3. [Bước 2: Cài Đặt Docker & Docker Compose](#bước-2-cài-đặt-docker--docker-compose)
4. [Bước 3: Clone Source Code](#bước-3-clone-source-code)
5. [Bước 4: Cấu Hình Environment](#bước-4-cấu-hình-environment)
6. [Bước 5: Cấu Hình Domain & SSL](#bước-5-cấu-hình-domain--ssl)
7. [Bước 6: Deploy với Docker](#bước-6-deploy-với-docker)
8. [Bước 7: Cài Đặt Nginx Reverse Proxy](#bước-7-cài-đặt-nginx-reverse-proxy)
9. [Bước 8: Setup SSL với Let's Encrypt](#bước-8-setup-ssl-với-lets-encrypt)
10. [Bước 9: Monitoring & Logs](#bước-9-monitoring--logs)
11. [Troubleshooting](#troubleshooting)

---

## ⚙️ Yêu Cầu Hệ Thống

### VPS Minimum Requirements:
- **OS**: Ubuntu 20.04 LTS hoặc 22.04 LTS
- **RAM**: 2GB+ (khuyên dùng 4GB)
- **CPU**: 2 cores+
- **Disk**: 20GB+ SSD
- **Bandwidth**: 1TB/month

### Cần Chuẩn Bị:
- ✅ Domain name (ví dụ: `security-test.site`)
- ✅ VPS với quyền root/sudo
- ✅ SSH client (PuTTY, MobaXterm, hoặc Terminal)
- ✅ Stripe API keys (test hoặc live)
- ✅ Email SMTP credentials
- ✅ Google OAuth credentials (optional)

---

## 🔧 Bước 1: Chuẩn Bị VPS

### 1.1. SSH vào VPS

```bash
ssh root@your-vps-ip
# Hoặc nếu dùng user khác:
ssh username@your-vps-ip
```

### 1.2. Update System

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Cài đặt các tools cần thiết
sudo apt install -y curl wget git vim ufw
```

### 1.3. Tạo User Mới (Khuyên Dùng - Bảo Mật)

```bash
# Tạo user deploy
sudo adduser deploy

# Thêm vào sudo group
sudo usermod -aG sudo deploy

# Chuyển sang user deploy
su - deploy
```

### 1.4. Cấu Hình Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (QUAN TRỌNG - không bị lock out!)
sudo ufw allow 22/tcp

# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

**⚠️ LƯU Ý**: Phải allow port 22 trước khi enable UFW, nếu không sẽ bị lock out khỏi server!

---

## 🐳 Bước 2: Cài Đặt Docker & Docker Compose

### 2.1. Cài Docker Engine

```bash
# Remove old versions (if any)
sudo apt remove docker docker-engine docker.io containerd runc

# Setup Docker repository
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Setup repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
sudo docker --version
sudo docker compose version
```

### 2.2. Configure Docker (Không Cần Sudo)

```bash
# Add current user to docker group
sudo usermod -aG docker $USER

# Apply changes (LOGOUT và LOGIN lại SSH)
exit
# SSH lại vào VPS

# Test (không cần sudo)
docker ps
```

### 2.3. Enable Docker Auto-Start

```bash
sudo systemctl enable docker
sudo systemctl start docker
sudo systemctl status docker
```

---

## 📦 Bước 3: Clone Source Code

### 3.1. Tạo Thư Mục Project

```bash
# Tạo thư mục cho project
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
```

### 3.2. Clone Repository

```bash
# Clone từ GitHub
git clone https://github.com/AloneBiNgu/demo-nt219.git
cd demo-nt219

# Check files
ls -la
```

### 3.3. Tạo Thư Mục Cần Thiết

```bash
# Tạo thư mục cho uploads và logs
mkdir -p uploads/prototypes
mkdir -p logs
mkdir -p backups

# Set permissions
chmod 755 uploads logs backups
```

---

## 🔐 Bước 4: Cấu Hình Environment

### 4.1. Backend Environment (.env.production)

```bash
cd /var/www/demo-nt219

# Copy file mẫu
cp .env.example .env.production

# Edit file
nano .env.production
```

**Nội dung `.env.production`:**

```bash
# ===========================================
# PRODUCTION ENVIRONMENT
# ===========================================

NODE_ENV=production
PORT=5000

# MongoDB (sử dụng Docker internal network)
MONGO_URI=mongodb://admin:CHANGE_STRONG_PASSWORD@mongodb:27017/nt219-prod?authSource=admin

# JWT Secrets - PHẢI ĐỔI!
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=THAY_DOI_THANH_64_CHAR_HEX_STRING_CHO_ACCESS_TOKEN
JWT_REFRESH_SECRET=THAY_DOI_THANH_64_CHAR_HEX_STRING_CHO_REFRESH_TOKEN
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Encryption Key - PHẢI ĐỔI!
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=THAY_DOI_THANH_32_CHAR_HEX_STRING_CHO_ENCRYPTION

# Domain Configuration (THAY ĐỔI DOMAIN CỦA BẠN)
FRONTEND_URL=https://security-test.site
CLIENT_ORIGIN=https://security-test.site
CORS_ORIGIN=https://security-test.site

# Stripe (Test hoặc Live keys)
STRIPE_SECRET_KEY=sk_test_hoac_sk_live_YOUR_STRIPE_SECRET
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Email SMTP (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@security-test.site

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://api.security-test.site/api/oauth/google/callback

# Admin Account
ADMIN_EMAIL=admin@security-test.site
ADMIN_PASSWORD=STRONG_ADMIN_PASSWORD_MIN_12_CHARS

# Vault (Optional - set to false if not using)
VAULT_ENABLED=false
VAULT_ADDR=http://vault:8200
VAULT_TOKEN=

# Rate Limiting
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX_REQUESTS=100
```

**🔑 Generate Secure Keys:**

```bash
# Trên máy local (có Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # Encryption key

# Hoặc dùng online: https://www.grc.com/passwords.htm
```

### 4.2. Frontend Environment (frontend/.env.production)

```bash
cd frontend
nano .env.production
```

**Nội dung `frontend/.env.production`:**

```bash
# API Backend URL (THAY ĐỔI DOMAIN)
VITE_API_BASE_URL=https://api.security-test.site/api/v1

# App URL
VITE_APP_URL=https://security-test.site

# Stripe Publishable Key (Test hoặc Live)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_hoac_pk_live_YOUR_PUBLISHABLE_KEY

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Environment
VITE_NODE_ENV=production
```

### 4.3. Docker Compose Production Environment

```bash
cd /var/www/demo-nt219

# Sửa docker-compose.production.yml
nano docker-compose.production.yml
```

**Tìm và sửa các dòng:**

```yaml
# MongoDB password
MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_ROOT_PASSWORD}

# Backend build args (đổi domain)
args:
  VITE_API_BASE_URL: https://api.security-test.site/api/v1
```

**Tạo file `.env` cho docker-compose:**

```bash
nano .env
```

```bash
# MongoDB Root Password
MONGODB_ROOT_PASSWORD=CHANGE_THIS_STRONG_MONGO_PASSWORD

# Vault Token (if using Vault)
VAULT_ROOT_TOKEN=myroot
```

---

## 🌐 Bước 5: Cấu Hình Domain & SSL

### 5.1. Point Domain to VPS

Vào DNS provider (Cloudflare, Namecheap, GoDaddy...) và tạo A records:

```
Type    Name    Value           TTL
A       @       YOUR_VPS_IP     Auto
A       www     YOUR_VPS_IP     Auto
A       api     YOUR_VPS_IP     Auto
```

**Kiểm tra DNS propagation:**

```bash
# Trên VPS hoặc máy local
nslookup security-test.site
nslookup api.security-test.site
nslookup www.security-test.site

# Hoặc dùng online: https://dnschecker.org
```

### 5.2. Wait for DNS Propagation

⏱️ DNS có thể mất 5 phút - 24 giờ để propagate. Thường là 5-15 phút.

---

## 🐋 Bước 6: Deploy với Docker

### 6.1. Build và Start Containers

```bash
cd /var/www/demo-nt219

# Build images
docker compose -f docker-compose.production.yml build --no-cache

# Start containers
docker compose -f docker-compose.production.yml up -d

# Check logs
docker compose -f docker-compose.production.yml logs -f
```

**Giải thích các service:**
- `mongodb`: Database
- `vault`: Secret management (optional)
- `backend`: Node.js API
- `frontend`: React app với Nginx

### 6.2. Verify Containers Running

```bash
# Check running containers
docker ps

# Should see 3-4 containers:
# - nt219-mongodb-prod
# - nt219-vault-prod (if enabled)
# - nt219-backend-prod
# - nt219-frontend-prod
```

### 6.3. Check Container Logs

```bash
# Backend logs
docker logs nt219-backend-prod -f

# Frontend logs
docker logs nt219-frontend-prod -f

# MongoDB logs
docker logs nt219-mongodb-prod -f
```

### 6.4. Test Internal Connectivity

```bash
# Test backend health (should return 200 OK)
curl http://localhost:5000/health

# Test frontend (should return HTML)
curl http://localhost:3000
```

---

## 🔒 Bước 7: Cài Đặt Nginx Reverse Proxy

### 7.1. Install Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### 7.2. Configure Nginx

```bash
# Backup default config
sudo mv /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak

# Copy project nginx config
sudo cp /var/www/demo-nt219/nginx-vps.conf /etc/nginx/sites-available/security-test.site

# Edit với domain của bạn
sudo nano /etc/nginx/sites-available/security-test.site
```

**Thay đổi trong file:**
- Đổi `security-test.site` → domain của bạn (tìm và thay thế tất cả)

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/security-test.site /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 7.3. Test HTTP Access

Mở browser và truy cập:
- `http://your-domain.com` → Should see frontend
- `http://api.your-domain.com/health` → Should return `{"status":"ok"}`

---

## 🔐 Bước 8: Setup SSL với Let's Encrypt

### 8.1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2. Obtain SSL Certificate

```bash
# Replace với domain của bạn
sudo certbot --nginx -d security-test.site -d www.security-test.site -d api.security-test.site

# Follow prompts:
# 1. Enter email for urgent renewal notifications
# 2. Agree to Terms of Service
# 3. Choose whether to redirect HTTP to HTTPS (recommend: Yes)
```

**Expected output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/security-test.site/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/security-test.site/privkey.pem
```

### 8.3. Test SSL Configuration

```bash
# Check SSL Grade (should be A+)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
```

### 8.4. Auto-Renewal Test

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Certbot auto-renewal is enabled via systemd timer
sudo systemctl status certbot.timer
```

**SSL certificates auto-renew every 60 days.**

---

## 📊 Bước 9: Monitoring & Logs

### 9.1. Docker Logs

```bash
# View all logs
docker compose -f docker-compose.production.yml logs -f

# View specific service
docker logs nt219-backend-prod -f
docker logs nt219-frontend-prod -f
docker logs nt219-mongodb-prod -f

# Last 100 lines
docker logs --tail 100 nt219-backend-prod

# Save logs to file
docker logs nt219-backend-prod > backend-logs.txt
```

### 9.2. Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Specific domain logs (if configured)
sudo tail -f /var/log/nginx/security-test.site-access.log
sudo tail -f /var/log/nginx/security-test.site-error.log
```

### 9.3. System Resource Monitoring

```bash
# Check disk usage
df -h

# Check memory
free -h

# Check CPU
top
# hoặc
htop  # (install: sudo apt install htop)

# Docker stats (real-time)
docker stats
```

### 9.4. Database Backup

```bash
# Create backup script
nano /var/www/demo-nt219/backup-db.sh
```

**Nội dung script:**

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/www/demo-nt219/backups"

# Backup MongoDB
docker exec nt219-mongodb-prod mongodump \
  --username admin \
  --password YOUR_MONGO_PASSWORD \
  --authenticationDatabase admin \
  --out /backups/backup_$DATE

echo "Backup completed: $BACKUP_DIR/backup_$DATE"
```

```bash
# Make executable
chmod +x /var/www/demo-nt219/backup-db.sh

# Test backup
./backup-db.sh

# Setup cron job (daily backup at 2 AM)
crontab -e
```

**Add line:**
```
0 2 * * * /var/www/demo-nt219/backup-db.sh >> /var/www/demo-nt219/logs/backup.log 2>&1
```

---

## 🔧 Troubleshooting

### Issue 1: Container Won't Start

```bash
# Check logs
docker logs nt219-backend-prod

# Common issues:
# - Environment variables not set
# - Port already in use
# - MongoDB connection failed

# Fix: Check .env.production file
nano /var/www/demo-nt219/.env.production
```

### Issue 2: Cannot Connect to Database

```bash
# Check MongoDB container
docker ps | grep mongodb

# Check MongoDB logs
docker logs nt219-mongodb-prod

# Test MongoDB connection
docker exec -it nt219-mongodb-prod mongosh -u admin -p

# Fix: Check MONGO_URI in .env.production
# Should be: mongodb://admin:password@mongodb:27017/dbname?authSource=admin
```

### Issue 3: 502 Bad Gateway

```bash
# Check backend is running
curl http://localhost:5000/health

# Check Nginx config
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Issue 4: SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx SSL config
sudo nano /etc/nginx/sites-available/security-test.site
```

### Issue 5: CORS Errors

```bash
# Check backend .env.production
# Ensure CORS_ORIGIN matches your frontend domain
CORS_ORIGIN=https://your-domain.com

# Restart backend
docker restart nt219-backend-prod
```

### Issue 6: High Memory Usage

```bash
# Check Docker stats
docker stats

# Restart containers
docker compose -f docker-compose.production.yml restart

# If MongoDB using too much memory, adjust in docker-compose.production.yml:
# deploy:
#   resources:
#     limits:
#       memory: 1G
```

---

## 🎯 Post-Deployment Checklist

- [ ] ✅ All containers running (`docker ps`)
- [ ] ✅ Backend health check works (`curl https://api.domain.com/health`)
- [ ] ✅ Frontend loads (`https://domain.com`)
- [ ] ✅ SSL certificate valid (A+ rating)
- [ ] ✅ Database backup configured
- [ ] ✅ Firewall rules configured
- [ ] ✅ Environment variables secured
- [ ] ✅ Admin user can login
- [ ] ✅ Test product creation/checkout flow
- [ ] ✅ Email sending works
- [ ] ✅ Stripe webhooks configured (if using payments)
- [ ] ✅ Monitoring/logs accessible

---

## 🚀 Quick Commands Reference

```bash
# Start all services
docker compose -f docker-compose.production.yml up -d

# Stop all services
docker compose -f docker-compose.production.yml down

# Restart specific service
docker restart nt219-backend-prod

# View logs
docker logs -f nt219-backend-prod

# Rebuild and restart
docker compose -f docker-compose.production.yml up -d --build

# Pull latest code and redeploy
cd /var/www/demo-nt219
git pull
docker compose -f docker-compose.production.yml up -d --build

# Backup database
./backup-db.sh

# Check system resources
docker stats
df -h
free -h
```

---

## 📞 Support

Nếu gặp vấn đề, check:
1. Container logs: `docker logs nt219-backend-prod`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Firewall: `sudo ufw status`
4. DNS: `nslookup your-domain.com`

---

**🎉 Chúc Mừng! Bạn đã deploy thành công ứng dụng lên VPS Ubuntu!** 🎉
