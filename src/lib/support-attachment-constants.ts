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

function validateSupportAttachment(file: File): string | null {
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

export function prepareSupportAttachments(
  selectedFiles: File[],
  currentFiles: File[],
) {
  const errors: string[] = [];
  const validFiles = selectedFiles.filter((file) => {
    const validationError = validateSupportAttachment(file);
    if (validationError) errors.push(validationError);
    return !validationError;
  });
  const remainingSlots = Math.max(
    0,
    SUPPORT_ATTACHMENT_MAX_FILES - currentFiles.length,
  );

  if (validFiles.length > remainingSlots) {
    errors.push(
      `You can attach a maximum of ${SUPPORT_ATTACHMENT_MAX_FILES} files per message.`,
    );
  }

  return {
    files: [...currentFiles, ...validFiles.slice(0, remainingSlots)],
    errors,
  };
}
