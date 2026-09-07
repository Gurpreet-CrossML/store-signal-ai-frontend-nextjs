"use client";

import { useEffect, useState } from "react";
import { IconDeviceFloppy } from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  UpdateKnowledgeItem,
  type AIScope,
  type KnowledgeItem,
} from "@/redux/api-slice/knowledge-rag-slice";
import { KNOWLEDGE_TYPE_META } from "@/components/custom/knowledge/knowledge-meta";
import { AIScopeField } from "@/components/custom/knowledge/ai-scope-field";
import {
  formatBytes,
  MultiFileUploadDropzone,
} from "@/components/custom/knowledge/file-upload-dropzone";
import { isValidUrl, normalizeUrl } from "@/lib/url";

/**
 * Edit is content-only, scoped to what's safe to change without a full
 * reprocess: AI scope always, plus source-specific content — FAQ
 * question/answer, a URL item's URL, or a replacement file. Title and
 * associations (product/category/collection) aren't editable here —
 * that data only comes from the Add flow.
 *
 * Every save sends the item's complete current data (not just the fields
 * touched in this dialog) in a single PATCH, so the backend always sees a
 * full, consistent record rather than a partial diff.
 */
export function EditKnowledgeDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: KnowledgeItem | null;
  onSaved: () => void;
}) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { UpdateKnowledgeItemIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.UpdateKnowledgeItemState,
  );

  const [aiScope, setAiScope] = useState<AIScope[]>([]);
  const [dialogContainer, setDialogContainer] = useState<HTMLElement | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [faqErrors, setFaqErrors] = useState<{
    question?: string;
    answer?: string;
  }>({});
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | undefined>();
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (open && item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets to the clicked item's current values whenever the dialog (re)opens
      setAiScope(item.aiScope);
      setQuestion(item.question ?? "");
      setAnswer(item.answer ?? "");
      setError(undefined);
      setFaqErrors({});
      setUrl(item.url ?? "");
      setUrlError(undefined);
      setFile(null);
    }
  }, [open, item]);

  if (!item) return null;

  const meta = KNOWLEDGE_TYPE_META[item.type];
  const isFaq = item.source === "faq";
  const isUrl = item.source === "url";
  const isFile = item.source === "file";
  const isSaving = UpdateKnowledgeItemIsLoading;

  const handleSave = async () => {
    if (aiScope.length === 0) {
      setError("Select at least one AI");
      return;
    }
    if (isFaq) {
      const nextFaqErrors: { question?: string; answer?: string } = {};
      if (!question.trim()) nextFaqErrors.question = "Question is required";
      if (!answer.trim()) nextFaqErrors.answer = "Answer is required";
      setFaqErrors(nextFaqErrors);
      if (Object.keys(nextFaqErrors).length > 0) return;
    }
    if (isUrl) {
      if (!url.trim()) {
        setUrlError("URL is required");
        return;
      }
      if (!isValidUrl(url)) {
        setUrlError("Enter a valid URL");
        return;
      }
    }

    // Always send the item's complete current data, not just the fields
    // touched in this dialog.
    const result = await dispatch(
      UpdateKnowledgeItem({
        id: item.id,
        storeCode,
        patch: {
          type: item.type,
          source: item.source,
          title: item.title,
          aiScope,
          content: item.content,
          question: isFaq ? question.trim() : item.question,
          answer: isFaq ? answer.trim() : item.answer,
          url: isUrl ? normalizeUrl(url) : item.url,
          file: isFile && file ? file : undefined,
        },
      }),
    );
    if (!UpdateKnowledgeItem.fulfilled.match(result)) return;

    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={setDialogContainer}
        className="flex max-h-[85vh] flex-col gap-4 sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>Edit {meta.label}</DialogTitle>
          <DialogDescription className="truncate">
            {item.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <FieldGroup>
            {isFaq && (
              <>
                <Field>
                  <FieldLabel htmlFor="edit-faq-question">Question</FieldLabel>
                  <Input
                    id="edit-faq-question"
                    autoComplete="off"
                    value={question}
                    onChange={(event) => {
                      setQuestion(event.target.value);
                      if (event.target.value.trim()) {
                        setFaqErrors((prev) => ({
                          ...prev,
                          question: undefined,
                        }));
                      }
                    }}
                    aria-invalid={Boolean(faqErrors.question)}
                  />
                  {faqErrors.question && (
                    <p className="text-sm text-destructive">
                      {faqErrors.question}
                    </p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-faq-answer">Answer</FieldLabel>
                  <Textarea
                    id="edit-faq-answer"
                    rows={3}
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value);
                      if (event.target.value.trim()) {
                        setFaqErrors((prev) => ({
                          ...prev,
                          answer: undefined,
                        }));
                      }
                    }}
                    aria-invalid={Boolean(faqErrors.answer)}
                  />
                  {faqErrors.answer && (
                    <p className="text-sm text-destructive">
                      {faqErrors.answer}
                    </p>
                  )}
                </Field>
              </>
            )}

            {isUrl && (
              <Field>
                <FieldLabel htmlFor="edit-url">URL</FieldLabel>
                <Input
                  id="edit-url"
                  autoComplete="off"
                  placeholder="https://company.com/pages/shipping"
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    if (event.target.value.trim()) setUrlError(undefined);
                  }}
                  aria-invalid={Boolean(urlError)}
                />
                {urlError && (
                  <p className="text-sm text-destructive">{urlError}</p>
                )}
              </Field>
            )}

            {isFile && (
              <Field>
                <FieldLabel>File</FieldLabel>
                {!file && item.fileUrl && (
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-sm font-medium text-primary underline underline-offset-2"
                      >
                        {item.fileName ?? "Current file"}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {(item.fileType ?? "").toUpperCase()}
                        {item.fileSize ? ` · ${formatBytes(item.fileSize)}` : ""}
                      </p>
                    </div>
                  </div>
                )}
                <MultiFileUploadDropzone
                  files={file ? [file] : []}
                  onFilesSelected={(selected) => setFile(selected[0] ?? null)}
                  onRemoveFile={() => setFile(null)}
                  maxFiles={1}
                />
                <FieldDescription>
                  {file
                    ? "This file will replace the current one when you save."
                    : "Upload a new file to replace the current one."}
                </FieldDescription>
              </Field>
            )}

            <AIScopeField
              value={aiScope}
              onChange={(next) => {
                setAiScope(next);
                if (next.length > 0) setError(undefined);
              }}
              error={error}
              container={dialogContainer}
            />
          </FieldGroup>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Spinner data-icon="inline-start" />
                Saving…
              </>
            ) : (
              <>
                <IconDeviceFloppy />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
