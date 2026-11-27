"use client";

import { useEffect } from "react";
import Link from "next/link";

import { PageHeading } from "@/components/custom/page-heading";
import { KnowledgeCategoriesGrid } from "@/components/custom/knowledge/knowledge-categories-grid";
import { KnowledgeEmptyState } from "@/components/custom/knowledge/knowledge-empty-state";
import { KnowledgeCoverageCard } from "@/components/custom/knowledge/knowledge-coverage-card";
import { KnowledgeHeadingActions } from "@/components/custom/knowledge/knowledge-heading-actions";
import { KnowledgeStorageCard } from "@/components/custom/knowledge/knowledge-storage-card";
import { KnowledgeStorageNotice } from "@/components/custom/knowledge/knowledge-storage-notice";
import { useCan } from "@/hooks/use-can";
import { KNOWLEDGE_ALL_ROUTE, KNOWLEDGE_STATUS_POLL_MS } from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  FetchKnowledgeCategories,
  FetchKnowledgeItems,
  FetchKnowledgeStats,
} from "@/redux/api-slice/knowledge-rag-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/**
 * The Knowledge screen: how much storage the store uses, then every knowledge
 * category as a card with its item count. A card opens that category's own
 * list (see `KnowledgeLibraryTabContent`).
 */
export default function KnowledgeOverview() {
  const dispatch = useAppDispatch();
  const canEditKnowledge = useCan("knowledge", { write: true });
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchKnowledgeStatsData: stats } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.FetchKnowledgeStatsState,
  );
  const {
    FetchKnowledgeCategoriesData: categories,
    FetchKnowledgeCategoriesIsLoading: categoriesLoading,
  } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.FetchKnowledgeCategoriesState,
  );
  const knowledgeItems = useAppSelector(
    (state) =>
      state.GetKnowledgeRagReducer.FetchKnowledgeItemsState
        .FetchKnowledgeItemsListData.results,
  );

  useEffect(() => {
    if (!storeCode) return;
    dispatch(FetchKnowledgeStats({ storeCode }));
    dispatch(FetchKnowledgeCategories({ storeCode }));
    dispatch(FetchKnowledgeItems({ storeCode, pageSize: 100 }));
  }, [dispatch, storeCode]);

  const hasProcessingKnowledge = knowledgeItems.some(
    (item) => item.status === "pending" || item.status === "processing",
  );

  useEffect(() => {
    if (!storeCode || !hasProcessingKnowledge) return;

    const poll = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      dispatch(FetchKnowledgeItems({ storeCode, pageSize: 100, silent: true }));
      dispatch(FetchKnowledgeStats({ storeCode, silent: true }));
    }, KNOWLEDGE_STATUS_POLL_MS);

    return () => window.clearInterval(poll);
  }, [dispatch, storeCode, hasProcessingKnowledge]);

  // Nothing added yet: offer the ways to start instead of a grid of zeros.
  const isEmptyLibrary = stats !== null && stats.counts.knowledge_items === 0;
  // Products take up storage even before any knowledge is added, so an empty
  // library still shows the card once something is used.
  const showStorage = stats
    ? !isEmptyLibrary || stats.vector_storage.total > 0
    : true;

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeading
        title="Knowledge"
        description="What your AI knows about your store. It answers shoppers using what you add here, plus your Shopify products and orders."
        action={
          <KnowledgeHeadingActions
            showTest={!isEmptyLibrary}
            canEdit={canEditKnowledge}
          />
        }
        // On a phone the buttons stay on the title's row and the description
        // is left out; the empty library also sits under a rule.
        className={cn(
          "max-sm:flex-row max-sm:items-center max-sm:justify-between",
          isEmptyLibrary &&
            "max-sm:-mx-4 max-sm:-mt-4 max-sm:border-b max-sm:p-4",
        )}
        descriptionClassName="max-sm:hidden"
      />
      <div className="flex w-full flex-col gap-4">
        <KnowledgeStorageNotice storage={stats?.vector_storage ?? null} />
        {showStorage && (
          <KnowledgeStorageCard
            storage={stats?.vector_storage ?? null}
            counts={stats?.counts ?? null}
          />
        )}

        {isEmptyLibrary && canEditKnowledge ? (
          <KnowledgeEmptyState />
        ) : (
          <>
            {!isEmptyLibrary && <KnowledgeCoverageCard />}
            <Link
              href={`/knowledge/categories/${KNOWLEDGE_ALL_ROUTE}`}
              className="inline-flex items-center gap-1 self-end text-xs font-medium text-primary hover:underline"
            >
              View All
            </Link>
            <KnowledgeCategoriesGrid
              data={categories}
              isLoading={categoriesLoading}
            />
          </>
        )}
      </div>
    </div>
  );
}
