# Quick Reference: Production Deployment Commands

## 📦 Files to Configure

1. **`.env.production`** - Backend configuration
2. **`frontend/.env.production`** - Frontend configuration
3. **`deploy-vps.sh`** - Update EMAIL variable

## 🔑 Secrets to Generate

```bash
# JWT Access Secret
openssl rand -hex 64

# JWT Refresh Secret
openssl rand -hex 64

# Cookie Secret
openssl rand -hex 64

# Vault Token
openssl rand -hex 32

# MongoDB Password
openssl rand -base64 32
```

## 🚀 One-Command Deploy

```bash
ssh root@YOUR_VPS_IP
cd /var/www && git clone YOUR_REPO nt219 && cd nt219
nano .env.production  # Update secrets
nano frontend/.env.production
chmod +x deploy-vps.sh && sudo ./deploy-vps.sh
```

## 🔍 Quick Health Check

```bash
curl https://api.security-test.site/health
curl https://security-test.site/health
docker-compose -f docker-compose.production.yml ps
```

## 📊 View Logs

```bash
docker-compose -f docker-compose.production.yml logs -f
```

## 🔄 Update & Restart

```bash
cd /var/www/nt219
git pull
docker-compose -f docker-compose.production.yml up -d --build
```

## 🆘 Emergency Commands

```bash
# Stop everything
docker-compose -f docker-compose.production.yml down

# Restart all
docker-compose -f docker-compose.production.yml restart

# Clean Docker (if out of space)
docker system prune -a --volumes

# Check disk space
df -h

# Check resource usage
docker stats
```
