import crypto from 'crypto';
import { appConfig } from '../config/env';

/**
 * Field-Level Encryption Utility
 * Uses AES-256-GCM for encryption (NIST approved)
 * Follows OWASP cryptographic storage guidelines
 * 
 * SECURITY FIX: Now uses random salt per encryption instead of static salt
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits
const PBKDF2_ITERATIONS = 100000;

// Get master key from environment
const getMasterKey = (): string => {
  const key = appConfig.encryptionKey || process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY not configured');
  }
  
  return key;
};

/**
 * Derive encryption key from master key using random salt
 * SECURITY: Uses random salt to prevent rainbow table attacks
 */
const deriveKey = (salt: Buffer): Buffer => {
  const masterKey = getMasterKey();
  return crypto.pbkdf2Sync(masterKey, salt, PBKDF2_ITERATIONS, 32, 'sha256');
};

/**
 * @deprecated Use deriveKey with random salt instead
 * Kept for backward compatibility with existing encrypted data
 */
const getLegacyEncryptionKey = (): Buffer => {
  const key = getMasterKey();
  // Legacy static salt - only for decrypting old data
  return crypto.pbkdf2Sync(key, 'secure-commerce-salt', PBKDF2_ITERATIONS, 32, 'sha256');
};

/**
 * Encrypt sensitive data with random salt
 * Returns: base64(version:salt:iv:authTag:encryptedData)
 * 
 * SECURITY FIX: Now uses random salt per encryption
 * Format v2 includes salt, v1 (legacy) does not
 */
export const encryptField = (plaintext: string | null | undefined): string | null => {
  if (!plaintext) return null;
  
  try {
    // Generate random salt for this encryption
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format v2: version:salt:iv:authTag:encryptedData (all in hex)
    // Version prefix allows backward compatibility detection
    const combined = `v2:${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    
    // Return as base64 for storage
    return Buffer.from(combined).toString('base64');
  } catch (error) {
    throw new Error(`Encryption failed: ${(error as Error).message}`);
  }
};

/**
 * Decrypt sensitive data
 * Supports both v2 (random salt) and legacy (static salt) formats
 */
export const decryptField = (ciphertext: string | null | undefined): string | null => {
  if (!ciphertext) return null;
  
  try {
    // Decode from base64
    const combined = Buffer.from(ciphertext, 'base64').toString('utf8');
    const parts = combined.split(':');
    
    let key: Buffer;
    let iv: Buffer;
    let authTag: Buffer;
    let encrypted: string;
    
    // Check format version
    if (parts[0] === 'v2' && parts.length === 5) {
      // New format with random salt: v2:salt:iv:authTag:encrypted
      const salt = Buffer.from(parts[1], 'hex');
      key = deriveKey(salt);
      iv = Buffer.from(parts[2], 'hex');
      authTag = Buffer.from(parts[3], 'hex');
      encrypted = parts[4];
    } else if (parts.length === 3) {
      // Legacy format with static salt: iv:authTag:encrypted
      key = getLegacyEncryptionKey();
      iv = Buffer.from(parts[0], 'hex');
      authTag = Buffer.from(parts[1], 'hex');
      encrypted = parts[2];
    } else {
      throw new Error('Invalid encrypted data format');
    }
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${(error as Error).message}`);
  }
};

/**
 * Encrypt array of strings (for backup codes, etc.)
 */
export const encryptArray = (items: string[] | null | undefined): string[] | null => {
  if (!items || items.length === 0) return null;
  
  return items.map(item => encryptField(item)).filter((item): item is string => item !== null);
};

/**
 * Decrypt array of strings
 */
export const decryptArray = (encryptedItems: string[] | null | undefined): string[] | null => {
  if (!encryptedItems || encryptedItems.length === 0) return null;
  
  return encryptedItems.map(item => decryptField(item)).filter((item): item is string => item !== null);
};

/**
 * Hash sensitive data for comparison (one-way)
 * Used for tokens that need to be compared but not decrypted
 * Uses master key directly for HMAC (no need for salt in HMAC)
 */
export const hashSensitiveData = (data: string): string => {
  const masterKey = getMasterKey();
  return crypto
    .createHmac('sha256', masterKey)
    .update(data)
    .digest('hex');
};

/**
 * Anonymize PII data for logging/analytics
 * Uses SHA-256 hashing to create consistent but non-reversible IDs
 */
export const anonymizePII = (data: string): string => {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
    .substring(0, 16); // First 16 chars for shorter IDs
};

/**
 * Redact sensitive data from objects for logging
 */
export const redactSensitive = <T extends Record<string, any>>(
  obj: T,
  sensitiveFields: string[] = ['password', 'token', 'secret', 'key']
): T => {
  const redacted = { ...obj };
  
  for (const key in redacted) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      (redacted as any)[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitive(redacted[key], sensitiveFields);
    }
  }
  
  return redacted;
};

/**
 * Generate cryptographically secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Constant-time string comparison to prevent timing attacks
 */
export const secureCompare = (a: string, b: string): boolean => {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
};
