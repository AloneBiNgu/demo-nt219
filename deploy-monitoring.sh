#!/bin/bash

# ===========================================
# Deploy Monitoring Stack to VPS
# ===========================================

set -e

echo "🚀 Deploying Monitoring Stack..."

# Create monitoring directory structure on VPS
ssh root@your-vps-ip << 'ENDSSH'
cd /var/www/demo-nt219

# Create monitoring directories
mkdir -p monitoring/grafana/provisioning/datasources
mkdir -p monitoring/grafana/provisioning/dashboards

# Set permissions
chmod -R 755 monitoring

echo "✅ Monitoring directories created"
ENDSSH

# Copy monitoring files to VPS
echo "📦 Copying monitoring configuration files..."
scp docker-compose.monitoring.yml root@your-vps-ip:/var/www/demo-nt219/
scp monitoring/prometheus.yml root@your-vps-ip:/var/www/demo-nt219/monitoring/
scp monitoring/alertmanager.yml root@your-vps-ip:/var/www/demo-nt219/monitoring/
scp -r monitoring/grafana/provisioning/* root@your-vps-ip:/var/www/demo-nt219/monitoring/grafana/provisioning/

# Start monitoring stack on VPS
echo "🔧 Starting monitoring stack..."
ssh root@your-vps-ip << 'ENDSSH'
cd /var/www/demo-nt219

# Add Grafana password to .env if not exists
if ! grep -q "GRAFANA_ADMIN_PASSWORD" .env; then
    echo "GRAFANA_ADMIN_PASSWORD=$(openssl rand -hex 16)" >> .env
fi

# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Show status
docker-compose -f docker-compose.monitoring.yml ps

echo ""
echo "✅ Monitoring Stack Deployed Successfully!"
echo ""
echo "📊 Access your monitoring dashboards:"
echo "  - Grafana:     https://security-test.site:3001 (admin / check .env for password)"
echo "  - Prometheus:  http://your-vps-ip:9090"
echo "  - AlertManager: http://your-vps-ip:9093"
echo ""
echo "⚠️  Don't forget to configure Nginx reverse proxy for Grafana!"
ENDSSH

echo "🎉 Deployment complete!"
