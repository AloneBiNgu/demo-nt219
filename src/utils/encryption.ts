import crypto from 'crypto';
import { appConfig } from '../config/env';

/**
 * Field-Level Encryption Utility
 * Uses AES-256-GCM for encryption (NIST approved)
 * Follows OWASP cryptographic storage guidelines
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

// Get encryption key from environment (should be 32 bytes for AES-256)
const getEncryptionKey = (): Buffer => {
  const key = appConfig.encryptionKey || process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY not configured');
  }
  
  // Derive a proper 256-bit key using PBKDF2
  return crypto.pbkdf2Sync(key, 'secure-commerce-salt', 100000, 32, 'sha256');
};

/**
 * Encrypt sensitive data
 * Returns: base64(iv:authTag:encryptedData)
 */
export const encryptField = (plaintext: string | null | undefined): string | null => {
  if (!plaintext) return null;
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encryptedData (all in hex)
    const combined = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    
    // Return as base64 for storage
    return Buffer.from(combined).toString('base64');
  } catch (error) {
    throw new Error(`Encryption failed: ${(error as Error).message}`);
  }
};

/**
 * Decrypt sensitive data
 */
export const decryptField = (ciphertext: string | null | undefined): string | null => {
  if (!ciphertext) return null;
  
  try {
    const key = getEncryptionKey();
    
    // Decode from base64
    const combined = Buffer.from(ciphertext, 'base64').toString('utf8');
    const parts = combined.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
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
 */
export const hashSensitiveData = (data: string): string => {
  return crypto
    .createHmac('sha256', getEncryptionKey())
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
