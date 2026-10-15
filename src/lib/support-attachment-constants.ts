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
