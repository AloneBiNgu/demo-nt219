# 🚀 VPS Git Setup & Docker Deployment

## Step 1: Configure Git on VPS

SSH vào VPS của bạn và chạy các lệnh sau:

### 1.1 Set Git User Info

```bash
# Set your name (hiển thị trong commit history)
git config --global user.name "Your Name"

# Set your email
git config --global user.email "your-email@example.com"

# Verify
git config --global --list
```

**Example:**
```bash
git config --global user.name "AloneBiNgu"
git config --global user.email "your-email@gmail.com"
```

### 1.2 Setup Git Credential Helper (Optional - để không phải nhập password nhiều lần)

```bash
# Store credentials in cache for 1 hour
git config --global credential.helper cache

# Or store permanently (less secure)
# git config --global credential.helper store
```

### 1.3 Setup SSH Key for GitHub (Recommended)

**Generate SSH key:**
```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Press Enter to accept default location (~/.ssh/id_ed25519)
# Enter passphrase (or leave empty for no passphrase)

# Start ssh-agent
eval "$(ssh-agent -s)"

# Add SSH key
ssh-add ~/.ssh/id_ed25519

# Display public key
cat ~/.ssh/id_ed25519.pub
```

**Add to GitHub:**
1. Copy the output from `cat ~/.ssh/id_ed25519.pub`
2. Go to GitHub → Settings → SSH and GPG keys
3. Click "New SSH key"
4. Paste the key
5. Click "Add SSH key"

**Test connection:**
```bash
ssh -T git@github.com
# Should see: "Hi username! You've successfully authenticated..."
```

### 1.4 Configure Git Settings (Recommended)

```bash
# Set default branch name to main
git config --global init.defaultBranch main

# Enable colored output
git config --global color.ui auto

# Set default editor (optional)
git config --global core.editor nano

# Show full diff in commit messages
git config --global commit.verbose true
```

---

## Step 2: Clone Repository

### Option A: Using HTTPS (Simple)

```bash
cd /var/www
git clone https://github.com/AloneBiNgu/demo-nt219.git nt219
cd nt219
```

### Option B: Using SSH (Recommended - if you setup SSH key)

```bash
cd /var/www
git clone git@github.com:AloneBiNgu/demo-nt219.git nt219
cd nt219
```

### Verify Clone

```bash
# Check remote
git remote -v

# Check branch
git branch

# Check status
git status
```

---

## Step 3: Prepare Environment Files

### 3.1 Create Production Environment for Backend

```bash
cp .env.example .env.production
nano .env.production
```

**Update these critical values:**

```bash
# Generate secrets first
openssl rand -hex 64  # For JWT_ACCESS_SECRET
openssl rand -hex 64  # For JWT_REFRESH_SECRET
openssl rand -hex 64  # For COOKIE_SECRET
openssl rand -hex 32  # For VAULT_TOKEN
openssl rand -base64 32  # For MONGODB_ROOT_PASSWORD
```

**Then edit .env.production:**
```env
NODE_ENV=production
PORT=5000
API_URL=https://api.security-test.site
FRONTEND_URL=https://security-test.site
CORS_ORIGIN=https://security-test.site

# MongoDB (change password!)
MONGODB_URI=mongodb://nt219-admin:YOUR_GENERATED_PASSWORD@mongodb:27017/security-nt219?authSource=admin

# JWT (use generated values!)
JWT_ACCESS_SECRET=paste_generated_hex_here
JWT_REFRESH_SECRET=paste_generated_hex_here
COOKIE_SECRET=paste_generated_hex_here

# Cookies
COOKIE_DOMAIN=.security-test.site
COOKIE_SECURE=true
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=strict

# Vault
VAULT_ADDR=http://vault:8200
VAULT_TOKEN=paste_generated_hex_here

# Email (Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=NT219 Security <your-email@gmail.com>

# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_SUCCESS_URL=https://security-test.site/checkout/success
STRIPE_CANCEL_URL=https://security-test.site/checkout/cancel

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=https://api.security-test.site/oauth/google/callback

# Encryption
ENCRYPTION_KEY=your-32-char-encryption-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=1800000

# Logging
LOG_LEVEL=info
LOG_DIR=/app/logs
```

### 3.2 Create Production Environment for Frontend

```bash
nano frontend/.env.production
```

```env
VITE_API_URL=https://api.security-test.site
VITE_APP_URL=https://security-test.site
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
VITE_NODE_ENV=production
VITE_ENABLE_ANALYTICS=true
```

### 3.3 Update docker-compose.production.yml

```bash
nano docker-compose.production.yml
```

**Update MongoDB password and Vault token** (dòng 15 và 32):
```yaml
MONGO_INITDB_ROOT_PASSWORD: <paste_generated_password>
VAULT_TOKEN: <paste_generated_token>
```

---

## Step 4: Install Docker (if not installed)

### Check if Docker is installed

```bash
docker --version
docker-compose --version
```

### If not installed, install Docker:

```bash
# Update package index
sudo apt-get update

# Install dependencies
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Install Docker Compose (standalone)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Add current user to docker group (optional - để không cần sudo)
sudo usermod -aG docker $USER
# Logout và login lại để apply
```

---

## Step 5: Update Deployment Script

```bash
# Make script executable
chmod +x deploy-vps.sh

# Update EMAIL in script
nano deploy-vps.sh
```

Tìm dòng `EMAIL="your-email@example.com"` và thay đổi thành email thật của bạn.

---

## Step 6: Run Deployment

### Option A: Automated Deployment (Recommended)

```bash
sudo ./deploy-vps.sh
```

Script này sẽ:
- ✅ Install Docker, Nginx, Certbot
- ✅ Configure firewall
- ✅ Build Docker images
- ✅ Start containers
- ✅ Configure Nginx reverse proxy
- ✅ Obtain SSL certificates
- ✅ Setup auto-renewal
- ✅ Configure backups

### Option B: Manual Step-by-Step

```bash
# 1. Build images
docker-compose -f docker-compose.production.yml build

# 2. Start containers
docker-compose -f docker-compose.production.yml up -d

# 3. Check status
docker-compose -f docker-compose.production.yml ps

# 4. View logs
docker-compose -f docker-compose.production.yml logs -f
```

---

## Step 7: Configure Nginx (if not using deploy script)

```bash
# Copy nginx configuration
sudo cp nginx-vps.conf /etc/nginx/sites-available/security-test.site

# Create symlink
sudo ln -s /etc/nginx/sites-available/security-test.site /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## Step 8: Setup SSL Certificate

```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx \
    -d security-test.site \
    -d www.security-test.site \
    -d api.security-test.site \
    --email your-email@example.com \
    --agree-tos \
    --redirect

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Step 9: Verify Deployment

### Check Docker Containers

```bash
docker-compose -f docker-compose.production.yml ps

# All should show "Up" and "healthy"
```

### Check Health Endpoints

```bash
# Backend
curl http://localhost:5000/health
curl https://api.security-test.site/health

# Frontend
curl http://localhost:3000/health
curl https://security-test.site/health
```

### Check Logs

```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend
```

---

## Step 10: Test Application

1. ✅ Visit https://security-test.site
2. ✅ Create new account
3. ✅ Login
4. ✅ Test OAuth login (Google)
5. ✅ Test payment (with test card if using test mode)
6. ✅ Access admin dashboard: https://security-test.site/admin
7. ✅ View audit logs: https://security-test.site/admin/audit-logs

---

## 🔄 Future Updates

When you push new code to GitHub:

```bash
# On VPS
cd /var/www/nt219

# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build

# Check logs
docker-compose -f docker-compose.production.yml logs -f
```

---

## 📊 Useful Commands

### Docker Management

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# Stop all
docker-compose -f docker-compose.production.yml down

# Restart specific service
docker-compose -f docker-compose.production.yml restart backend

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

### Nginx Management

```bash
# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### SSL Management

```bash
# Check certificates
sudo certbot certificates

# Renew manually
sudo certbot renew

# Renew specific domain
sudo certbot renew --cert-name security-test.site
```

---

## 🆘 Troubleshooting

### Container won't start

```bash
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml restart backend
```

### Port already in use

```bash
# Check what's using the port
sudo netstat -tulpn | grep :5000
sudo netstat -tulpn | grep :3000

# Stop PM2 if still running
pm2 stop all
pm2 delete all
```

### Database connection failed

```bash
# Check MongoDB container
docker exec -it nt219-mongodb-prod mongosh

# Restart MongoDB
docker-compose -f docker-compose.production.yml restart mongodb
```

### 502 Bad Gateway

```bash
# Check if backend is running
docker ps | grep backend

# Check backend logs
docker-compose -f docker-compose.production.yml logs backend

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔐 Security Checklist

- [ ] Git configured with SSH key
- [ ] All secrets generated and unique
- [ ] MongoDB password changed
- [ ] JWT secrets are random 64-char hex
- [ ] Gmail App Password configured
- [ ] Stripe production keys added
- [ ] Google OAuth configured with production callback
- [ ] Firewall enabled (UFW)
- [ ] SSL certificates obtained
- [ ] All containers healthy
- [ ] Backup script configured

---

## 📝 Summary

```
✅ Git Setup Complete
✅ Repository Cloned
✅ Environment Configured
✅ Docker Installed
✅ Containers Running
✅ Nginx Configured
✅ SSL Enabled
✅ Application Live!
```

**Access URLs:**
- Frontend: https://security-test.site
- API: https://api.security-test.site
- Admin: https://security-test.site/admin

---

**Next Step:** Start from Step 1 on your VPS! 🚀
