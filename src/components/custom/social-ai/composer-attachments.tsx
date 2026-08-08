"use client";

import { IconVideo, IconVolume, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

/**
 * Meta's Send API caps attachments at 25 MB each, and the store's own
 * policy narrows images to the three formats below.
 */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const ALLOWED_VIDEO_TYPES = ["video/mp4"];

/** What the file picker offers, matching the validation below. */
export const COMPOSER_ACCEPT = ".png,.jpg,.jpeg,.mp4,audio/*";

export type ComposerAttachment = {
  id: string;
  file: File;
  kind: "image" | "video" | "audio";
  /** Object URL for the thumbnail — revoked when the attachment is dropped. */
  previewUrl: string;
};

let attachmentCounter = 0;

function classify(file: File): ComposerAttachment["kind"] | null {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

function formatMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate a picked FileList, keeping what's allowed and explaining what
 * isn't. Rejection is per file so one bad pick doesn't discard the rest.
 */
export function pickComposerAttachments(
  files: FileList | null,
): ComposerAttachment[] {
  const accepted: ComposerAttachment[] = [];

  for (const file of Array.from(files ?? [])) {
    const kind = classify(file);
    if (!kind) {
      toast.error("Unsupported file", {
        description: `${file.name} isn't a PNG, JPG, MP4, or audio file.`,
      });
      continue;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("File too large", {
        description: `${file.name} is ${formatMb(file.size)} — the limit is 25 MB.`,
      });
      continue;
    }

    attachmentCounter += 1;
    accepted.push({
      id: `composer-attachment-${attachmentCounter}`,
      file,
      kind,
      previewUrl: kind === "image" ? URL.createObjectURL(file) : "",
    });
  }

  return accepted;
}

/** Object URLs leak until revoked — call this whenever one is dropped. */
export function releaseComposerAttachments(attachments: ComposerAttachment[]) {
  attachments.forEach((attachment) => {
    if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
  });
}

/** Thumbnail strip above the composer input. */
export function ComposerAttachments({
  attachments,
  onRemove,
  disabled = false,
}: {
  attachments: ComposerAttachment[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  if (!attachments.length) return null;

  // Same chip anatomy as Live Support's composer: small thumbnail, name,
  // and a remove button that appears on hover.
  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="group relative flex items-center gap-2 rounded-xl border border-border/60 bg-muted/60 py-1.5 pr-2.5 pl-1.5 text-xs text-muted-foreground"
        >
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background/70">
            {attachment.kind === "image" ? (
              // A local object URL — next/image would only add overhead.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attachment.previewUrl}
                alt={attachment.file.name}
                className="size-full rounded-lg object-cover"
              />
            ) : attachment.kind === "video" ? (
              <IconVideo className="size-4" />
            ) : (
              <IconVolume className="size-4" />
            )}
          </div>
          <span className="max-w-35 truncate">{attachment.file.name}</span>
          <span className="shrink-0">{formatMb(attachment.file.size)}</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemove(attachment.id)}
            aria-label={`Remove ${attachment.file.name}`}
            title="Remove attachment"
            className="flex size-4 shrink-0 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-0"
          >
            <IconX className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
