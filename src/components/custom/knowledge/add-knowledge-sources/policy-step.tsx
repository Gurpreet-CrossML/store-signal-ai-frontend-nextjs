"use client";

import { useEffect, useRef, useState } from "react";
import { IconDeviceFloppy, IconPlus, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { AIScopeField } from "@/components/custom/knowledge/ai-scope-field";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  CreateKnowledgeItem,
  FetchKnowledgeItems,
  type AIScope,
  type PolicyType,
} from "@/redux/api-slice/knowledge-rag-slice";
import { POLICY_TYPE_OPTIONS } from "@/components/custom/knowledge/knowledge-meta";
import type { SourceStepProps } from "@/components/custom/knowledge/add-knowledge-sources/types";

type DraftPolicy = {
  uid: string;
  type: string;
  url: string;
};

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
  const existingPolicies = FetchKnowledgeItemsListData.results.filter(
    (entry) => entry.type === "general" && Boolean(entry.policyType),
  );

  const draftCounter = useRef(1);
  const [drafts, setDrafts] = useState<DraftPolicy[]>([
    { uid: "draft-0", type: "", url: "" },
  ]);
  const [aiScope, setAiScope] = useState<AIScope[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [aiScopeError, setAiScopeError] = useState<string | undefined>();

  useEffect(() => {
    if (!storeCode) return;
    dispatch(FetchKnowledgeItems({ storeCode, pageSize: 100 }));
  }, [storeCode, dispatch]);

  const usedTypes = (currentType: string) => {
    const fromSaved = existingPolicies.map((p) => p.policyType ?? "");
    const fromDrafts = drafts
      .map((d) => d.type)
      .filter((t) => t && t !== currentType);
    return new Set([...fromSaved, ...fromDrafts]);
  };

  const availableTypes = (currentType: string) => {
    const used = usedTypes(currentType);
    return POLICY_TYPE_OPTIONS.filter((option) => !used.has(option.value));
  };

  const addDraft = () => {
    draftCounter.current += 1;
    setDrafts((prev) => [
      ...prev,
      { uid: `draft-${draftCounter.current}`, type: "", url: "" },
    ]);
  };

  const updateDraft = (uid: string, field: "type" | "url", value: string) => {
    setError(null);
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.uid === uid ? { ...draft, [field]: value } : draft,
      ),
    );
  };

  const removeDraft = (uid: string) => {
    setDrafts((prev) => prev.filter((draft) => draft.uid !== uid));
  };

  const handleSave = async () => {
    if (drafts.some((d) => !d.type || !d.url.trim())) {
      setError("Please choose a type and enter a URL for every policy.");
      return;
    }
    if (drafts.some((d) => !isValidUrl(d.url))) {
      setError("One or more policy URLs are invalid.");
      return;
    }
    const allUrls = [
      ...existingPolicies.map((p) => p.url ?? ""),
      ...drafts.map((d) => d.url.trim()),
    ];
    if (new Set(allUrls).size !== allUrls.length) {
      setError("Duplicate policy URLs are not allowed.");
      return;
    }
    const scopeValid = aiScope.length > 0;
    setAiScopeError(scopeValid ? undefined : "Select at least one AI");
    if (!scopeValid) return;

    setError(null);
    const results = await Promise.all(
      drafts.map((draft) =>
        dispatch(
          CreateKnowledgeItem({
            storeCode,
            type: "general",
            source: "url",
            aiScope,
            url: draft.url.trim(),
            policyType: draft.type as PolicyType,
          }),
        ).then((result) => ({
          uid: draft.uid,
          ok: CreateKnowledgeItem.fulfilled.match(result),
        })),
      ),
    );

    const failed = new Set(results.filter((r) => !r.ok).map((r) => r.uid));
    if (failed.size > 0) {
      setDrafts((prev) => prev.filter((draft) => failed.has(draft.uid)));
      setError("Some policies couldn't be saved. Please try again.");
      return;
    }
    onDone();
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-1">
        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] items-center gap-2">
            <Typography variant="muted" as="span" className="text-xs font-medium">
              Policy Type
            </Typography>
            <Typography variant="muted" as="span" className="text-xs font-medium">
              Policy URL
            </Typography>
            <span aria-hidden className="w-8" />
          </div>
          {drafts.map((draft) => (
            <div
              key={draft.uid}
              className="grid grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] items-center gap-2"
            >
              <Select
                value={draft.type}
                onValueChange={(value) => updateDraft(draft.uid, "type", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select policy type" />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes(draft.type).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={draft.url}
                onChange={(event) => updateDraft(draft.uid, "url", event.target.value)}
                placeholder="https://company.com/policy"
                autoComplete="off"
              />
              {drafts.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeDraft(draft.uid)}
                  aria-label="Remove policy"
                >
                  <IconTrash className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-fit"
          onClick={addDraft}
        >
          <IconPlus className="size-4" />
          Add Policy
        </Button>

        <AIScopeField
          value={aiScope}
          onChange={(next) => {
            setAiScope(next);
            if (next.length > 0) setAiScopeError(undefined);
          }}
          error={aiScopeError}
        />
      </div>

      <DialogFooter className="mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={CreateKnowledgeItemIsLoading}
        >
          Back
        </Button>
        <Button type="button" onClick={handleSave} disabled={CreateKnowledgeItemIsLoading}>
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
