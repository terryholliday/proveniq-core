import { randomBytes, createHmac } from "crypto";
import { db } from "@/lib/db";

const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = "sha1";

export function generateSecret(): string {
  return randomBytes(20).toString("base64");
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

function base32Decode(encoded: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanedInput = encoded.toUpperCase().replace(/=+$/, "");
  
  let bits = "";
  for (const char of cleanedInput) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  
  return Buffer.from(bytes);
}

function base32Encode(buffer: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }
  
  let encoded = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    encoded += alphabet[parseInt(chunk, 2)];
  }
  
  return encoded;
}

export function generateTOTP(secret: string, timestamp?: number): string {
  const time = timestamp ?? Math.floor(Date.now() / 1000);
  const counter = Math.floor(time / TOTP_PERIOD);
  
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));
  
  const secretBuffer = base32Decode(secret);
  const hmac = createHmac(TOTP_ALGORITHM, secretBuffer);
  hmac.update(counterBuffer);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  
  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, "0");
}

export function verifyTOTP(
  secret: string,
  token: string,
  window: number = 1
): boolean {
  const now = Math.floor(Date.now() / 1000);
  
  for (let i = -window; i <= window; i++) {
    const timestamp = now + i * TOTP_PERIOD;
    const expectedToken = generateTOTP(secret, timestamp);
    
    if (token === expectedToken) {
      return true;
    }
  }
  
  return false;
}

export function generateQRCodeUrl(
  secret: string,
  email: string,
  issuer: string = "Proveniq"
): string {
  const encodedSecret = base32Encode(Buffer.from(secret, "base64"));
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

export interface TwoFactorSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export async function setupTwoFactor(userId: string): Promise<TwoFactorSetupResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const secret = generateSecret();
  const backupCodes = generateBackupCodes();
  const qrCodeUrl = generateQRCodeUrl(secret, user.email);

  return {
    secret,
    qrCodeUrl,
    backupCodes,
  };
}

export async function enableTwoFactor(
  userId: string,
  secret: string,
  token: string,
  backupCodes: string[]
): Promise<boolean> {
  if (!verifyTOTP(secret, token)) {
    return false;
  }

  await db.user.update({
    where: { id: userId },
    data: {
      // Store in user metadata or separate 2FA table
      // For now, we'll use a simple approach
    },
  });

  return true;
}

export async function verifyTwoFactorToken(
  userId: string,
  token: string
): Promise<boolean> {
  // In production, retrieve the secret from the database
  // For now, this is a placeholder
  return false;
}

export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  // In production, check against stored backup codes
  // and mark the used code as consumed
  return false;
}

export async function disableTwoFactor(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      // Clear 2FA settings
    },
  });
}

export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  const newCodes = generateBackupCodes();
  
  // Store new codes in database
  // ...
  
  return newCodes;
}
