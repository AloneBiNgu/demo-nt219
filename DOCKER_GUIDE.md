# 🐳 Hướng Dẫn Docker Cho Người Mới Bắt Đầu

## 📋 Mục Lục
1. [Cài Đặt Docker](#1-cài-đặt-docker)
2. [Hiểu Về Docker](#2-hiểu-về-docker)
3. [Cấu Trúc Project](#3-cấu-trúc-project)
4. [Setup Lần Đầu](#4-setup-lần-đầu)
5. [Chạy Ứng Dụng](#5-chạy-ứng-dụng)
6. [Các Lệnh Thường Dùng](#6-các-lệnh-thường-dùng)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Cài Đặt Docker

### Windows
1. Tải **Docker Desktop** từ: https://www.docker.com/products/docker-desktop
2. Chạy file cài đặt
3. Khởi động lại máy tính
4. Mở Docker Desktop và đợi nó khởi động
5. Kiểm tra cài đặt:
```bash
docker --version
docker-compose --version
```

### MacOS
1. Tải Docker Desktop cho Mac
2. Kéo Docker vào Applications
3. Mở Docker từ Applications
4. Kiểm tra tương tự Windows

### Linux (Ubuntu/Debian)
```bash
# Update package index
sudo apt-get update

# Install Docker
sudo apt-get install docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in
docker --version
```

---

## 2. Hiểu Về Docker

### Docker Là Gì?
- **Container**: Giống như một "hộp" chứa ứng dụng và tất cả dependencies
- **Image**: Bản thiết kế để tạo container
- **Dockerfile**: File hướng dẫn tạo image
- **docker-compose**: Công cụ chạy nhiều containers cùng lúc

### Ví Dụ Dễ Hiểu
```
Dockerfile        = Công thức nấu ăn
Docker Image      = Món ăn đã nấu xong (đóng gói)
Docker Container  = Đĩa món ăn đang phục vụ (đang chạy)
```

### Project Này Có Gì?
```
┌─────────────────────────────────────────┐
│  Docker Compose (Điều phối tất cả)      │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ Frontend │  │ Backend  │  │MongoDB ││
│  │  React   │  │ Node.js  │  │Database││
│  │  :3000   │  │  :5000   │  │ :27017 ││
│  └──────────┘  └──────────┘  └────────┘│
│                                         │
│  ┌──────────┐                           │
│  │  Vault   │ (Bảo mật)                 │
│  │  :8200   │                           │
│  └──────────┘                           │
└─────────────────────────────────────────┘
```

---

## 3. Cấu Trúc Project

```
demo-nt219/
├── Dockerfile              # Build backend
├── docker-compose.yml      # Chạy tất cả services
├── .dockerignore          # Files bỏ qua khi build
│
├── frontend/
│   ├── Dockerfile         # Build frontend
│   ├── nginx.conf         # Config web server
│   └── .dockerignore      # Files bỏ qua
│
└── uploads/               # Lưu files upload
```

---

## 4. Setup Lần Đầu

### Bước 1: Cấu Hình Môi Trường

Mở file `docker-compose.yml` và **THAY ĐỔI** các giá trị sau:

#### 4.1. Database Password (Bắt buộc)
```yaml
MONGO_INITDB_ROOT_PASSWORD: your-secure-password-here
# ⚠️ ĐỔI THÀNH: VuiVeMinhMay2025
```

#### 4.2. JWT Secrets (Bắt buộc)
```yaml
JWT_ACCESS_SECRET: your-super-secret-jwt-access-key-change-this
JWT_REFRESH_SECRET: your-super-secret-jwt-refresh-key-change-this
```

**Cách tạo secret ngẫu nhiên:**
```bash
# Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Linux/Mac
openssl rand -base64 32
```

#### 4.3. Stripe Keys (Nếu có)
Lấy từ: https://dashboard.stripe.com/test/apikeys
```yaml
STRIPE_SECRET_KEY: sk_test_...
STRIPE_PUBLISHABLE_KEY: pk_test_...
```

#### 4.4. Email SMTP (Nếu dùng Gmail)
1. Bật 2-Step Verification: https://myaccount.google.com/security
2. Tạo App Password: https://myaccount.google.com/apppasswords
3. Điền vào:
```yaml
EMAIL_USER: your-email@gmail.com
EMAIL_PASS: xxxx xxxx xxxx xxxx  # App password (16 ký tự)
```

#### 4.5. Google OAuth (Nếu dùng)
Lấy từ: https://console.cloud.google.com/apis/credentials
```yaml
GOOGLE_CLIENT_ID: xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET: GOCSPX-xxxxx
```

### Bước 2: Tạo File .env (Tùy chọn)

Nếu muốn dùng file `.env` thay vì viết trong `docker-compose.yml`:

```bash
# Tạo file .env.docker
cp .env.example .env.docker
```

Rồi sửa `docker-compose.yml`:
```yaml
backend:
  env_file:
    - .env.docker
```

---

## 5. Chạy Ứng Dụng

### Lần Đầu Tiên (Build mới)

```bash
# Bước 1: Mở terminal tại thư mục demo-nt219
cd d:\demo-nt219

# Bước 2: Build images (mất 5-10 phút lần đầu)
docker-compose build

# Bước 3: Chạy tất cả containers
docker-compose up -d

# Bước 4: Xem logs để check
docker-compose logs -f
```

### Giải Thích Lệnh:
- `docker-compose build`: Tạo images từ Dockerfile
- `docker-compose up -d`: Chạy containers ở background (-d = detached)
- `docker-compose logs -f`: Xem logs realtime (-f = follow)

### Truy Cập Ứng Dụng:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Vault**: http://localhost:8200

---

## 6. Các Lệnh Thường Dùng

### 6.1. Quản Lý Containers

```bash
# Khởi động tất cả
docker-compose up -d

# Dừng tất cả
docker-compose down

# Khởi động lại
docker-compose restart

# Xem trạng thái
docker-compose ps

# Xem logs
docker-compose logs -f           # Tất cả
docker-compose logs -f backend   # Chỉ backend
docker-compose logs -f frontend  # Chỉ frontend
```

### 6.2. Rebuild (Khi Code Thay Đổi)

```bash
# Rebuild tất cả
docker-compose up -d --build

# Rebuild chỉ backend
docker-compose up -d --build backend

# Rebuild chỉ frontend
docker-compose up -d --build frontend
```

### 6.3. Dọn Dẹp

```bash
# Dừng và xóa containers
docker-compose down

# Xóa cả volumes (⚠️ MẤT DATA!)
docker-compose down -v

# Xóa images không dùng
docker image prune -a

# Xóa tất cả (containers, images, volumes)
docker system prune -a --volumes
```

### 6.4. Vào Bên Trong Container

```bash
# Vào backend container
docker exec -it nt219-backend sh

# Vào MongoDB
docker exec -it nt219-mongodb mongosh

# Chạy lệnh trong container
docker exec nt219-backend npm run seed
```

### 6.5. Kiểm Tra Lỗi

```bash
# Xem logs chi tiết
docker-compose logs -f backend

# Xem logs 100 dòng cuối
docker-compose logs --tail=100 backend

# Check health status
docker-compose ps

# Check resource usage
docker stats
```

---

## 7. Troubleshooting

### ❌ Lỗi: "Port already in use"

**Nguyên nhân**: Port 3000, 5000 hoặc 27017 đang được dùng

**Giải pháp**:
```bash
# Windows - Tìm process dùng port 5000
netstat -ano | findstr :5000

# Kill process (thay PID bằng số tìm được)
taskkill /PID [PID] /F

# Hoặc đổi port trong docker-compose.yml
ports:
  - "5001:5000"  # Đổi 5000 thành 5001
```

### ❌ Lỗi: "Cannot connect to MongoDB"

**Nguyên nhân**: MongoDB chưa sẵn sàng

**Giải pháp**:
```bash
# Check MongoDB status
docker-compose ps mongodb

# Xem MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb

# Đợi 10-15 giây rồi restart backend
docker-compose restart backend
```

### ❌ Lỗi: "EACCES: permission denied"

**Nguyên nhân**: Không có quyền ghi vào thư mục uploads

**Giải pháp**:
```bash
# Linux/Mac
sudo chmod -R 777 uploads

# Hoặc thay đổi owner
sudo chown -R $USER:$USER uploads
```

### ❌ Lỗi: "Build failed"

**Nguyên nhân**: Lỗi trong code hoặc dependencies

**Giải pháp**:
```bash
# Xem logs build chi tiết
docker-compose build --no-cache backend

# Xóa cache và rebuild
docker-compose build --no-cache
docker-compose up -d
```

### ❌ Frontend hiển thị "Cannot connect to server"

**Nguyên nhân**: Frontend không kết nối được backend

**Giải pháp**:
1. Check backend đang chạy:
```bash
docker-compose ps backend
curl http://localhost:5000/health
```

2. Check CORS settings trong `docker-compose.yml`:
```yaml
CORS_ORIGIN: http://localhost:3000
```

3. Check API URL trong frontend:
```bash
# File: frontend/.env hoặc frontend/src/api/baseUrl.ts
VITE_API_URL=http://localhost:5000
```

### ❌ Containers tự động dừng

**Nguyên nhân**: Ứng dụng crash

**Giải pháp**:
```bash
# Xem logs để tìm lỗi
docker-compose logs backend

# Restart với logs
docker-compose up backend
```

---

## 8. Tips & Best Practices

### 🚀 Development Mode

Nếu đang dev và muốn code tự động reload:

```bash
# Chỉ chạy database và vault
docker-compose up -d mongodb vault

# Chạy backend và frontend local như bình thường
npm run dev                    # Backend
cd frontend && npm run dev     # Frontend
```

### 📦 Production Mode

```bash
# Build optimized
docker-compose build --no-cache

# Chạy với resource limits
docker-compose up -d --scale backend=2  # Chạy 2 backend instances
```

### 🔒 Security Checklist

- [ ] Đổi MongoDB password
- [ ] Đổi JWT secrets
- [ ] Đổi Vault token (production)
- [ ] Không commit file `.env`
- [ ] Sử dụng secrets thay vì environment variables (production)

### 📊 Monitoring

```bash
# Xem resource usage
docker stats

# Export logs ra file
docker-compose logs > logs.txt

# Theo dõi liên tục
watch -n 1 docker-compose ps
```

---

## 9. Workflow Thông Thường

### Ngày Làm Việc Bình Thường:

```bash
# Sáng: Bật containers
docker-compose up -d

# Làm việc...
# Code thay đổi → Rebuild
docker-compose up -d --build backend

# Tối: Tắt containers
docker-compose down
```

### Khi Deploy Lên Server:

```bash
# 1. Pull code mới
git pull origin main

# 2. Rebuild images
docker-compose build --no-cache

# 3. Stop old containers
docker-compose down

# 4. Start new containers
docker-compose up -d

# 5. Check logs
docker-compose logs -f

# 6. Seed data nếu cần
docker exec nt219-backend npm run seed
```

---

## 10. Tài Liệu Tham Khảo

- **Docker Docs**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Best Practices**: https://docs.docker.com/develop/dev-best-practices/

---

## 🆘 Cần Giúp Đỡ?

### Check Health:
```bash
# Tất cả containers có HEALTHY?
docker-compose ps

# Backend có response?
curl http://localhost:5000/health

# Frontend có load?
curl http://localhost:3000
```

### Common Issues:
1. **Containers không start**: Check logs → Fix lỗi → Rebuild
2. **Port conflict**: Đổi port trong docker-compose.yml
3. **Out of disk space**: `docker system prune -a`
4. **Slow performance**: Tăng Docker Desktop memory (Settings → Resources)

---

## ✅ Checklist Sau Khi Setup

- [ ] Docker Desktop đang chạy
- [ ] `docker-compose ps` show tất cả containers HEALTHY
- [ ] http://localhost:3000 hiển thị frontend
- [ ] http://localhost:5000/health trả về {"status":"ok"}
- [ ] Có thể đăng ký tài khoản mới
- [ ] Có thể login thành công
- [ ] Database có data (check qua logs)

**🎉 Chúc mừng! Bạn đã setup Docker thành công!**
