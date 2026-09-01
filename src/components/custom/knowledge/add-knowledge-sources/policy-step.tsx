"use client";

import { useEffect, useState } from "react";
import { IconDeviceFloppy } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { AIScopeField } from "@/components/custom/knowledge/ai-scope-field";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  CreateKnowledgeItem,
  FetchKnowledgeItems,
  type AIScope,
} from "@/redux/api-slice/knowledge-rag-slice";
import { POLICY_TYPE_OPTIONS } from "@/components/custom/knowledge/knowledge-meta";
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
 * The "Policies" step of the Add Knowledge wizard. Deliberately its own
 * component rather than reusing PolicyManager — that one is the Store
 * Policy tab's standalone manager (existing-policies table, its own fetch
 * lifecycle) and belongs to that screen alone, so this step doesn't bend
 * it to fit here. Policies are always general knowledge, so `product` is
 * unused — kept only so this step matches the other wizard steps' shape.
 */
export function PolicyStep({ onBack, onDone }: SourceStepProps) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { CreateKnowledgeItemIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.CreateKnowledgeItemState,
  );
  const { FetchKnowledgeItemsListData } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.FetchKnowledgeItemsState,
  );

  // Existing policies aren't shown here (the wizard's "manage" view already
  // covers that) — fetched only to validate against: no duplicate type or URL.
  // The backend has no `policy_type` field, so the policy type is encoded as
  // the item's title (its label from POLICY_TYPE_OPTIONS) and read back the
  // same way.
  const existingPolicies = FetchKnowledgeItemsListData.results.filter(
    (entry) => entry.type === "general" && entry.source === "url",
  );

  const [type, setType] = useState("");
  const [url, setUrl] = useState("");
  const [aiScope, setAiScope] = useState<AIScope[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [aiScopeError, setAiScopeError] = useState<string | undefined>();

  useEffect(() => {
    if (!storeCode) return;
    dispatch(FetchKnowledgeItems({ storeCode, pageSize: 100 }));
  }, [storeCode, dispatch]);

  const usedTypes = new Set(
    existingPolicies.map(
      (p) =>
        POLICY_TYPE_OPTIONS.find((option) => option.label === p.title)?.value ??
        "",
    ),
  );
  const availableTypes = POLICY_TYPE_OPTIONS.filter(
    (option) => !usedTypes.has(option.value),
  );

  const handleSave = async () => {
    if (!type || !url.trim()) {
      setError("Please choose a type and enter a URL.");
      return;
    }
    if (!isValidUrl(url)) {
      setError("Enter a valid policy URL.");
      return;
    }
    const existingUrls = existingPolicies.map((p) => p.url ?? "");
    if (existingUrls.includes(url.trim())) {
      setError("This policy URL has already been added.");
      return;
    }
    const scopeValid = aiScope.length > 0;
    setAiScopeError(scopeValid ? undefined : "Select at least one AI");
    if (!scopeValid) return;

    setError(null);
    const result = await dispatch(
      CreateKnowledgeItem({
        storeCode,
        type: "general",
        source: "url",
        aiScope,
        url: url.trim(),
        // `title` is required by the backend and doubles as the policy
        // type here, since there's no `policy_type` field on the model.
        title:
          POLICY_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
          type,
      }),
    );

    if (!CreateKnowledgeItem.fulfilled.match(result)) {
      setError("This policy couldn't be saved. Please try again.");
      return;
    }
    onDone();
  };

  return (
    <div className="flex flex-1 flex-col">
      <FieldGroup className="flex-1 overflow-y-auto px-1">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <Field>
          <FieldLabel htmlFor="policy-type">Policy Type</FieldLabel>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="policy-type" className="w-full">
              <SelectValue placeholder="Select policy type" />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="policy-url">Policy URL</FieldLabel>
          <Input
            id="policy-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://company.com/policy"
            autoComplete="off"
          />
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
