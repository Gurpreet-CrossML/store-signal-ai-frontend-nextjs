"use client";

import { useState } from "react";
import Image from "next/image";
import {
  IconFile,
  IconFileTypeDoc,
  IconFileTypePdf,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SupportTicketMessage } from "@/redux/api-slice/support-ticket-slice";
import { Spinner } from "@/components/ui/spinner";
import { getSupportAttachmentType } from "@/lib/support-attachment-constants";

type Attachment = SupportTicketMessage["attachments"][number];

function attachmentName(url: string) {
  try {
    return decodeURIComponent(
      new URL(url, "http://localhost").pathname.split("/").pop() ||
        "Attachment",
    );
  } catch {
    return "Attachment";
  }
}

function AttachmentCard({ attachment }: { attachment: Attachment }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const url = attachment.file_url || attachment.file;
  const name = attachmentName(url);
  const attachmentType = getSupportAttachmentType(name);
  const isImage = attachmentType === "image";
  const isPdf = attachmentType === "pdf";
  const isWord = attachmentType === "word";
  const FileIcon = isPdf
    ? IconFileTypePdf
    : isWord
      ? IconFileTypeDoc
      : IconFile;
  const attachmentLabel = {
    image: "Image",
    pdf: "PDF",
    word: "Word document",
    other: "Other document",
  }[attachmentType];

  if (!url) return null;

  return (
    <div className="w-40 max-w-full overflow-hidden rounded-md border bg-background">
      {isImage ? (
        <button
          type="button"
          aria-label={`Preview ${name}`}
          className="block h-24 w-full bg-muted focus-visible:outline-2 focus-visible:outline-primary"
          onClick={() => setPreviewOpen(true)}
        >
          <Image
            src={url}
            alt={name}
            width={160}
            height={96}
            unoptimized
            className="h-full w-full object-cover"
          />
        </button>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${name}`}
          className="flex h-24 items-center justify-center bg-muted focus-visible:outline-2 focus-visible:outline-primary"
        >
          <FileIcon
            className={`size-12 ${
              isPdf
                ? "text-red-500"
                : isWord
                  ? "text-blue-500"
                  : "text-muted-foreground"
            }`}
          />
        </a>
      )}
      <div className="flex items-center gap-1 p-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium" title={name}>
            {isImage ? (
              name
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {name}
              </a>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{attachmentLabel}</p>
        </div>
      </div>
      {isImage && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-3xl" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="break-all pr-8">{name}</DialogTitle>
            </DialogHeader>
            <Image
              src={url}
              alt={name}
              width={1200}
              height={900}
              unoptimized
              className="max-h-[70vh] w-full object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export function MessageAttachments({
  attachments,
  pendingFiles = [],
}: {
  attachments: Attachment[];
  pendingFiles?: File[];
}) {
  if (!attachments?.length && !pendingFiles.length) return null;
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <AttachmentCard key={attachment.id} attachment={attachment} />
      ))}
      {pendingFiles.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          aria-busy="true"
          className="w-40 max-w-full overflow-hidden rounded-md border bg-background"
        >
          <div className="flex h-24 items-center justify-center bg-muted">
            <Spinner className="size-6" />
          </div>
          <div className="p-2">
            <p className="truncate text-xs font-medium" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground" role="status">
              Sending...
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
