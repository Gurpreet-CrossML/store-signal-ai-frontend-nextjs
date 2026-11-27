"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  IconCheck,
  IconCircleX,
  IconClock,
  IconCloudUpload,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypeTxt,
  IconInfoCircle,
  IconPhoto,
  IconX,
} from "@tabler/icons-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import {
  KNOWLEDGE_FILE_MAX_PAGES,
  KNOWLEDGE_FILE_MAX_RECORDS,
  KNOWLEDGE_FILE_MAX_SIZE_BYTES,
} from "@/lib/config";
import type { RowStatus } from "@/lib/knowledge-upload";
import { cn } from "@/lib/utils";

function FileTypeIcon({
  fileType,
  className,
}: {
  fileType?: string;
  className?: string;
}) {
  if (fileType?.includes("pdf"))
    return <IconFileTypePdf className={className} />;
  if (fileType?.includes("word") || fileType?.includes("docx")) {
    return <IconFileTypeDocx className={className} />;
  }
  if (
    fileType?.includes("png") ||
    fileType?.includes("jpg") ||
    fileType?.includes("jpeg") ||
    fileType?.includes("image/")
  ) {
    return <IconPhoto className={className} />;
  }
  return <IconFileTypeTxt className={className} />;
}

const STATUS_LABEL: Record<RowStatus["status"], string> = {
  uploading: "Adding",
  waiting: "Waiting to be added",
  added: "Added",
  failed: "Failed",
  skipped: "Skipped",
  notSent: "Not sent",
};

/** The tone a status's message is shown in. */
const DETAIL_TONE: Partial<Record<RowStatus["status"], BadgeTone>> = {
  failed: "danger",
  skipped: "info",
  notSent: "warning",
};

/** What stands in a file's row where the remove button is once an upload is
 * going or done: a spinner for a file with no answer yet, else its result. */
function RowStatusIcon({ status }: { status: RowStatus["status"] }) {
  const label = STATUS_LABEL[status];
  const className = "size-5";
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="flex size-8 shrink-0 items-center justify-center"
    >
      {status === "uploading" || status === "waiting" ? (
        <Spinner className={cn(className, "text-primary")} />
      ) : status === "added" ? (
        // Solid in the theme colour with a white tick, so it reads at a glance.
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <IconCheck className="size-3.5" stroke={3} />
        </span>
      ) : status === "failed" ? (
        <IconCircleX className={cn(className, "text-destructive")} />
      ) : status === "skipped" ? (
        <IconInfoCircle className={cn(className, "text-sky-500")} />
      ) : (
        <IconClock className={cn(className, "text-amber-500")} />
      )}
    </span>
  );
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

/** Multi-file variant — picks up any number
 * of files in one action (native `<input multiple>` + drag/drop of
 * several files at once), appending to `files` rather than replacing it,
 * with each selection individually removable. Accepts the same file types
 * the backend allows (PDF, DOCX, DOC, JSON, CSV, XLS/XLSX, PPTX, ODT, ODS).
 */
export function MultiFileUploadDropzone({
  files,
  onFilesSelected,
  onRemoveFile,
  errors,
  maxFiles,
  maxFileSizeBytes = KNOWLEDGE_FILE_MAX_SIZE_BYTES,
  renderFileExtra,
  disabled = false,
  rowStatus,
}: {
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  errors?: (string | undefined)[];
  maxFiles?: number;
  /** Per-file size limit; larger files are rejected with a toast. */
  maxFileSizeBytes?: number;
  /** Something to show in each selected file's row, e.g. a field of its own. */
  renderFileExtra?: (file: File, index: number) => ReactNode;
  /** Nothing can be added or removed, e.g. while the files are being saved. */
  disabled?: boolean;
  /** How each file stands in an upload that is running or done. A file with a
   * status shows it where the remove button would be, and its detail under
   * its name. Once any file has one, no files can be added or removed. */
  rowStatus?: (RowStatus | undefined)[];
}) {
  const inUpload = Boolean(rowStatus?.some(Boolean));
  const locked = disabled || inUpload;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileList = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const allIncoming = Array.from(fileList);
    const incoming = allIncoming.filter((f) => f.size <= maxFileSizeBytes);
    const rejected = allIncoming.filter((f) => f.size > maxFileSizeBytes);
    if (rejected.length > 0) {
      toast.error(
        rejected.length === 1 ? "File too large" : "Some files are too large",
        {
          description: `${rejected.map((f) => f.name).join(", ")} exceed${
            rejected.length === 1 ? "s" : ""
          } the ${formatBytes(maxFileSizeBytes)} limit per file.`,
        },
      );
    }

    // Treat files as duplicates when name, size and lastModified match an
    // already-selected file. This reduces false-positives compared to using
    // name alone (different files with same name) while remaining robust.
    const existingKeys = new Set(
      files.map((f) => `${f.name}|${f.size}|${f.lastModified}`),
    );

    let newFiles = incoming.filter((f) => {
      const key = `${f.name}|${f.size}|${f.lastModified}`;
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });

    if (newFiles.length === 0) return;

    // If maxFiles is provided, ensure we don't exceed the limit by
    // truncating the incoming selection to the remaining slots.
    if (typeof maxFiles === "number") {
      const remaining = Math.max(0, maxFiles - files.length);
      if (remaining <= 0) return;
      if (newFiles.length > remaining) newFiles = newFiles.slice(0, remaining);
    }

    if (newFiles.length === 0) return;

    onFilesSelected(newFiles);
  };

  return (
    <div className="flex flex-col gap-2">
      {inUpload ? null : typeof maxFiles === "number" &&
        files.length >= maxFiles ? (
        <div className="flex cursor-not-allowed flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-6 py-6 text-center bg-muted/20">
          <IconCloudUpload className="size-7 text-muted-foreground" />
          <Typography variant="small" as="p">
            Maximum of {maxFiles} files selected. Remove a file to add more.
          </Typography>
          <Typography variant="muted" className="text-xs">
            You can upload up to {maxFiles} file{maxFiles > 1 ? "s" : ""}.
          </Typography>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={locked ? -1 : 0}
          aria-disabled={locked}
          onDragOver={(event) => {
            if (locked) return;
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            if (!locked) handleFileList(event.dataTransfer.files);
          }}
          onClick={() => {
            if (!locked) inputRef.current?.click();
          }}
          onKeyDown={(event) => {
            if (locked) return;
            if (event.key === "Enter" || event.key === " ")
              inputRef.current?.click();
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-6 py-6 text-center transition-colors",
            locked ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            dragOver && !locked
              ? "border-primary bg-primary/5"
              : cn(
                  "border-border",
                  !locked && "hover:border-primary/40 hover:bg-muted/50",
                ),
          )}
        >
          <IconCloudUpload
            className={cn(
              "size-7",
              dragOver ? "text-primary" : "text-muted-foreground",
            )}
          />
          <Typography variant="small" as="p">
            Drag &amp; drop files here, or{" "}
            <span className="text-primary underline underline-offset-2">
              browse
            </span>
          </Typography>
          <Typography variant="muted" className="text-xs">
            Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG, JSON, CSV, XLS,
            XLSX, PPTX, ODT, ODS
          </Typography>
          <Typography variant="muted" className="text-xs font-medium">
            Maximum file size: {formatBytes(maxFileSizeBytes)} per file ·{" "}
            {KNOWLEDGE_FILE_MAX_PAGES} pages per document ·{" "}
            {KNOWLEDGE_FILE_MAX_RECORDS.toLocaleString("en-US")} rows per data
            file
            {typeof maxFiles === "number" ? ` · up to ${maxFiles} files` : ""}
          </Typography>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={
              ".pdf,.doc,.docx,.jpg,.jpeg,.png,.json,.csv,.xlsx,.xls,.pptx,.odt,.ods," +
              "application/pdf,application/json,text/csv,image/jpeg,image/png," +
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
              "application/msword,application/vnd.oasis.opendocument.text," +
              "application/vnd.oasis.opendocument.spreadsheet," +
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
              "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            }
            className="hidden"
            onChange={(event) => {
              handleFileList(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      )}
      {files.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {files.length} {files.length === 1 ? "File" : "Files"}
          </p>
          {files.map((file, index) => (
            <div
              key={`${file.name}|${file.size}|${file.lastModified}`}
              className="flex flex-col gap-1"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
                <FileTypeIcon
                  fileType={file.type}
                  className="size-5 shrink-0 text-muted-foreground"
                />
                <div className="min-w-0 flex-1 basis-40">
                  <Typography variant="small" as="p" className="truncate">
                    {file.name}
                  </Typography>
                  <Typography variant="muted" className="text-xs">
                    {formatBytes(file.size)}
                  </Typography>
                </div>
                {/* At the right of the file on wider screens; on a phone it
                    drops to its own line under the name, below the remove button. */}
                {renderFileExtra && (
                  <div className="order-last w-full sm:order-none sm:w-56 sm:shrink-0 lg:w-64">
                    {renderFileExtra(file, index)}
                  </div>
                )}
                {rowStatus?.[index] ? (
                  <RowStatusIcon status={rowStatus[index].status} />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={locked}
                    onClick={() => onRemoveFile(index)}
                    aria-label={`Remove ${file.name}`}
                  >
                    <IconX className="size-4" />
                  </Button>
                )}
              </div>
              {errors?.[index] && (
                <p className="text-xs text-destructive">{errors[index]}</p>
              )}
              {rowStatus?.[index]?.detail && (
                <p
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium",
                    BADGE_TONE_STYLES[
                      DETAIL_TONE[rowStatus[index].status] ?? "neutral"
                    ],
                  )}
                >
                  {rowStatus[index].detail}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
