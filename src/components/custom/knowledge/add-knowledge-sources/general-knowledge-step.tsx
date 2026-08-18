"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Typography } from "@/components/ui/typography";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchKnowledgeItems,
  type KnowledgeItem,
} from "@/redux/api-slice/knowledge-rag-slice";
import {
  GENERAL_SOURCE_OPTIONS,
  type AddKnowledgeSource,
} from "@/components/custom/knowledge/knowledge-meta";
import { OptionCard } from "@/components/custom/knowledge/option-card";
import { KnowledgeEntriesPanel } from "@/components/custom/knowledge/knowledge-entries-panel";
import { UploadFileStep } from "@/components/custom/knowledge/add-knowledge-sources/upload-file-step";
import { FaqStep } from "@/components/custom/knowledge/add-knowledge-sources/faq-step";
import { PolicyStep } from "@/components/custom/knowledge/add-knowledge-sources/policy-step";

export function GeneralKnowledgeStep({
  item,
  onBack,
  onDone,
}: {
  item?: KnowledgeItem | null;
  onBack?: () => void;
  onDone: () => void;
}) {
  const dispatch = useAppDispatch();
  const isManaging = Boolean(item?.id);
  const [sourceType, setSourceType] = useState<AddKnowledgeSource | null>(null);

  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchKnowledgeItemsListData } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.FetchKnowledgeItemsState,
  );
  const generalEntries = isManaging
    ? FetchKnowledgeItemsListData.results.filter(
        (entry) => entry.type === "general",
      )
    : [];

  // The library list loads one 25-item page at a time; the panel below
  // needs every general-knowledge entry regardless of which page happens
  // to be cached, so it fetches its own larger page.
  useEffect(() => {
    if (!isManaging || !storeCode) return;
    dispatch(FetchKnowledgeItems({ storeCode, pageSize: 100 }));
  }, [isManaging, storeCode, dispatch]);

  if (isManaging) {
    return (
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-1">
        <KnowledgeEntriesPanel
          entries={generalEntries}
          emptyLabel="No general knowledge added yet."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-1">
      {!sourceType && (
        <div className="flex flex-col gap-3">
          <div>
            <Typography variant="small" as="p" className="font-medium">
              How do you want to add this?
            </Typography>
            <Typography variant="muted" className="text-xs">
              Choose how you&apos;d like to add this knowledge.
            </Typography>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {GENERAL_SOURCE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                description={option.description}
                icon={option.icon}
                tone={option.tone}
                selected={sourceType === option.value}
                onClick={() => setSourceType(option.value)}
              />
            ))}
          </div>
        </div>
      )}

      {sourceType === "file" && (
        <UploadFileStep
          knowledgeType="general"
          product={null}
          onBack={() => setSourceType(null)}
          onDone={onDone}
        />
      )}
      {sourceType === "faq" && (
        <FaqStep
          knowledgeType="general"
          product={null}
          onBack={() => setSourceType(null)}
          onDone={onDone}
        />
      )}
      {sourceType === "policy" && (
        <PolicyStep
          knowledgeType="general"
          product={null}
          onBack={() => setSourceType(null)}
          onDone={onDone}
        />
      )}

      {!sourceType && onBack && (
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        </DialogFooter>
      )}
    </div>
  );
}
