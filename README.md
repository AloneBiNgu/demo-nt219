# 🛒 NT219 - Secure E-commerce Platform

> Một nền tảng thương mại điện tử bảo mật cao, được xây dựng với các nguyên tắc an ninh hàng đầu cho môn học NT219.

## 📖 Repo này làm gì?

Đây là một ứng dụng **bán hàng trực tuyến hoàn chỉnh** với các tính năng:

- 🛍️ **Mua sắm**: Xem sản phẩm, thêm vào giỏ hàng, thanh toán
- 💳 **Thanh toán**: Tích hợp Stripe để thanh toán thẻ an toàn
- 🔐 **Bảo mật**: Đăng ký/đăng nhập với mã hóa mạnh, OAuth2 (GitHub, Discord)
- 👤 **Quản lý**: Admin có thể thêm/sửa/xóa sản phẩm
- 📧 **Email**: Gửi email xác nhận, đặt lại mật khẩu
- 🔒 **An toàn tuyệt đối**: Tuân thủ OWASP Top 10, GDPR, PCI-DSS

**Dành cho ai?**
- ✅ Sinh viên muốn học về an ninh web
- ✅ Developer muốn tham khảo kiến trúc bảo mật
- ✅ Người không chuyên muốn chạy thử một website bán hàng

## 🎯 Demo Trực Tiếp

- **Website**: https://security-test.site
- **API Health**: https://api.security-test.site/api/v1/health

Thử đăng nhập bằng GitHub hoặc Discord!

---

## 🚀 Cài Đặt Nhanh (5 phút)

### Yêu Cầu
- **Node.js** phiên bản 18 trở lên ([Tải tại đây](https://nodejs.org/))
- **Docker Desktop** ([Tải tại đây](https://www.docker.com/products/docker-desktop))
- **Git** ([Tải tại đây](https://git-scm.com/))

### Bước 1: Tải Code Về

```bash
git clone https://github.com/AloneBiNgu/demo-nt219.git
cd demo-nt219
```

### Bước 2: Cấu Hình Môi Trường

```bash
# Copy file cấu hình mẫu
cp .env.example .env

# Mở file .env và điền thông tin cần thiết
```

**Thông tin cần điền trong file `.env`:**

```bash
# Cơ bản - BẮT BUỘC
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/demo-nt219

# JWT Secrets - BẮT BUỘC (tạo bằng lệnh: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_ACCESS_SECRET=your_random_64_char_hex_string_here
JWT_REFRESH_SECRET=another_random_64_char_hex_string_here

# CORS - BẮT BUỘC
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Stripe - TÙY CHỌN (để test thanh toán)
STRIPE_SECRET_KEY=sk_test_... (lấy từ https://dashboard.stripe.com)
STRIPE_WEBHOOK_SECRET=whsec_... (sau khi setup webhook)

# Email - TÙY CHỌN (để gửi email)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# GitHub OAuth - TÙY CHỌN
GITHUB_CLIENT_ID=... (lấy từ GitHub Settings > Developer)
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:5000/api/v1/oauth/github/callback

# Discord OAuth - TÙY CHỌN
DISCORD_CLIENT_ID=... (lấy từ Discord Developer Portal)
DISCORD_CLIENT_SECRET=...
DISCORD_CALLBACK_URL=http://localhost:5000/api/v1/oauth/discord/callback

# Encryption Key - BẮT BUỘC
ENCRYPTION_KEY=your_random_64_char_hex_string_for_encryption
```

### Bước 3: Chạy Bằng Docker (Khuyến Nghị)

**Windows:**
```bash
docker-compose up -d
```

**Linux/Mac:**
```bash
sudo docker-compose up -d
```

Đợi 1-2 phút để Docker tải và khởi chạy tất cả services.

### Bước 4: Truy Cập

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/v1
- **MongoDB**: localhost:27017
- **Vault**: http://localhost:8200 (token: `myroot`)

**🎉 Xong! Bây giờ bạn có thể:**
1. Mở http://localhost:5173 để xem website
2. Đăng ký tài khoản mới hoặc đăng nhập bằng GitHub/Discord
3. Thêm sản phẩm vào giỏ hàng và test thanh toán

---

## 🛠️ Chạy Thủ Công (Không Dùng Docker)

Nếu bạn muốn chạy trực tiếp trên máy:

### Backend

```bash
# Cài đặt dependencies
npm install

# Chạy development mode (có hot reload)
npm run dev

# Hoặc build và chạy production
npm run build
npm start
```

Backend sẽ chạy tại: http://localhost:5000

### Frontend

```bash
# Vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Chạy development mode
npm run dev

# Hoặc build production
npm run build
npm run preview
```

Frontend sẽ chạy tại: http://localhost:5173

---

## 📱 Tính Năng Chính

### Người Dùng Thường
- ✅ Đăng ký / Đăng nhập (email + password hoặc OAuth2)
- ✅ Xem danh sách sản phẩm
- ✅ Thêm sản phẩm vào giỏ hàng
- ✅ Thanh toán bằng thẻ (Stripe)
- ✅ Xem lịch sử đơn hàng
- ✅ Đặt lại mật khẩu qua email
- ✅ Xác thực 2 yếu tố (2FA) với TOTP

### Admin
- ✅ Tất cả quyền của người dùng thường
- ✅ Thêm / Sửa / Xóa sản phẩm
- ✅ Xem tất cả đơn hàng
- ✅ Xem audit logs (nhật ký hành động)
- ✅ Xem analytics dashboard

### Bảo Mật
- 🔐 Mật khẩu được mã hóa bằng **bcrypt** (12 rounds)
- 🔐 JWT tokens với **HTTP-only cookies** (chống XSS)
- 🔐 **Refresh token rotation** (token cũ vô hiệu sau khi refresh)
- 🔐 **Rate limiting**: 
  - 100 requests/15min (chung)
  - 5 requests/1min (đăng nhập)
  - 3 requests/15min (thanh toán)
- 🔐 **Input validation** với Joi
- 🔐 **AES-256-GCM** encryption cho dữ liệu nhạy cảm
- 🔐 **RBAC** (Role-Based Access Control)
- 🔐 **Audit logging** - Ghi nhận mọi hành động
- 🔐 **HashiCorp Vault** - Quản lý secrets an toàn

---

## 🔌 API Endpoints

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/register` | Đăng ký tài khoản mới |
| POST | `/login` | Đăng nhập |
| POST | `/logout` | Đăng xuất |
| POST | `/refresh` | Làm mới access token |
| GET | `/me` | Lấy thông tin user hiện tại |
| POST | `/forgot-password` | Yêu cầu reset mật khẩu |
| POST | `/reset-password` | Reset mật khẩu bằng token |

### Products (`/api/v1/products`)
| Method | Endpoint | Mô tả | Yêu cầu |
|--------|----------|-------|---------|
| GET | `/` | Danh sách sản phẩm | Public |
| GET | `/:id` | Chi tiết sản phẩm | Public |
| POST | `/` | Tạo sản phẩm mới | Admin |
| PUT | `/:id` | Cập nhật sản phẩm | Admin |
| DELETE | `/:id` | Xóa sản phẩm | Admin |

### Cart (`/api/v1/cart`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Xem giỏ hàng |
| POST | `/items` | Thêm vào giỏ |
| PUT | `/items/:itemId` | Cập nhật số lượng |
| DELETE | `/items/:itemId` | Xóa khỏi giỏ |
| DELETE | `/` | Xóa toàn bộ giỏ |

### Orders (`/api/v1/orders`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Danh sách đơn hàng |
| GET | `/:id` | Chi tiết đơn hàng |
| POST | `/` | Tạo đơn từ giỏ hàng |

### Payments (`/api/v1/payments`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/create-intent` | Tạo Stripe payment intent |
| POST | `/webhook` | Stripe webhook handler |

### OAuth (`/api/v1/oauth`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/github` | Đăng nhập GitHub |
| GET | `/github/callback` | GitHub callback |
| GET | `/discord` | Đăng nhập Discord |
| GET | `/discord/callback` | Discord callback |

---

## 🏗️ Kiến Trúc Project

```
demo-nt219/
├── src/                          # Backend source code
│   ├── config/                   # Cấu hình (DB, Vault, Passport)
│   ├── controllers/              # Xử lý HTTP requests
│   ├── middleware/               # Auth, validation, error handling
│   ├── models/                   # MongoDB schemas
│   ├── routes/                   # API routes
│   ├── services/                 # Business logic
│   ├── utils/                    # Helper functions
│   └── validators/               # Joi validation schemas
│
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/           # UI components
│   │   ├── pages/                # Page components
│   │   ├── features/             # Feature modules
│   │   ├── api/                  # API client
│   │   └── theme/                # Chakra UI theme
│   └── Dockerfile
│
├── scripts/                      # Setup & migration scripts
├── tests/                        # Unit & integration tests
├── monitoring/                   # Prometheus, Grafana configs
├── docker-compose.yml            # Development
├── docker-compose.production.yml # Production
├── Dockerfile                    # Backend image
└── README.md                     # Bạn đang đọc đây!
```

---

## 🧪 Testing

```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm run test:coverage

# Chạy tests ở chế độ watch
npm run test:watch

# Chỉ chạy unit tests
npm run test:unit

# Chỉ chạy integration tests
npm run test:integration
```

**Test coverage hiện tại:** ~85%

---

## 🐳 Docker Commands

### Development

```bash
# Start tất cả services
docker-compose up -d

# Stop tất cả
docker-compose down

# Xem logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart một service
docker-compose restart backend

# Xem status
docker-compose ps
```

### Production

```bash
# Pull images mới
docker-compose -f docker-compose.production.yml pull

# Start services
docker-compose -f docker-compose.production.yml up -d

# Xem logs
docker-compose -f docker-compose.production.yml logs -f

# Restart
docker-compose -f docker-compose.production.yml restart backend frontend
```

---

## 🚀 Deploy Lên VPS (Production)

### Yêu Cầu
- VPS Ubuntu 20.04+ 
- Domain đã trỏ về IP của VPS
- Docker đã cài đặt trên VPS

### Bước 1: Chuẩn Bị VPS

```bash
# SSH vào VPS
ssh root@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài Docker Compose
sudo apt install docker-compose -y

# Clone repository
cd /var/www
git clone https://github.com/AloneBiNgu/demo-nt219.git
cd demo-nt219
```

### Bước 2: Cấu Hình Environment

```bash
# Tạo file .env
nano .env

# Điền các thông tin production (tương tự như local nhưng thay domain)
```

### Bước 3: Build & Push Docker Images

**Trên máy local:**

```bash
# Build backend
docker build -t YOUR_DOCKERHUB_USERNAME/nt219-backend:latest .

# Build frontend với production API URL
cd frontend
docker build -t YOUR_DOCKERHUB_USERNAME/nt219-frontend:latest . \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com/api/v1 \
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Push lên Docker Hub
docker push YOUR_DOCKERHUB_USERNAME/nt219-backend:latest
docker push YOUR_DOCKERHUB_USERNAME/nt219-frontend:latest
```

### Bước 4: Deploy Trên VPS

```bash
# Pull images
docker-compose -f docker-compose.production.yml pull

# Start services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps
```

### Bước 5: Setup Nginx + SSL

```bash
# Cài Nginx và Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Copy nginx config
sudo cp nginx-vps.conf /etc/nginx/sites-available/demo-nt219
sudo ln -s /etc/nginx/sites-available/demo-nt219 /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Lấy SSL certificate (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

**🎉 Xong! Website của bạn đã online!**

---

## 🔐 Cấu Hình HashiCorp Vault (Tùy Chọn)

Vault giúp quản lý secrets (passwords, API keys) một cách an toàn hơn.

### Bước 1: Enable Vault

```bash
# Trong file .env
VAULT_ENABLED=true
VAULT_ADDR=http://vault:8200
VAULT_TOKEN=myproductiontoken1762855136
```

### Bước 2: Write Secrets Vào Vault

```bash
# Vào container Vault
docker exec -it nt219-vault-prod sh

# Setup Vault
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='myproductiontoken1762855136'

# Enable KV secrets engine
vault secrets enable -version=2 -path=secret kv

# Write secrets
vault kv put secret/demo-nt219 \
  NODE_ENV="production" \
  MONGO_URI="mongodb://mongodb:27017/security-nt219" \
  JWT_ACCESS_SECRET="your_secret" \
  JWT_REFRESH_SECRET="your_secret" \
  STRIPE_SECRET_KEY="sk_live_..." \
  EMAIL_USER="your_email@gmail.com" \
  EMAIL_PASS="your_app_password"

# Verify
vault kv get secret/demo-nt219

# Exit
exit
```

### Bước 3: Restart Backend

```bash
docker-compose -f docker-compose.production.yml restart backend
```

Backend sẽ tự động đọc secrets từ Vault thay vì file `.env`.

---

## 📊 Monitoring (Tùy Chọn)

Project có sẵn Prometheus + Grafana để theo dõi performance.

```bash
# Deploy monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Access
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

**Metrics được thu thập:**
- CPU, RAM, Disk usage
- HTTP request rate
- Response time
- Error rate
- Database connections

---

## 🛠️ Troubleshooting

### Backend không chạy được?

```bash
# Check logs
docker logs nt219-backend-prod

# Thường là do:
# 1. MongoDB chưa chạy
docker ps | grep mongo

# 2. .env file thiếu thông tin
cat .env

# 3. Port 5000 bị chiếm
lsof -i :5000  # Linux/Mac
netstat -ano | findstr :5000  # Windows
```

### Frontend không kết nối được backend?

```bash
# Check CORS trong .env
CORS_ORIGIN=http://localhost:5173  # Phải khớp với frontend URL

# Rebuild frontend nếu thay đổi API URL
docker-compose up -d --build frontend
```

### Stripe webhook không hoạt động?

```bash
# Trong development, dùng Stripe CLI
stripe listen --forward-to localhost:5000/api/v1/payments/webhook

# Copy webhook secret vào .env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### MongoDB connection timeout?

```bash
# Check MongoDB đang chạy
docker ps | grep mongodb

# Restart MongoDB
docker-compose restart mongodb

# Check network
docker network ls
docker network inspect demo-nt219_nt219-network
```

---

## 📝 Lưu Ý Quan Trọng

### Secrets
- ⚠️ **KHÔNG BAO GIỜ** commit file `.env` lên GitHub
- ⚠️ Luôn dùng `.env.example` làm template
- ⚠️ Generate secrets mạnh: 
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### Production
- ⚠️ Đổi `NODE_ENV=production` trong file `.env`
- ⚠️ Dùng secrets thật từ Stripe, Gmail
- ⚠️ Setup SSL certificate bằng Let's Encrypt
- ⚠️ Enable Vault để quản lý secrets
- ⚠️ Setup backup cho MongoDB
- ⚠️ Monitor logs thường xuyên

### Development
- ✅ Dùng Stripe test keys (`sk_test_...`)
- ✅ Dùng MongoDB local hoặc Docker
- ✅ Có thể bỏ qua OAuth nếu không cần

---

## 📚 Tài Liệu Thêm

- **[SECURITY-ARCHITECTURE.md](./SECURITY-ARCHITECTURE.md)** - Kiến trúc bảo mật chi tiết
- **[VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md)** - Hướng dẫn deploy lên VPS
- **[DOCKER_GUIDE.md](./DOCKER_GUIDE.md)** - Hướng dẫn Docker chi tiết

---

## 🤝 Đóng Góp

Mọi đóng góp đều được hoan nghênh! 

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push lên branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

---

## 📄 License

Project này dùng cho mục đích giáo dục (môn NT219 - An ninh thông tin).

---

## 👨‍💻 Tác Giả

- **Sinh viên**: Huỳnh Phạm Thanh Như
- **MSSV**: 22520986
- **Môn học**: NT219 - An Ninh Thông Tin
- **Trường**: UIT - Đại học Công nghệ Thông tin

---

## 🙏 Cảm Ơn

- **OWASP** - Security guidelines
- **Stripe** - Payment processing
- **HashiCorp** - Vault secrets management
- **All open-source contributors**

---

**Có câu hỏi?** Tạo issue trên GitHub hoặc liên hệ qua email!

**⭐ Nếu project này hữu ích, hãy cho một star nhé!**
