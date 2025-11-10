#!/bin/bash

# HashiCorp Vault Setup Script for demo-nt219
# This script helps you set up Vault for local development

set -e

echo "🔐 HashiCorp Vault Setup for demo-nt219"
echo "========================================"
echo ""

# Check if Vault is installed
if ! command -v vault &> /dev/null; then
    echo "❌ Vault is not installed!"
    echo ""
    echo "Install Vault:"
    echo "  macOS:   brew install vault"
    echo "  Linux:   https://www.vaultproject.io/downloads"
    echo "  Windows: choco install vault"
    echo ""
    exit 1
fi

echo "✅ Vault is installed: $(vault version)"
echo ""

# Check if Vault server is running
if ! vault status &> /dev/null; then
    echo "⚠️  Vault server is not running"
    echo ""
    echo "Starting Vault dev server..."
    echo "Run in a separate terminal:"
    echo "  vault server -dev"
    echo ""
    echo "Then export the root token:"
    echo "  export VAULT_ADDR='http://127.0.0.1:8200'"
    echo "  export VAULT_TOKEN='your-dev-root-token-here'"
    echo ""
    exit 1
fi

echo "✅ Vault server is running"
echo ""

# Enable KV v2 secrets engine (if not already enabled)
echo "📦 Enabling KV v2 secrets engine..."
vault secrets enable -path=secret kv-v2 2>/dev/null || echo "✅ KV v2 already enabled"
echo ""

# Create AppRole auth method
echo "🔑 Setting up AppRole authentication..."
vault auth enable approle 2>/dev/null || echo "✅ AppRole already enabled"

# Create policy for demo-nt219
echo "📝 Creating Vault policy..."
vault policy write demo-nt219 - <<EOF
# Allow reading secrets
path "secret/data/demo-nt219" {
  capabilities = ["read"]
}

# Allow listing secrets
path "secret/metadata/demo-nt219" {
  capabilities = ["list"]
}

# Allow writing secrets (for initial setup)
path "secret/data/demo-nt219" {
  capabilities = ["create", "update"]
}

# Allow token renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}
EOF

echo "✅ Policy created"
echo ""

# Create AppRole
echo "🎭 Creating AppRole..."
vault write auth/approle/role/demo-nt219 \
    token_policies="demo-nt219" \
    token_ttl=1h \
    token_max_ttl=4h \
    secret_id_ttl=0

echo "✅ AppRole created"
echo ""

# Get Role ID
echo "📋 Getting Role ID..."
ROLE_ID=$(vault read -field=role_id auth/approle/role/demo-nt219/role-id)
echo "VAULT_ROLE_ID=$ROLE_ID"
echo ""

# Generate Secret ID
echo "🔐 Generating Secret ID..."
SECRET_ID=$(vault write -field=secret_id -f auth/approle/role/demo-nt219/secret-id)
echo "VAULT_SECRET_ID=$SECRET_ID"
echo ""

# Create secrets from .env file
echo "📤 Migrating secrets from .env to Vault..."

if [ -f .env ]; then
    # Read .env and create JSON for Vault
    echo "Reading .env file..."
    
    # Extract key-value pairs (basic parsing)
    MONGO_URI=$(grep -E '^MONGO_URI=' .env | cut -d '=' -f2- || echo "")
    JWT_ACCESS_SECRET=$(grep -E '^JWT_ACCESS_SECRET=' .env | cut -d '=' -f2- || echo "")
    JWT_REFRESH_SECRET=$(grep -E '^JWT_REFRESH_SECRET=' .env | cut -d '=' -f2- || echo "")
    ENCRYPTION_KEY=$(grep -E '^ENCRYPTION_KEY=' .env | cut -d '=' -f2- || echo "")
    STRIPE_SECRET_KEY=$(grep -E '^STRIPE_SECRET_KEY=' .env | cut -d '=' -f2- || echo "")
    STRIPE_WEBHOOK_SECRET=$(grep -E '^STRIPE_WEBHOOK_SECRET=' .env | cut -d '=' -f2- || echo "")
    EMAIL_USER=$(grep -E '^EMAIL_USER=' .env | cut -d '=' -f2- || echo "")
    EMAIL_PASS=$(grep -E '^EMAIL_PASS=' .env | cut -d '=' -f2- || echo "")
    GOOGLE_CLIENT_ID=$(grep -E '^GOOGLE_CLIENT_ID=' .env | cut -d '=' -f2- || echo "")
    GOOGLE_CLIENT_SECRET=$(grep -E '^GOOGLE_CLIENT_SECRET=' .env | cut -d '=' -f2- || echo "")
    
    # Write to Vault
    vault kv put secret/demo-nt219 \
        MONGO_URI="$MONGO_URI" \
        JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET" \
        JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
        ENCRYPTION_KEY="$ENCRYPTION_KEY" \
        STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
        STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
        EMAIL_USER="$EMAIL_USER" \
        EMAIL_PASS="$EMAIL_PASS" \
        GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
        GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"
    
    echo "✅ Secrets migrated to Vault"
else
    echo "⚠️  .env file not found, skipping secret migration"
fi

echo ""
echo "🎉 Vault setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Add these to your .env file:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VAULT_ENABLED=true"
echo "VAULT_ADDR=http://127.0.0.1:8200"
echo "VAULT_ROLE_ID=$ROLE_ID"
echo "VAULT_SECRET_ID=$SECRET_ID"
echo "VAULT_SECRET_PATH=secret/data/demo-nt219"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 Verify secrets:"
echo "  vault kv get secret/demo-nt219"
echo ""
echo "🚀 Start your application:"
echo "  npm run dev"
echo ""
