#!/bin/bash

# ===========================================
# VPS Production Deployment Script
# ===========================================
# Domain: security-test.site
# This script automates the deployment process
# ===========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ===========================================
# Configuration
# ===========================================
DOMAIN="security-test.site"
API_DOMAIN="api.security-test.site"
PROJECT_DIR="/var/www/nt219"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
EMAIL="your-email@example.com"  # Change this for Let's Encrypt

# ===========================================
# Check if running as root
# ===========================================
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

print_info "Starting deployment for $DOMAIN..."

# ===========================================
# Step 1: Update System
# ===========================================
print_info "Updating system packages..."
apt-get update && apt-get upgrade -y
print_success "System updated"

# ===========================================
# Step 2: Install Dependencies
# ===========================================
print_info "Installing required packages..."
apt-get install -y \
    docker.io \
    docker-compose \
    nginx \
    certbot \
    python3-certbot-nginx \
    git \
    curl \
    ufw

print_success "Dependencies installed"

# ===========================================
# Step 3: Start Docker
# ===========================================
print_info "Starting Docker service..."
systemctl start docker
systemctl enable docker
print_success "Docker service started"

# ===========================================
# Step 4: Configure Firewall
# ===========================================
print_info "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
print_success "Firewall configured"

# ===========================================
# Step 5: Clone or Update Repository
# ===========================================
if [ -d "$PROJECT_DIR" ]; then
    print_info "Updating existing repository..."
    cd $PROJECT_DIR
    git pull
else
    print_info "Cloning repository..."
    mkdir -p /var/www
    cd /var/www
    # Replace with your repository URL
    git clone https://github.com/yourusername/demo-nt219.git nt219
    cd nt219
fi

print_success "Repository ready"

# ===========================================
# Step 6: Setup Environment Variables
# ===========================================
print_info "Setting up environment variables..."

if [ ! -f ".env.production" ]; then
    print_warning ".env.production not found!"
    print_info "Please create .env.production file with your configuration"
    print_info "Template available in repository"
    exit 1
fi

# Generate random secrets if needed
print_info "Generating random secrets..."
export MONGODB_ROOT_PASSWORD=$(openssl rand -base64 32)
export JWT_ACCESS_SECRET=$(openssl rand -hex 64)
export JWT_REFRESH_SECRET=$(openssl rand -hex 64)
export COOKIE_SECRET=$(openssl rand -hex 64)
export VAULT_ROOT_TOKEN=$(openssl rand -hex 32)

# Save secrets to a file (secure it!)
cat > .env.secrets << EOF
MONGODB_ROOT_PASSWORD=$MONGODB_ROOT_PASSWORD
JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
COOKIE_SECRET=$COOKIE_SECRET
VAULT_ROOT_TOKEN=$VAULT_ROOT_TOKEN
EOF

chmod 600 .env.secrets

print_success "Environment variables configured"
print_warning "IMPORTANT: Secrets saved to .env.secrets - backup this file securely!"

# ===========================================
# Step 7: Build Docker Images
# ===========================================
print_info "Building Docker images..."
docker-compose -f docker-compose.production.yml build --no-cache

print_success "Docker images built"

# ===========================================
# Step 8: Start Docker Containers
# ===========================================
print_info "Starting Docker containers..."
docker-compose -f docker-compose.production.yml up -d

print_success "Docker containers started"

# Wait for services to be ready
print_info "Waiting for services to be healthy..."
sleep 30

# ===========================================
# Step 9: Configure Nginx
# ===========================================
print_info "Configuring Nginx..."

# Copy nginx configuration
cp nginx-vps.conf $NGINX_CONF

# Create symlink
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

print_success "Nginx configured"

# ===========================================
# Step 10: Obtain SSL Certificate
# ===========================================
print_info "Obtaining SSL certificate from Let's Encrypt..."

# First, reload nginx to serve ACME challenge
systemctl reload nginx

# Obtain certificate
certbot --nginx \
    -d $DOMAIN \
    -d www.$DOMAIN \
    -d $API_DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --redirect

print_success "SSL certificate obtained"

# ===========================================
# Step 11: Setup Auto-Renewal
# ===========================================
print_info "Setting up SSL auto-renewal..."

# Test renewal
certbot renew --dry-run

# Add cron job for auto-renewal
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

print_success "SSL auto-renewal configured"

# ===========================================
# Step 12: Setup Log Rotation
# ===========================================
print_info "Setting up log rotation..."

cat > /etc/logrotate.d/nt219 << EOF
$PROJECT_DIR/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    copytruncate
}
EOF

print_success "Log rotation configured"

# ===========================================
# Step 13: Setup Backup Cron Job
# ===========================================
print_info "Setting up database backups..."

mkdir -p $PROJECT_DIR/backups

cat > /usr/local/bin/backup-mongodb.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/www/nt219/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec nt219-mongodb-prod mongodump --out /backups/backup_$DATE
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
EOF

chmod +x /usr/local/bin/backup-mongodb.sh

# Add to crontab (daily at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-mongodb.sh") | crontab -

print_success "Backup cron job configured"

# ===========================================
# Step 14: Setup Monitoring (Optional)
# ===========================================
print_info "Setting up basic monitoring..."

# Install monitoring tools
apt-get install -y htop nethogs iotop

# Setup basic health check script
cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash
curl -f http://localhost:5000/health || echo "Backend health check failed!" | mail -s "Backend Down" your-email@example.com
curl -f http://localhost:3000/health || echo "Frontend health check failed!" | mail -s "Frontend Down" your-email@example.com
EOF

chmod +x /usr/local/bin/health-check.sh

# Add to crontab (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/health-check.sh") | crontab -

print_success "Monitoring configured"

# ===========================================
# Final Steps
# ===========================================
print_info "Checking deployment status..."

# Check if containers are running
docker-compose -f docker-compose.production.yml ps

# Check nginx status
systemctl status nginx --no-pager

print_success "========================================="
print_success "🎉 DEPLOYMENT COMPLETE!"
print_success "========================================="
echo ""
print_info "Your application is now accessible at:"
echo ""
echo -e "${GREEN}✅ Frontend: https://$DOMAIN${NC}"
echo -e "${GREEN}✅ API: https://$API_DOMAIN${NC}"
echo ""
print_warning "IMPORTANT NEXT STEPS:"
echo "1. Backup the .env.secrets file securely"
echo "2. Update DNS records to point to this server:"
echo "   - A record: $DOMAIN → $(curl -s ifconfig.me)"
echo "   - A record: www.$DOMAIN → $(curl -s ifconfig.me)"
echo "   - A record: $API_DOMAIN → $(curl -s ifconfig.me)"
echo "3. Update .env.production with actual API keys (Stripe, Google OAuth, etc.)"
echo "4. Restart containers: docker-compose -f docker-compose.production.yml restart"
echo "5. Test all features thoroughly"
echo ""
print_info "Useful commands:"
echo "  - View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "  - Restart: docker-compose -f docker-compose.production.yml restart"
echo "  - Stop: docker-compose -f docker-compose.production.yml down"
echo "  - Rebuild: docker-compose -f docker-compose.production.yml up -d --build"
echo ""
print_success "Happy deploying! 🚀"
