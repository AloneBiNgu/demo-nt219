const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Create keys directory if it doesn't exist
const keysDir = path.join(__dirname, 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// Generate RSA key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Save private key
fs.writeFileSync(path.join(keysDir, 'jwt-private.pem'), privateKey);
console.log('✓ Private key generated: keys/jwt-private.pem');

// Save public key
fs.writeFileSync(path.join(keysDir, 'jwt-public.pem'), publicKey);
console.log('✓ Public key generated: keys/jwt-public.pem');

// Generate refresh token keys
const { privateKey: refreshPrivateKey, publicKey: refreshPublicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Save refresh token private key
fs.writeFileSync(path.join(keysDir, 'jwt-refresh-private.pem'), refreshPrivateKey);
console.log('✓ Refresh token private key generated: keys/jwt-refresh-private.pem');

// Save refresh token public key
fs.writeFileSync(path.join(keysDir, 'jwt-refresh-public.pem'), refreshPublicKey);
console.log('✓ Refresh token public key generated: keys/jwt-refresh-public.pem');

console.log('\n✓ All RSA keys generated successfully!');
console.log('\nNOTE: Add keys/ directory to .gitignore to prevent committing private keys!');
