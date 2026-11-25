import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
} from "node:crypto";

/**
 * Page-URL ids, encrypted with URL_ID_KEY. Must match the backend's
 * `encrypt_url_id` (core/utils.py): AES-256-GCM, IV first and auth tag last,
 * the IV an HMAC of the id (so one id always gives one token), and the record
 * type authenticated so a ticket's token cannot open a customer.
 *
 * Server only — call it from a page or an API route, never from a client
 * component: URL_ID_KEY must never reach the browser.
 */

/** The records whose ids appear in page URLs. */
export type UrlIdType =
  | "Ticket"
  | "Thread"
  | "Customer"
  | "Order"
  | "KnowledgeItem"
  | "Campaign"
  | "Segment"
  | "EmailTemplate"
  | "WhatsAppTemplate";

const keys = () => {
  const secret = process.env.URL_ID_KEY;
  if (!secret) throw new Error("URL_ID_KEY is not set.");
  return {
    enc: createHash("sha256").update(`url-id-enc:${secret}`).digest(),
    iv: createHash("sha256").update(`url-id-iv:${secret}`).digest(),
  };
};

/** A record's id as a page-URL token. */
export function encryptUrlId(type: UrlIdType, id: number | string) {
  const key = keys();
  const iv = createHmac("sha256", key.iv)
    .update(`${type}:${id}`)
    .digest()
    .subarray(0, 12);
  const cipher = createCipheriv("aes-256-gcm", key.enc, iv);
  cipher.setAAD(Buffer.from(type));
  const data = Buffer.concat([cipher.update(String(id)), cipher.final()]);
  return Buffer.concat([iv, data, cipher.getAuthTag()]).toString("base64url");
}

/**
 * The id inside a page-URL token, or null when the token is missing,
 * malformed, tampered with, made with another key or made for another type.
 */
export function decryptUrlId(
  type: UrlIdType,
  token: string | string[] | null | undefined,
) {
  const key = keys();
  if (typeof token !== "string" || !token) return null;
  try {
    const data = Buffer.from(token, "base64url");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key.enc,
      data.subarray(0, 12),
    );
    decipher.setAAD(Buffer.from(type));
    decipher.setAuthTag(data.subarray(-16));
    return Buffer.concat([
      decipher.update(data.subarray(12, -16)),
      decipher.final(),
    ]).toString();
  } catch {
    return null;
  }
}
