# ⚡ Quick Deploy - Hướng Dẫn Nhanh VPS Ubuntu

> **📖 Hướng dẫn chi tiết:** Xem [VPS_DEPLOY_UBUNTU.md](./VPS_DEPLOY_UBUNTU.md)

## 🚀 Deploy Trong 10 Phút

### 1️⃣ Chuẩn Bị VPS

```bash
# SSH vào VPS
ssh root@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim ufw

# Setup firewall
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 2️⃣ Cài Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Logout và login lại SSH
exit
# SSH lại vào
```

### 3️⃣ Clone & Setup

```bash
# Clone source
cd /var/www
git clone https://github.com/AloneBiNgu/demo-nt219.git
cd demo-nt219

# Tạo thư mục
mkdir -p uploads/prototypes logs backups

# Copy và edit environment
cp .env.example .env.production
nano .env.production  # Sửa các giá trị cần thiết
```

### 4️⃣ Cấu Hình Domain

**Tại DNS Provider (Cloudflare, etc.):**

```
A Record:  @    →  YOUR_VPS_IP
A Record:  www  →  YOUR_VPS_IP  
A Record:  api  →  YOUR_VPS_IP
```

### 5️⃣ Deploy Docker

```bash
# Build và start
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d

# Check logs
docker compose -f docker-compose.production.yml logs -f
```

### 6️⃣ Cài Nginx + SSL

```bash
# Install Nginx
sudo apt install -y nginx

# Copy config
sudo cp nginx-vps.conf /etc/nginx/sites-available/your-domain.com
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/

# Edit domain name trong config
sudo nano /etc/nginx/sites-available/your-domain.com

# Test và reload
sudo nginx -t
sudo systemctl reload nginx

# Install SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com
```

### 7️⃣ Xong! ✅

Truy cập:
- **Frontend:** https://your-domain.com
- **API:** https://api.your-domain.com/health

---

## 🔑 Environment Variables Quan Trọng

### Backend (.env.production)

```bash
NODE_ENV=production
MONGO_URI=mongodb://admin:PASSWORD@mongodb:27017/nt219-prod?authSource=admin

# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=GENERATE_64_CHAR_HEX
JWT_REFRESH_SECRET=GENERATE_64_CHAR_HEX
ENCRYPTION_KEY=GENERATE_32_CHAR_HEX

FRONTEND_URL=https://your-domain.com
CLIENT_ORIGIN=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

STRIPE_SECRET_KEY=sk_test_or_live_KEY
STRIPE_WEBHOOK_SECRET=whsec_SECRET

EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your@gmail.com
EMAIL_PASS=app-password
```

### Frontend (frontend/.env.production)

```bash
VITE_API_BASE_URL=https://api.your-domain.com/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_KEY
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## 🛠️ Useful Commands

```bash
# View logs
docker logs -f nt219-backend-prod
docker logs -f nt219-frontend-prod

# Restart services
docker restart nt219-backend-prod
docker restart nt219-frontend-prod

# Stop all
docker compose -f docker-compose.production.yml down

# Start all
docker compose -f docker-compose.production.yml up -d

# Rebuild
docker compose -f docker-compose.production.yml up -d --build

# Update từ GitHub
git pull
docker compose -f docker-compose.production.yml up -d --build
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Container không start | `docker logs nt219-backend-prod` |
| 502 Bad Gateway | Check `curl http://localhost:5000/health` |
| CORS Error | Check `CORS_ORIGIN` trong `.env.production` |
| SSL không hoạt động | `sudo certbot renew` |
| Database connection failed | Check `MONGO_URI` format |

---

## 📊 Health Checks

```bash
# Backend API
curl http://localhost:5000/health

# Frontend
curl http://localhost:3000

# MongoDB
docker exec nt219-mongodb-prod mongosh -u admin -p

# Nginx
sudo nginx -t
sudo systemctl status nginx

# SSL Certificate
sudo certbot certificates
```

---

## 🔄 Update & Redeploy

```bash
cd /var/www/demo-nt219
git pull
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d --build
```

---

## 🎯 Checklist

- [ ] VPS setup với Ubuntu 20.04/22.04
- [ ] Docker & Docker Compose installed
- [ ] Domain DNS pointed to VPS IP
- [ ] `.env.production` configured
- [ ] `frontend/.env.production` configured
- [ ] Docker containers running
- [ ] Nginx installed & configured
- [ ] SSL certificate installed
- [ ] https://your-domain.com works
- [ ] https://api.your-domain.com/health returns OK

---

**🎉 Xong! Nếu cần hướng dẫn chi tiết, xem [VPS_DEPLOY_UBUNTU.md](./VPS_DEPLOY_UBUNTU.md)**
