export const SUPPORT_ATTACHMENT_ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".pdf",
  ".doc",
  ".docx",
] as const;

export const SUPPORT_ATTACHMENT_MAX_FILES = 5;
export const SUPPORT_ATTACHMENT_MAX_FILE_SIZE = 5 * 1024 * 1024;
export const SUPPORT_ATTACHMENT_ACCEPT =
  SUPPORT_ATTACHMENT_ALLOWED_EXTENSIONS.join(",");

export function hasSupportAttachmentExtension(
  name: string,
  extensions: readonly string[],
) {
  return extensions.some((extension) => name.toLowerCase().endsWith(extension));
}

export function validateSupportAttachment(file: File): string | null {
  const extension = `.${file.name.split(".").pop() ?? ""}`.toLowerCase();
  const isAllowed = hasSupportAttachmentExtension(
    extension,
    SUPPORT_ATTACHMENT_ALLOWED_EXTENSIONS,
  );

  if (!isAllowed) {
    return `${file.name}: Only images, PDF and Word documents are allowed.`;
  }

  if (file.size > SUPPORT_ATTACHMENT_MAX_FILE_SIZE) {
    return `${file.name}: Maximum file size is 5 MB.`;
  }

  return null;
}

export function getSupportAttachmentRemainingSlots(currentCount: number) {
  return Math.max(0, SUPPORT_ATTACHMENT_MAX_FILES - currentCount);
}

export function getSupportAttachmentCountError(
  currentCount: number,
  newFileCount: number,
): string | null {
  const remainingSlots = getSupportAttachmentRemainingSlots(currentCount);

  return newFileCount > remainingSlots
    ? `You can attach a maximum of ${SUPPORT_ATTACHMENT_MAX_FILES} files per message.`
    : null;
}
