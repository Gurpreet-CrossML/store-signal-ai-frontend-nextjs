"use client";

import { useRef, useState } from "react";
import { IconAlertCircle, IconCloudUpload } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { UploadLibraryDocument } from "@/redux/api-slice/knowledge-slice";

const ACCEPTED_TYPES =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type DropZoneProps = {
  storeCode: string;
  onUploaded: () => void;
};

export default function DropZone({ storeCode, onUploaded }: DropZoneProps) {
  const dispatch = useAppDispatch();
  const { UploadLibraryDocumentIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeReducer.UploadLibraryDocumentState,
  );

  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setError(null);
    const fileType = file.type;
    if (!fileType || !ACCEPTED_TYPES.includes(fileType)) {
      setError("Only PDF and DOCX files are supported.");
      return;
    }

    const result = await dispatch(
      UploadLibraryDocument({ store_code: storeCode, file, fileType }),
    );
    if (UploadLibraryDocument.fulfilled.match(result)) {
      onUploaded();
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const disabled = UploadLibraryDocumentIsLoading || !storeCode;

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !disabled) {
            inputRef.current?.click();
          }
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 border-2 border-dashed px-6 py-6 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-muted/50",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        {UploadLibraryDocumentIsLoading ? (
          <Spinner className="size-7 text-primary" />
        ) : (
          <IconCloudUpload
            className={cn(
              "size-7",
              dragOver ? "text-primary" : "text-muted-foreground",
            )}
          />
        )}
        <p className="text-sm font-medium text-foreground">
          {UploadLibraryDocumentIsLoading ? (
            "Uploading…"
          ) : (
            <>
              Drag &amp; drop a file here, or{" "}
              <span className="text-primary underline underline-offset-2">
                browse
              </span>
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          Supported formats: PDF, DOCX
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <IconAlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
