"use client";

import { useRef, useState } from "react";
import {
  IconCloudUpload,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypeTxt,
  IconX,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
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
  return <IconFileTypeTxt className={className} />;
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
 * with each selection individually removable. Only accepts the types the
 * backend's `KNOWLEDGE_ALLOWED_FILE_EXTENSIONS` allows (PDF/DOCX — no
 * TXT, unlike the single-file variant above, which predates that
 * constraint and is left as-is since nothing here depends on it). */
export function MultiFileUploadDropzone({
  files,
  onFilesSelected,
  onRemoveFile,
  errors,
  maxFiles,
}: {
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  errors?: (string | undefined)[];
  maxFiles?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileList = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const incoming = Array.from(fileList);

    // Treat files as duplicates when name, size and lastModified match an
    // already-selected file. This reduces false-positives compared to using
    // name alone (different files with same name) while remaining robust.
    const existingKeys = new Set(
      files.map((f) => `${f.name}|${f.size}|${f.lastModified}`),
    );

    let newFiles = incoming.filter((f) => {
      const key = `${f.name}|${f.size}|${f.lastModified}`;
      return !existingKeys.has(key);
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
      {files.map((file, index) => (
        <div key={`${file.name}-${index}`} className="flex flex-col gap-1">
          <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
            <FileTypeIcon
              fileType={file.type}
              className="size-5 shrink-0 text-muted-foreground"
            />
            <div className="min-w-0 flex-1">
              <Typography variant="small" as="p" className="truncate">
                {file.name}
              </Typography>
              <Typography variant="muted" className="text-xs">
                {formatBytes(file.size)}
              </Typography>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onRemoveFile(index)}
              aria-label="Remove file"
            >
              <IconX className="size-4" />
            </Button>
          </div>
          {errors?.[index] && (
            <p className="text-xs text-destructive">{errors[index]}</p>
          )}
        </div>
      ))}

      {typeof maxFiles === "number" && files.length >= maxFiles ? (
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
          tabIndex={0}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            handleFileList(event.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ")
              inputRef.current?.click();
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-6 py-6 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/50",
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
            Supported formats: PDF, DOCX — select multiple at once
          </Typography>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(event) => {
              handleFileList(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}
