# HashiCorp Vault Setup Script for Windows
# This script automates Vault installation and configuration

param(
    [string]$VaultVersion = "1.15.0"
)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host " Vault Setup Script for Windows" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check if Vault is already installed
$vaultExists = Get-Command vault -ErrorAction SilentlyContinue

if ($vaultExists) {
    Write-Host "Vault is already installed" -ForegroundColor Green
    vault version
} else {
    Write-Host "Vault is not installed. Please install it first:" -ForegroundColor Yellow
    Write-Host "  choco install vault" -ForegroundColor Yellow
    Write-Host "  Or download from: https://www.vaultproject.io/downloads" -ForegroundColor Yellow
    exit 1
}

# Check if Vault server is running
Write-Host ""
Write-Host "Checking Vault server status..." -ForegroundColor Cyan

$env:VAULT_ADDR = "http://127.0.0.1:8200"
$vaultStatus = vault status 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Vault server is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Vault dev server in another terminal:" -ForegroundColor Yellow
    Write-Host "  vault server -dev" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Then copy the Root Token and set it:" -ForegroundColor Yellow
    Write-Host '  $env:VAULT_TOKEN = "your-root-token"' -ForegroundColor Yellow
    exit 1
}

Write-Host "Vault server is running" -ForegroundColor Green

# Check if VAULT_TOKEN is set
if (-not $env:VAULT_TOKEN) {
    Write-Host "VAULT_TOKEN is not set!" -ForegroundColor Red
    Write-Host "Please set your root token:" -ForegroundColor Yellow
    Write-Host '  $env:VAULT_TOKEN = "your-root-token"' -ForegroundColor Yellow
    exit 1
}

# Enable KV v2 secrets engine
Write-Host ""
Write-Host "Enabling KV v2 secrets engine..." -ForegroundColor Cyan

vault secrets enable -path=secret kv-v2 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "KV v2 secrets engine enabled" -ForegroundColor Green
} else {
    Write-Host "KV v2 secrets engine already enabled" -ForegroundColor Yellow
}

# Create policy
Write-Host ""
Write-Host "Creating Vault policy..." -ForegroundColor Cyan

$policyContent = @"
path "secret/data/demo-nt219" {
  capabilities = ["read"]
}

path "secret/metadata/demo-nt219" {
  capabilities = ["list", "read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}
"@

$policyContent | vault policy write demo-nt219-policy - 2>&1 | Out-Null
Write-Host "Policy created successfully" -ForegroundColor Green

# Enable AppRole auth
Write-Host ""
Write-Host "Enabling AppRole authentication..." -ForegroundColor Cyan

vault auth enable approle 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "AppRole authentication enabled" -ForegroundColor Green
} else {
    Write-Host "AppRole authentication already enabled" -ForegroundColor Yellow
}

# Create AppRole
Write-Host "Creating AppRole..." -ForegroundColor Cyan

vault write auth/approle/role/demo-nt219 `
    token_policies="demo-nt219-policy" `
    token_ttl=1h `
    token_max_ttl=4h `
    secret_id_ttl=0 2>&1 | Out-Null

Write-Host "AppRole created successfully" -ForegroundColor Green

# Get Role ID and Secret ID
Write-Host ""
Write-Host "Generating credentials..." -ForegroundColor Cyan

$roleId = vault read -field=role_id auth/approle/role/demo-nt219/role-id
$secretId = vault write -f -field=secret_id auth/approle/role/demo-nt219/secret-id

Write-Host "Role ID: $roleId" -ForegroundColor Green
Write-Host "Secret ID: $secretId" -ForegroundColor Green

# Migrate secrets from .env
Write-Host ""
Write-Host "Migrating secrets from .env to Vault..." -ForegroundColor Cyan

if (Test-Path .env) {
    Write-Host "Reading .env file..." -ForegroundColor Cyan
    
    $envContent = Get-Content .env
    $secrets = @{}
    
    $sensitiveKeys = @('MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'ENCRYPTION_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'EMAIL_USER', 'EMAIL_PASS', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET')
    
    foreach ($line in $envContent) {
        if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith('#')) {
            continue
        }
        
        $parts = $line.Split('=', 2)
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            
            if ($key -in $sensitiveKeys) {
                $secrets[$key] = $value
            }
        }
    }
    
    if ($secrets.Count -gt 0) {
        $vaultArgs = @('kv', 'put', 'secret/demo-nt219')
        foreach ($key in $secrets.Keys) {
            $vaultArgs += "$key=$($secrets[$key])"
        }
        & vault $vaultArgs
        Write-Host "Secrets migrated to Vault" -ForegroundColor Green
    } else {
        Write-Host "No secrets found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host ".env file not found" -ForegroundColor Yellow
}

# Update .env with Vault credentials
Write-Host ""
Write-Host "Updating .env with Vault credentials..." -ForegroundColor Cyan

$envUpdates = @"

# Vault Configuration
VAULT_ENABLED=true
VAULT_ADDR=http://127.0.0.1:8200
VAULT_ROLE_ID=$roleId
VAULT_SECRET_ID=$secretId
VAULT_SECRET_PATH=secret/demo-nt219
VAULT_TOKEN_RENEW_INTERVAL=1800000
VAULT_NAMESPACE=
VAULT_APPROLE_PATH=auth/approle
VAULT_RETRY_ATTEMPTS=3
VAULT_RETRY_DELAY=1000
VAULT_HEALTH_CHECK_INTERVAL=60000
VAULT_FALLBACK_TO_ENV=true
"@

Add-Content .env $envUpdates
Write-Host ".env updated with Vault credentials" -ForegroundColor Green

# Verify setup
Write-Host ""
Write-Host "Verifying Vault setup..." -ForegroundColor Cyan

$testAuth = vault write auth/approle/login role_id=$roleId secret_id=$secretId 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "AppRole authentication verified" -ForegroundColor Green
} else {
    Write-Host "AppRole authentication failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host " Vault Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the .env file for Vault configuration" -ForegroundColor White
Write-Host "2. Start your application: npm run dev" -ForegroundColor White
Write-Host "3. The app will automatically connect to Vault" -ForegroundColor White
Write-Host ""
Write-Host "To access Vault UI: http://127.0.0.1:8200" -ForegroundColor Cyan
Write-Host "Root Token: $env:VAULT_TOKEN" -ForegroundColor Cyan
