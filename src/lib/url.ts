/** URL helpers for chatbot quick links. */

/** Prefixes a bare host with https:// so "example.com" becomes a valid URL. */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Validates a chatbot quick link using URLField-compatible host rules. */
export function validateQuickLink(value: string): boolean {
  const normalized = normalizeUrl(value);
  if (!normalized) return false;

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;

    const hostname = url.hostname.toLowerCase();
    if (hostname === "localhost") return true;
    if (hostname.startsWith("[") && hostname.endsWith("]")) return true;

    const ipv4Parts = hostname.split(".");
    if (
      ipv4Parts.length === 4 &&
      ipv4Parts.every(
        (part) => /^\d{1,3}$/.test(part) && Number(part) <= 255,
      )
    ) {
      return true;
    }

    const labels = hostname.split(".");
    return (
      labels.length >= 2 &&
      labels.every((label) =>
        /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
      ) &&
      /^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(labels.at(-1) ?? "")
    );
  } catch {
    return false;
  }
}

export function getAbsoluteS3Url(key: string): string {
  const awsStorageBucketName = process.env.NEXT_AWS_STORAGE_BUCKET_NAME;
  const awsRegion = process.env.NEXT_AWS_REGION;
  return `https://${awsStorageBucketName}.s3.${awsRegion}.amazonaws.com/${key}`;
}
