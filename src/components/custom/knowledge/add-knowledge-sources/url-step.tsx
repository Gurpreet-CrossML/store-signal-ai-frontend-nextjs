"use client";

import { useState } from "react";
import { IconDeviceFloppy } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AIScopeField } from "@/components/custom/knowledge/ai-scope-field";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  CreateKnowledgeItem,
  type AIScope,
} from "@/redux/api-slice/knowledge-rag-slice";
import type { SourceStepProps } from "@/components/custom/knowledge/add-knowledge-sources/types";

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * A plain title + URL knowledge source — unlike PolicyStep (general
 * knowledge only, title derived from a fixed policy type), this is for
 * product knowledge: any link, with its own title.
 */
export function UrlStep({
  knowledgeType,
  product,
  onBack,
  onDone,
}: SourceStepProps) {
  const dispatch = useAppDispatch();
  const { CreateKnowledgeItemIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.CreateKnowledgeItemState,
  );
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [aiScope, setAiScope] = useState<AIScope[]>([]);
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const [aiScopeError, setAiScopeError] = useState<string | undefined>();

  const handleSave = async () => {
    const nextErrors: { title?: string; url?: string } = {};
    if (!title.trim()) nextErrors.title = "Title is required";
    if (!url.trim()) nextErrors.url = "URL is required";
    else if (!isValidUrl(url)) nextErrors.url = "Enter a valid URL";
    setErrors(nextErrors);

    const scopeValid = aiScope.length > 0;
    setAiScopeError(scopeValid ? undefined : "Select at least one AI");

    if (Object.keys(nextErrors).length > 0 || !scopeValid) return;

    const result = await dispatch(
      CreateKnowledgeItem({
        storeCode,
        type: knowledgeType,
        source: "url",
        aiScope,
        title: title.trim(),
        url: url.trim(),
        productId: product?.id,
        productName: product?.name,
      }),
    );

    if (CreateKnowledgeItem.fulfilled.match(result)) onDone();
  };

  return (
    <div className="flex flex-1 flex-col">
      <FieldGroup className="flex-1 overflow-y-auto px-1">
        <Field>
          <FieldLabel htmlFor="url-title">Title</FieldLabel>
          <Input
            id="url-title"
            placeholder="Sizing Guide"
            autoComplete="off"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (event.target.value.trim()) {
                setErrors((prev) => ({ ...prev, title: undefined }));
              }
            }}
            aria-invalid={Boolean(errors.title)}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="url-link">URL</FieldLabel>
          <Input
            id="url-link"
            placeholder="https://company.com/products/example"
            autoComplete="off"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              if (event.target.value.trim()) {
                setErrors((prev) => ({ ...prev, url: undefined }));
              }
            }}
            aria-invalid={Boolean(errors.url)}
          />
          {errors.url && (
            <p className="text-xs text-destructive">{errors.url}</p>
          )}
        </Field>

        <AIScopeField
          value={aiScope}
          onChange={(next) => {
            setAiScope(next);
            if (next.length > 0) setAiScopeError(undefined);
          }}
          error={aiScopeError}
        />
      </FieldGroup>

      <DialogFooter className="mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={CreateKnowledgeItemIsLoading}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={CreateKnowledgeItemIsLoading}
        >
          {CreateKnowledgeItemIsLoading ? (
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
    </div>
  );
}
