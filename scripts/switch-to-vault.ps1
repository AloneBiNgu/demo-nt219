# Switch to Vault-only mode
# This script backs up current .env and creates a new one without sensitive secrets

Write-Host "==================================" -ForegroundColor Cyan
Write-Host " Switch to Vault-only Mode" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "ERROR: .env not found!" -ForegroundColor Red
    exit 1
}

# Backup current .env
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = ".env.backup.$timestamp"

Write-Host ""
Write-Host "Creating backup..." -ForegroundColor Cyan
Copy-Item .env $backupFile
Write-Host "Backup created: $backupFile" -ForegroundColor Green

# Ask for confirmation
Write-Host ""
Write-Host "WARNING: This will remove sensitive secrets from .env" -ForegroundColor Yellow
Write-Host "The application will rely on Vault for these secrets." -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Cancelled. Your .env is unchanged." -ForegroundColor Yellow
    exit 0
}

# Copy .env.vault to .env
Write-Host ""
Write-Host "Updating .env..." -ForegroundColor Cyan

if (Test-Path .env.vault) {
    Copy-Item .env.vault .env -Force
    Write-Host ".env updated (secrets removed)" -ForegroundColor Green
} else {
    Write-Host "ERROR: .env.vault not found!" -ForegroundColor Red
    Write-Host "Restoring from backup..." -ForegroundColor Yellow
    Copy-Item $backupFile .env -Force
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host " Vault-only Mode Enabled!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- Original .env backed up to: $backupFile" -ForegroundColor White
Write-Host "- New .env contains only non-sensitive configs" -ForegroundColor White
Write-Host "- Sensitive secrets are loaded from Vault" -ForegroundColor White
Write-Host ""
Write-Host "To rollback:" -ForegroundColor Yellow
Write-Host "  Copy-Item $backupFile .env -Force" -ForegroundColor Gray
Write-Host ""
Write-Host "Restart your application to apply changes:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor Yellow
