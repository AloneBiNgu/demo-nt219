# Migrate .env secrets to Vault
# This script reads sensitive secrets from .env and writes them to Vault

param(
    [string]$EnvFile = ".env",
    [string]$VaultPath = "secret/demo-nt219"
)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host " Migrate .env to Vault" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check if Vault is configured
if (-not $env:VAULT_ADDR) {
    $env:VAULT_ADDR = "http://127.0.0.1:8200"
    Write-Host "Setting VAULT_ADDR to $env:VAULT_ADDR" -ForegroundColor Yellow
}

# Check if Vault server is running
Write-Host ""
Write-Host "Checking Vault server..." -ForegroundColor Cyan
$vaultStatus = vault status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Vault server is not running!" -ForegroundColor Red
    Write-Host "Please start Vault dev server:" -ForegroundColor Yellow
    Write-Host "  vault server -dev" -ForegroundColor Yellow
    exit 1
}
Write-Host "Vault server is running" -ForegroundColor Green

# Check if .env exists
if (-not (Test-Path $EnvFile)) {
    Write-Host "ERROR: $EnvFile not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Reading $EnvFile..." -ForegroundColor Cyan

# Define sensitive keys that should be stored in Vault
$sensitiveKeys = @(
    'MONGO_URI',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'EMAIL_USER',
    'EMAIL_PASS',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
)

# Read .env file
$envContent = Get-Content $EnvFile
$secrets = @{}
$foundCount = 0

foreach ($line in $envContent) {
    # Skip empty lines and comments
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith('#')) {
        continue
    }
    
    # Split by first = sign
    $parts = $line.Split('=', 2)
    if ($parts.Length -eq 2) {
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        
        # Only migrate sensitive secrets
        if ($key -in $sensitiveKeys) {
            $secrets[$key] = $value
            $foundCount++
            Write-Host "  Found: $key" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "Found $foundCount sensitive secrets" -ForegroundColor Cyan

if ($secrets.Count -eq 0) {
    Write-Host "No secrets to migrate!" -ForegroundColor Yellow
    exit 0
}

# Write to Vault
Write-Host ""
Write-Host "Writing secrets to Vault..." -ForegroundColor Cyan
Write-Host "Path: $VaultPath" -ForegroundColor Gray

try {
    # Build vault kv put command
    $vaultArgs = @('kv', 'put', $VaultPath)
    foreach ($key in $secrets.Keys) {
        $vaultArgs += "$key=$($secrets[$key])"
    }
    
    # Execute vault command
    & vault $vaultArgs 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully migrated $($secrets.Count) secrets to Vault!" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to write secrets to Vault" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Verify secrets were written
Write-Host ""
Write-Host "Verifying secrets in Vault..." -ForegroundColor Cyan

try {
    $vaultData = vault kv get -format=json $VaultPath | ConvertFrom-Json
    $storedKeys = $vaultData.data.data.PSObject.Properties.Name
    
    Write-Host "Stored secrets:" -ForegroundColor Green
    foreach ($key in $storedKeys) {
        Write-Host "  - $key" -ForegroundColor Gray
    }
    
    # Check if all secrets were stored
    $missingKeys = @()
    foreach ($key in $secrets.Keys) {
        if ($key -notin $storedKeys) {
            $missingKeys += $key
        }
    }
    
    if ($missingKeys.Count -gt 0) {
        Write-Host ""
        Write-Host "WARNING: Missing secrets:" -ForegroundColor Yellow
        foreach ($key in $missingKeys) {
            Write-Host "  - $key" -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "All secrets verified successfully!" -ForegroundColor Green
    }
} catch {
    Write-Host "WARNING: Could not verify secrets" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host " Migration Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Your secrets are now in Vault at: $VaultPath" -ForegroundColor White
Write-Host "2. The application will automatically read from Vault" -ForegroundColor White
Write-Host "3. You can optionally remove sensitive values from .env" -ForegroundColor White
Write-Host ""
Write-Host "To view secrets in Vault:" -ForegroundColor Cyan
Write-Host "  vault kv get $VaultPath" -ForegroundColor Yellow
