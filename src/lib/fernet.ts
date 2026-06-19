import { createDecipheriv, createHmac, timingSafeEqual } from "crypto";

/**
 * Decrypts a Fernet-encrypted token produced by Django's `django-encrypted-model-fields`
 * (which wraps Python's `cryptography.fernet`).
 *
 * Fernet token binary layout (after base64url decode):
 *   [0]       version   – 1 byte,  must be 0x80
 *   [1..8]    timestamp – 8 bytes, big-endian uint64
 *   [9..24]   IV        – 16 bytes AES-128-CBC initialisation vector
 *   [25..N-32] ciphertext – AES-128-CBC, PKCS7-padded
 *   [N-32..N] HMAC      – 32 bytes HMAC-SHA256 of everything before it
 *
 * The 32-byte signing+encryption key is derived by base64url-decoding the
 * `FIELD_ENCRYPTION_KEY` env var:
 *   signingKey    = key[0..15]   (first 16 bytes, used for HMAC)
 *   encryptionKey = key[16..31]  (last  16 bytes, used for AES-128-CBC)
 */
export function decryptFernet(token: string): string {
  const rawKey = process.env.FIELD_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error(
      "FIELD_ENCRYPTION_KEY is not set – cannot decrypt platform credentials",
    );
  }

  // The key arrives as standard base64 or base64url; normalise to a Buffer.
  const keyBuf = Buffer.from(rawKey, "base64");
  if (keyBuf.length !== 32) {
    throw new Error(
      `FIELD_ENCRYPTION_KEY must decode to exactly 32 bytes, got ${keyBuf.length}`,
    );
  }

  const signingKey = keyBuf.subarray(0, 16);
  const encryptionKey = keyBuf.subarray(16, 32);

  // base64url → Buffer (handle both base64url and standard base64)
  const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
  const tokenBuf = Buffer.from(b64, "base64");

  if (tokenBuf.length < 57) {
    throw new Error("Fernet token is too short to be valid");
  }

  // Split the token parts
  const version = tokenBuf[0];
  if (version !== 0x80) {
    throw new Error(`Unsupported Fernet version: 0x${version.toString(16)}`);
  }

  const iv = tokenBuf.subarray(9, 25);
  const ciphertext = tokenBuf.subarray(25, tokenBuf.length - 32);
  const providedHmac = tokenBuf.subarray(tokenBuf.length - 32);

  // Verify HMAC-SHA256
  const dataToSign = tokenBuf.subarray(0, tokenBuf.length - 32);
  const expectedHmac = createHmac("sha256", signingKey)
    .update(dataToSign)
    .digest();

  if (!timingSafeEqual(providedHmac, expectedHmac)) {
    throw new Error(
      "Fernet HMAC verification failed – token may have been tampered with or the key is wrong",
    );
  }

  // Decrypt AES-128-CBC with PKCS7 padding
  const decipher = createDecipheriv("aes-128-cbc", encryptionKey, iv);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

/**
 * Safely decrypts a value that may be a Fernet token.
 * Returns the original value if it is falsy or if decryption fails (with a warning).
 */
export function safeDecrypt(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return decryptFernet(value);
  } catch (err) {
    console.warn("[fernet] decryption failed, using raw value:", err);
    return value;
  }
}
