"use client";

import { useState } from "react";
import {
  IconFile,
  IconGif,
  IconLink,
  IconPaperclip,
  IconPhoto,
  IconPhotoOff,
  IconSticker,
  IconVideo,
  IconVolume,
} from "@tabler/icons-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SocialDmAttachment } from "@/redux/api-slice/social-ai-slice";

/**
 * Meta's CDN links are signed and expire (the row carries `expires_at`),
 * so any of these can 404 on an old conversation. Rather than trust the
 * timestamp — clock skew and re-syncs both make it unreliable — every
 * renderer falls back to this when the media actually fails to load.
 */
function AttachmentUnavailable({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <IconPhotoOff className="size-4 shrink-0" />
      {label}
    </div>
  );
}

function ImageAttachment({
  attachment,
  isSticker,
}: {
  attachment: SocialDmAttachment;
  isSticker: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <AttachmentUnavailable
        label={isSticker ? "Sticker unavailable" : "Image unavailable"}
      />
    );
  }

  // Stickers render bare, like FB/IG chat — no frame, no background.
  if (isSticker) {
    return (
      // Meta's CDN isn't in next/image's allowlist and these URLs rotate.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={attachment.url}
        alt="Sticker"
        onError={() => setFailed(true)}
        className="size-28 object-contain"
      />
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-2xl border"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={attachment.url}
        alt={attachment.title || "Image attachment"}
        onError={() => setFailed(true)}
        className="max-h-64 w-full object-cover"
      />
    </a>
  );
}

function VideoAttachment({ attachment }: { attachment: SocialDmAttachment }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <AttachmentUnavailable label="Video unavailable" />;

  return (
    // Native controls give the play button, scrubber and duration without
    // shipping a player; `preload="metadata"` fetches just enough for the
    // poster frame and length.
    <video
      src={attachment.url}
      controls
      preload="metadata"
      onError={() => setFailed(true)}
      className="max-h-64 w-full rounded-2xl border bg-black"
    />
  );
}

function AudioAttachment({ attachment }: { attachment: SocialDmAttachment }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <AttachmentUnavailable label="Audio unavailable" />;

  return (
    <div className="flex items-center gap-2 rounded-2xl border bg-muted/30 p-2">
      <IconVolume className="size-4 shrink-0 text-muted-foreground" />
      <audio
        src={attachment.url}
        controls
        preload="metadata"
        onError={() => setFailed(true)}
        className="h-8 max-w-full"
      />
    </div>
  );
}

/** Shared links and files both render as a titled row that opens out. */
function LinkAttachment({
  attachment,
  isShare,
}: {
  attachment: SocialDmAttachment;
  isShare: boolean;
}) {
  let host = "";
  try {
    host = new URL(attachment.url).hostname.replace(/^www\./, "");
  } catch {
    // A malformed or empty URL just means no subtitle.
  }

  const label =
    attachment.title || (isShare ? "Shared link" : "File attachment");

  if (!attachment.url) {
    return <AttachmentUnavailable label={label} />;
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 rounded-2xl border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/60"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background">
        {isShare ? (
          <IconLink className="size-4 text-muted-foreground" />
        ) : (
          <IconFile className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{label}</p>
        {host && (
          <p className="truncate text-xs text-muted-foreground">{host}</p>
        )}
      </div>
    </a>
  );
}

function DmAttachment({ attachment }: { attachment: SocialDmAttachment }) {
  switch (attachment.attachment_type) {
    case "sticker":
      return <ImageAttachment attachment={attachment} isSticker />;
    case "image":
      return <ImageAttachment attachment={attachment} isSticker={false} />;
    case "video":
      return <VideoAttachment attachment={attachment} />;
    case "audio":
      return <AudioAttachment attachment={attachment} />;
    case "share":
      return <LinkAttachment attachment={attachment} isShare />;
    default:
      // "file", "other", and anything new the backend starts sending.
      return <LinkAttachment attachment={attachment} isShare={false} />;
  }
}

/**
 * What the conversation list shows in place of message text when the last
 * message was media. "unknown" is the honest fallback: the conversations
 * endpoint only selects the message's `content`, so a media message's type
 * is only known once we've seen the message itself.
 */
export type AttachmentKind =
  | "photo"
  | "gif"
  | "video"
  | "sticker"
  | "audio"
  | "file"
  | "link"
  | "unknown";

const ATTACHMENT_KIND_LABELS: Record<AttachmentKind, string> = {
  photo: "Photo",
  gif: "GIF",
  video: "Video",
  sticker: "Sticker",
  audio: "Audio",
  file: "File",
  link: "Link",
  unknown: "Attachment",
};

const ATTACHMENT_KIND_ICONS: Record<AttachmentKind, typeof IconPhoto> = {
  photo: IconPhoto,
  gif: IconGif,
  video: IconVideo,
  sticker: IconSticker,
  audio: IconVolume,
  file: IconFile,
  link: IconLink,
  unknown: IconPaperclip,
};

/**
 * Classify one attachment for the list preview. Meta has no "gif" type —
 * animated GIFs arrive as images whose CDN path carries the extension, so
 * that's what distinguishes them.
 */
export function attachmentKind(attachment: SocialDmAttachment): AttachmentKind {
  switch (attachment.attachment_type) {
    case "sticker":
      return "sticker";
    case "video":
      return "video";
    case "audio":
      return "audio";
    case "share":
      return "link";
    case "file":
      return "file";
    case "image":
      return /\.gif(\?|$)/i.test(attachment.url) ? "gif" : "photo";
    default:
      return "unknown";
  }
}

/** Icon + word standing in for a media message in the conversation list. */
export function AttachmentPreviewLabel({
  kind,
  className,
}: {
  kind: AttachmentKind;
  className?: string;
}) {
  const Icon = ATTACHMENT_KIND_ICONS[kind];

  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <Icon className="size-3.5 shrink-0" />
      {ATTACHMENT_KIND_LABELS[kind]}
    </span>
  );
}

/**
 * Placeholder for a media message whose attachments haven't reached us
 * yet — the websocket broadcast fires before they're written, so there's a
 * short window where we know media is coming but not what it is. Showing
 * the media's shape beats flashing a "[Attachment]" text bubble that then
 * swaps out from under the reader.
 */
export function DmAttachmentSkeleton({ align }: { align: "start" | "end" }) {
  return (
    <div
      className={cn(
        "flex w-full flex-col",
        align === "end" ? "items-end" : "items-start",
      )}
    >
      <Skeleton className="h-40 w-52 rounded-2xl" />
    </div>
  );
}

/**
 * A DM's media, in send order. Rendered outside the text bubble the way
 * FB/IG do it, so an attachment-only message shows no empty bubble.
 */
export function DmAttachments({
  attachments,
  align,
}: {
  attachments: SocialDmAttachment[];
  align: "start" | "end";
}) {
  if (!attachments.length) return null;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1.5",
        align === "end" ? "items-end" : "items-start",
      )}
    >
      {[...attachments]
        .sort((a, b) => a.position - b.position)
        .map((attachment) => (
          <div key={attachment.id} className="max-w-full">
            <DmAttachment attachment={attachment} />
          </div>
        ))}
    </div>
  );
}
