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

/** Local mock uploader — visually consistent with drop-zone.tsx but not wired
 * to it, since that component is hard-coded to the protected Document
 * Library's own upload thunk. */
export function FileUploadDropzone({
  file,
  existingFileName,
  onFileSelected,
  onClear,
}: {
  file: File | null;
  existingFileName?: string;
  onFileSelected: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  if (file || existingFileName) {
    const name = file?.name ?? existingFileName ?? "";
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
        <FileTypeIcon
          fileType={file?.type ?? existingFileName}
          className="size-5 shrink-0 text-muted-foreground"
        />
        <div className="min-w-0 flex-1">
          <Typography variant="small" as="p" className="truncate">
            {name}
          </Typography>
          {file && (
            <Typography variant="muted" className="text-xs">
              {formatBytes(file.size)}
            </Typography>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClear}
          aria-label="Remove file"
        >
          <IconX className="size-4" />
        </Button>
      </div>
    );
  }

  return (
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
        const dropped = event.dataTransfer.files?.[0];
        if (dropped) onFileSelected(dropped);
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
        Drag &amp; drop a file here, or{" "}
        <span className="text-primary underline underline-offset-2">
          browse
        </span>
      </Typography>
      <Typography variant="muted" className="text-xs">
        Supported formats: PDF, DOCX, TXT
      </Typography>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) onFileSelected(selected);
          event.target.value = "";
        }}
      />
    </div>
  );
}
