/** URL helpers for chatbot quick links. */

/** Prefixes a bare host with https:// so "example.com" becomes a valid URL. */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** True when `value` (after normalisation) is a valid http/https URL. */
export function isValidUrl(value: string): boolean {
  const normalized = normalizeUrl(value);
  if (!normalized) return false;
  try {
    const url = new URL(normalized);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Stricter than `isValidUrl`, for addresses we'll fetch: the host must be a
 * real domain (with a TLD, e.g. `company.com`) or an IPv4 address. Plain words
 * like "AGENT" pass `isValidUrl` because a scheme gets prepended to them. */
export function isValidWebsiteUrl(value: string): boolean {
  if (!isValidUrl(value)) return false;
  const { hostname } = new URL(normalizeUrl(value));
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true;
  return /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+([a-z]{2,63}|xn--[a-z0-9-]{1,59})$/i.test(
    hostname,
  );
}

/** True only for a complete http/https URL. Unlike isValidUrl, it adds no scheme. */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getAbsoluteS3Url(key: string): string {
  const awsStorageBucketName = process.env.NEXT_AWS_STORAGE_BUCKET_NAME;
  const awsRegion = process.env.NEXT_AWS_REGION;
  return `https://${awsStorageBucketName}.s3.${awsRegion}.amazonaws.com/${key}`;
}
