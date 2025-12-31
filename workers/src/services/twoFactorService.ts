/**
 * Two-Factor Authentication Service
 * Implements TOTP (RFC 6238) for 2FA
 */

// Base32 alphabet for encoding/decoding secrets
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generate a random secret for TOTP
 */
export function generateSecret(length: number = 20): string {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return base32Encode(buffer);
}

/**
 * Base32 encode a Uint8Array
 */
function base32Encode(data: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let result = '';

  for (let i = 0; i < data.length; i++) {
    value = (value << 8) | data[i];
    bits += 8;

    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return result;
}

/**
 * Base32 decode a string to Uint8Array
 */
function base32Decode(encoded: string): Uint8Array {
  encoded = encoded.toUpperCase().replace(/[=\s]/g, '');
  const output = new Uint8Array(Math.floor((encoded.length * 5) / 8));
  let bits = 0;
  let value = 0;
  let index = 0;

  for (let i = 0; i < encoded.length; i++) {
    const charIndex = BASE32_ALPHABET.indexOf(encoded[i]);
    if (charIndex === -1) continue;

    value = (value << 5) | charIndex;
    bits += 5;

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return output;
}

/**
 * Convert number to 8-byte big-endian buffer
 */
function intToBytes(num: number): Uint8Array {
  const buffer = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    buffer[i] = num & 0xff;
    num = Math.floor(num / 256);
  }
  return buffer;
}

/**
 * HMAC-SHA1 using Web Crypto API
 */
async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return new Uint8Array(signature);
}

/**
 * Generate TOTP code for a given secret and time
 */
export async function generateTOTP(
  secret: string,
  timeStep: number = 30,
  digits: number = 6,
  timestamp?: number
): Promise<string> {
  const time = timestamp || Date.now();
  const counter = Math.floor(time / 1000 / timeStep);

  const key = base32Decode(secret);
  const counterBytes = intToBytes(counter);
  const hmac = await hmacSha1(key, counterBytes);

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = code % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

/**
 * Verify a TOTP code (allows for clock drift within window)
 */
export async function verifyTOTP(
  secret: string,
  code: string,
  window: number = 1,
  timeStep: number = 30
): Promise<boolean> {
  const now = Date.now();

  // Check current and surrounding time windows
  for (let i = -window; i <= window; i++) {
    const timestamp = now + i * timeStep * 1000;
    const expected = await generateTOTP(secret, timeStep, 6, timestamp);

    if (code === expected) {
      return true;
    }
  }

  return false;
}

/**
 * Generate TOTP provisioning URI for QR code
 */
export function generateTOTPUri(
  secret: string,
  email: string,
  issuer: string = 'OHCS E-Library'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);

  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const buffer = new Uint8Array(4);
    crypto.getRandomValues(buffer);

    // Convert to 8-character alphanumeric code
    const code = Array.from(buffer)
      .map(b => b.toString(36).padStart(2, '0'))
      .join('')
      .toUpperCase()
      .slice(0, 8);

    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }

  return codes;
}

/**
 * Hash a backup code for storage
 */
export async function hashBackupCode(code: string): Promise<string> {
  const normalized = code.replace(/-/g, '').toUpperCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a backup code against hashed codes
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<{ valid: boolean; usedIndex: number }> {
  const codeHash = await hashBackupCode(code);

  const index = hashedCodes.findIndex(h => h === codeHash);

  return {
    valid: index !== -1,
    usedIndex: index,
  };
}

/**
 * Generate a trusted device token
 */
export function generateDeviceToken(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash device token for secure storage/comparison
 */
export async function hashDeviceToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
