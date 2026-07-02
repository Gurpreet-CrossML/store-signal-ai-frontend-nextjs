const INTEGRATION_LOGO_BUCKET =
  process.env.NEXT_PUBLIC_INTEGRATION_LOGO_BUCKET ||
  process.env.NEXT_PUBLIC_S3_BUCKET_NAME ||
  "";

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith("//");
}

export function getIntegrationLogoUrl(
  fileKey: string | null | undefined,
): string | null {
  const trimmed = fileKey?.trim();
  if (!trimmed) return null;

  if (isAbsoluteUrl(trimmed)) {
    return trimmed;
  }

  const bucketName = INTEGRATION_LOGO_BUCKET.trim();
  if (!bucketName) {
    return null;
  }

  const normalizedKey = trimmed.replace(/^\/+/, "");
  return `https://${bucketName}.s3.amazonaws.com/${normalizedKey}`;
}
