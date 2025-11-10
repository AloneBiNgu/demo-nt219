# ===========================================
# Quick Production Deployment Checklist
# ===========================================
# Domain: security-test.site
# ===========================================

## 🎯 Before Deployment

### DNS Configuration
```
A Record:     security-test.site          → YOUR_VPS_IP
A Record:     www.security-test.site      → YOUR_VPS_IP
A Record:     api.security-test.site      → YOUR_VPS_IP
```

**Check DNS propagation:**
```bash
nslookup security-test.site
ping security-test.site
```

---

## 🔐 Environment Variables to Change

### Backend (.env.production)

**MUST CHANGE:**
```bash
# Generate with: openssl rand -hex 64
JWT_ACCESS_SECRET=CHANGE_THIS
JWT_REFRESH_SECRET=CHANGE_THIS
COOKIE_SECRET=CHANGE_THIS

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/security-nt219

# Or local MongoDB
MONGO_INITDB_ROOT_PASSWORD=CHANGE_THIS

# Vault
VAULT_TOKEN=CHANGE_THIS  # Generate with: openssl rand -hex 32
```

**Email (Gmail):**
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  # Get from Google App Passwords
```

**Stripe Production:**
```bash
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

**Google OAuth:**
```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=https://api.security-test.site/oauth/google/callback
```

### Frontend (frontend/.env.production)

```bash
VITE_API_URL=https://api.security-test.site
VITE_APP_URL=https://security-test.site
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## 🚀 Quick Deploy Commands

### 1. On VPS

```bash
# SSH to VPS
ssh root@YOUR_VPS_IP

# Clone repo
cd /var/www
git clone https://github.com/yourusername/demo-nt219.git nt219
cd nt219

# Edit environment files
nano .env.production
nano frontend/.env.production

# Run automated deployment
chmod +x deploy-vps.sh
sudo ./deploy-vps.sh
```

### 2. Manual Deploy (if script fails)

```bash
# Install dependencies
apt-get update && apt-get install -y docker.io docker-compose nginx certbot python3-certbot-nginx

# Start Docker
systemctl start docker
systemctl enable docker

# Build containers
docker-compose -f docker-compose.production.yml build

# Start services
docker-compose -f docker-compose.production.yml up -d

# Configure Nginx
cp nginx-vps.conf /etc/nginx/sites-available/security-test.site
ln -s /etc/nginx/sites-available/security-test.site /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Get SSL
certbot --nginx -d security-test.site -d www.security-test.site -d api.security-test.site --email YOUR_EMAIL --agree-tos --redirect
```

---

## ✅ Verification

```bash
# Check containers
docker-compose -f docker-compose.production.yml ps

# Check health
curl https://api.security-test.site/health
curl https://security-test.site/health

# Check SSL
curl -vI https://security-test.site 2>&1 | grep SSL

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

---

## 🔧 Common Commands

```bash
# Restart all services
docker-compose -f docker-compose.production.yml restart

# Restart specific service
docker-compose -f docker-compose.production.yml restart backend

# View logs
docker-compose -f docker-compose.production.yml logs -f backend

# Rebuild after code changes
git pull
docker-compose -f docker-compose.production.yml up -d --build

# Stop all
docker-compose -f docker-compose.production.yml down

# Clean Docker
docker system prune -a
```

---

## 🐛 Quick Troubleshooting

**Container won't start:**
```bash
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml restart backend
```

**502 Bad Gateway:**
```bash
docker ps  # Check if backend is running
curl http://localhost:5000/health
tail -f /var/log/nginx/api.security-test.site.error.log
```

**SSL issues:**
```bash
certbot certificates
certbot renew --force-renewal
nginx -t && systemctl reload nginx
```

**Database connection failed:**
```bash
docker exec -it nt219-mongodb-prod mongosh
# Check MONGODB_URI in .env.production
```

---

## 📊 Monitoring

```bash
# Resource usage
docker stats

# Disk space
df -h

# Nginx logs
tail -f /var/log/nginx/security-test.site.access.log
tail -f /var/log/nginx/api.security-test.site.error.log

# Application logs
docker-compose -f docker-compose.production.yml logs -f
```

---

## 🔄 Update Process

```bash
# 1. Backup database first
docker exec nt219-mongodb-prod mongodump --out /backups/backup_$(date +%Y%m%d)

# 2. Pull latest code
cd /var/www/nt219
git pull

# 3. Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build

# 4. Check logs
docker-compose -f docker-compose.production.yml logs -f
```

---

## 📝 Files Created

- ✅ `.env.production` - Backend environment
- ✅ `frontend/.env.production` - Frontend environment
- ✅ `docker-compose.production.yml` - Production Docker config
- ✅ `nginx-vps.conf` - VPS Nginx reverse proxy
- ✅ `frontend/nginx.conf` - Container Nginx (updated)
- ✅ `deploy-vps.sh` - Automated deployment script
- ✅ `VPS_DEPLOYMENT_GUIDE.md` - Detailed guide

---

## 🎯 Access URLs After Deployment

- **Frontend:** https://security-test.site
- **API:** https://api.security-test.site
- **Health Check:** https://api.security-test.site/health
- **Admin Dashboard:** https://security-test.site/admin

---

## ⚠️ Important Notes

1. **Change ALL placeholder values** in `.env.production` before deploying
2. **Backup** `.env.production` file - contains critical secrets
3. **Wait for DNS propagation** before running SSL setup (15min - 48hr)
4. **Test thoroughly** after deployment
5. **Setup backups** for database and uploaded files
6. **Monitor logs** regularly for errors
7. **Update Google OAuth** redirect URIs in Google Console
8. **Update Stripe webhooks** to production URL

---

## 📞 Need Help?

1. Check logs: `docker-compose -f docker-compose.production.yml logs -f`
2. Read: `VPS_DEPLOYMENT_GUIDE.md` for detailed steps
3. Check: `DOCKER_GUIDE.md` for Docker troubleshooting
4. Google the specific error message

---

**Ready to deploy? Start with `./deploy-vps.sh` 🚀**
