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

export function getAbsoluteS3Url(key: string): string {
  const awsStorageBucketName = process.env.NEXT_AWS_STORAGE_BUCKET_NAME;
  const awsRegion = process.env.NEXT_AWS_REGION;
  return `https://${awsStorageBucketName}.s3.${awsRegion}.amazonaws.com/${key}`;
}
