import crypto from "crypto";
import { env } from "@/env";

// Use AUTH_SECRET as encryption key (must be 32 bytes for AES-256)
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(env.AUTH_SECRET || "default-secret-key-please-change")
  .digest();

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(text: string): string {
  const parts = text.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted data format");
  }
  const iv = Buffer.from(parts[0]!, "hex");
  const encryptedText = parts[1]!;
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Mask sensitive string - show only last 4 characters
 */
export function maskString(str: string, visibleChars = 4): string {
  if (!str || str.length <= visibleChars) {
    return "****";
  }
  const masked = "*".repeat(str.length - visibleChars);
  return masked + str.slice(-visibleChars);
}

/**
 * Check if a string is already encrypted (contains IV:data format)
 */
export function isEncrypted(text: string): boolean {
  return text.includes(":") && text.split(":").length === 2;
}
