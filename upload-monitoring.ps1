# ===========================================
# Quick Deploy Monitoring on VPS
# ===========================================

# 1. Upload monitoring files to VPS
Write-Host "📦 Uploading monitoring files to VPS..." -ForegroundColor Cyan

scp -r monitoring docker-compose.monitoring.yml root@your-vps-ip:/var/www/demo-nt219/

Write-Host "✅ Files uploaded" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps on VPS:" -ForegroundColor Yellow
Write-Host "1. SSH into VPS: ssh root@your-vps-ip" -ForegroundColor White
Write-Host "2. cd /var/www/demo-nt219" -ForegroundColor White
Write-Host "3. echo 'GRAFANA_ADMIN_PASSWORD=your-password' >> .env" -ForegroundColor White
Write-Host "4. docker-compose -f docker-compose.monitoring.yml up -d" -ForegroundColor White
Write-Host ""
Write-Host "Access Grafana at: http://your-vps-ip:3001" -ForegroundColor Green
