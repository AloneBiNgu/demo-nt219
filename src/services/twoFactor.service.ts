import { TOTP, Secret } from 'otpauth';
import QRCode from 'qrcode';
import { hashPassword } from '../utils/password';
import { encryptField, decryptField, generateSecureToken } from '../utils/encryption';
import crypto from 'crypto';

const APP_NAME = 'NT219 Project';

/**
 * Generate 2FA secret and QR code
 * Returns both encrypted secret (for storage) and plain secret (for QR code display)
 */
export const generate2FASecret = async (email: string): Promise<{ 
  secret: string;           // Plain secret for QR code
  encryptedSecret: string;  // Encrypted secret for database storage
  qrCode: string; 
  backupCodes: string[] 
}> => {
  // Generate secret
  const secret = new Secret({ size: 20 });
  const secretBase32 = secret.base32;
  
  // Create TOTP instance for QR code generation
  const totp = new TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret
  });

  // Generate QR code URL
  const otpauthURL = totp.toString();
  
  // Generate QR code image as data URL
  const qrCode = await QRCode.toDataURL(otpauthURL);

  // Generate 10 backup codes
  const backupCodes = await generateBackupCodes();

  // Encrypt the secret for storage
  const encryptedSecret = encryptField(secretBase32)!;

  return {
    secret: secretBase32,     // Return plain for QR code
    encryptedSecret,          // Return encrypted for storage
    qrCode,
    backupCodes
  };
};

/**
 * Verify TOTP code
 * Secret must be decrypted before verification
 */
export const verify2FACode = (encryptedSecret: string, code: string): boolean => {
  try {
    // Decrypt the secret first
    const secretBase32 = decryptField(encryptedSecret);
    if (!secretBase32) {
      throw new Error('Failed to decrypt 2FA secret');
    }
    
    const totp = new TOTP({
      issuer: APP_NAME,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(secretBase32)
    });

    // Validate with window of ±1 period (30 seconds) to account for time drift
    const delta = totp.validate({
      token: code,
      window: 1
    });

    return delta !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Generate backup codes
 */
export const generateBackupCodes = async (): Promise<string[]> => {
  const codes: string[] = [];
  
  for (let i = 0; i < 10; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }

  return codes;
};

/**
 * Hash backup codes for storage
 */
export const hashBackupCodes = async (codes: string[]): Promise<string[]> => {
  const hashedCodes = await Promise.all(
    codes.map(code => hashPassword(code))
  );
  return hashedCodes;
};

export default {
  generate2FASecret,
  verify2FACode,
  generateBackupCodes,
  hashBackupCodes
};
