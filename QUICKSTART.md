# 🚀 Quick Start Guide

## Bước 1: Cài Docker Desktop
- Tải về: https://www.docker.com/products/docker-desktop
- Cài đặt và khởi động Docker Desktop

## Bước 2: Cấu Hình (Quan Trọng!)

Mở file `docker-compose.yml` và **THAY ĐỔI**:

### 2.1. MongoDB Password
```yaml
MONGO_INITDB_ROOT_PASSWORD: your-secure-password-here
```
👉 Đổi thành password mạnh của bạn

### 2.2. JWT Secrets
```yaml
JWT_ACCESS_SECRET: your-super-secret-jwt-access-key-change-this
JWT_REFRESH_SECRET: your-super-secret-jwt-refresh-key-change-this
```
👉 Tạo 2 chuỗi ngẫu nhiên dài

**Cách tạo nhanh (PowerShell):**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

### 2.3. Email SMTP (Gmail)
1. Vào https://myaccount.google.com/apppasswords
2. Tạo App Password mới
3. Điền vào:
```yaml
EMAIL_USER: your-email@gmail.com
EMAIL_PASS: xxxx xxxx xxxx xxxx
```

### 2.4. Stripe (Nếu có)
Lấy từ: https://dashboard.stripe.com/test/apikeys
```yaml
STRIPE_SECRET_KEY: sk_test_...
STRIPE_PUBLISHABLE_KEY: pk_test_...
```

## Bước 3: Chạy Ứng Dụng

### Cách 1: Dùng Script (Dễ Nhất)

**Windows:**
```bash
# Chạy file batch
.\docker-start.bat
```

**Linux/Mac:**
```bash
# Cho phép thực thi
chmod +x docker-start.sh

# Chạy script
./docker-start.sh
```

### Cách 2: Thủ Công

```bash
# Build images
docker-compose build

# Start containers
docker-compose up -d

# Xem logs
docker-compose logs -f
```

## Bước 4: Truy Cập

- 🌐 **Frontend**: http://localhost:3000
- 🔌 **Backend**: http://localhost:5000
- 🗄️ **MongoDB**: localhost:27017
- 🔐 **Vault**: http://localhost:8200

## Bước 5: Kiểm Tra

```bash
# Check containers đang chạy
docker-compose ps

# Check health
curl http://localhost:5000/health

# Xem logs backend
docker-compose logs -f backend

# Xem logs frontend
docker-compose logs -f frontend
```

## Lệnh Cơ Bản

```bash
# Dừng tất cả
docker-compose down

# Khởi động lại
docker-compose restart

# Rebuild khi code thay đổi
docker-compose up -d --build

# Xem resource usage
docker stats
```

## Troubleshooting

### ❌ Port đã được sử dụng
```bash
# Windows - tìm process
netstat -ano | findstr :5000
taskkill /PID [PID] /F

# Hoặc đổi port trong docker-compose.yml
ports:
  - "5001:5000"
```

### ❌ Cannot connect to MongoDB
```bash
# Restart MongoDB
docker-compose restart mongodb

# Đợi 10 giây
timeout /t 10

# Restart backend
docker-compose restart backend
```

### ❌ Build failed
```bash
# Clean build
docker-compose build --no-cache
docker-compose up -d
```

## 📚 Hướng Dẫn Chi Tiết

Đọc file `DOCKER_GUIDE.md` để biết thêm chi tiết!

---

**✅ Xong! Application đã sẵn sàng!**

🆘 Cần giúp? Check logs: `docker-compose logs -f`
