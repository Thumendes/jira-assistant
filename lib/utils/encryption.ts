import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ENCRYPTION_ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-change-in-production";

/**
 * Generates a secure encryption key
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Encrypts a string value
 */
export function encrypt(text: string): string {
  try {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Combine IV and encrypted data
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypts an encrypted string value
 */
export function decrypt(encryptedData: string): string {
  try {
    const [ivHex, encrypted] = encryptedData.split(":");
    if (!ivHex || !encrypted) {
      throw new Error("Invalid encrypted data format");
    }

    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, Buffer.from(ivHex, "hex"));
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Masks a sensitive string for display purposes
 */
export function maskSensitiveValue(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) {
    return "*".repeat(8);
  }

  if (value.startsWith("sk-")) {
    return `sk-...${value.slice(-visibleChars)}`;
  }

  if (value.includes("@")) {
    return `***...${value.slice(-visibleChars)}`;
  }

  return `***...${value.slice(-visibleChars)}`;
}

/**
 * Validates if a string is encrypted (contains our format)
 */
export function isEncrypted(value: string): boolean {
  return value.includes(":") && value.split(":").length === 2;
}

/**
 * Safely encrypts user settings
 */
export function encryptSettings(settings: Record<string, string>): Record<string, string> {
  const encrypted: Record<string, string> = {};

  for (const [key, value] of Object.entries(settings)) {
    if (value && typeof value === "string") {
      encrypted[key] = encrypt(value);
    } else {
      encrypted[key] = value;
    }
  }

  return encrypted;
}

/**
 * Safely decrypts user settings
 */
export function decryptSettings(encryptedSettings: Record<string, string>): Record<string, string> {
  const decrypted: Record<string, string> = {};

  for (const [key, value] of Object.entries(encryptedSettings)) {
    if (value && typeof value === "string" && isEncrypted(value)) {
      try {
        decrypted[key] = decrypt(value);
      } catch (error) {
        console.error(`Failed to decrypt setting ${key}:`, error);
        decrypted[key] = value; // Keep original if decryption fails
      }
    } else {
      decrypted[key] = value;
    }
  }

  return decrypted;
}

/**
 * Hash a value for comparison purposes (one-way)
 */
export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(key: string, type: "openai" | "jira"): boolean {
  switch (type) {
    case "openai":
      return key.startsWith("sk-") && key.length > 20;
    case "jira":
      return key.length > 10; // Basic validation for JIRA tokens
    default:
      return false;
  }
}

/**
 * Clean sensitive data from logs
 */
export function sanitizeForLogging(data: unknown): unknown {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const sanitized = { ...(data as Record<string, unknown>) };
  const sensitiveFields = ["password", "token", "key", "secret", "apiKey"];

  for (const field of sensitiveFields) {
    if (sanitized[field] && typeof sanitized[field] === "string") {
      sanitized[field] = maskSensitiveValue(sanitized[field] as string);
    }
  }

  return sanitized;
}
