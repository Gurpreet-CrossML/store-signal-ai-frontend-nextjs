"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconMessageCheck } from "@tabler/icons-react";

import { QuestionsDataTablePagination } from "@/components/custom/knowledge/test-ai/questions-data-table-pagination";
import { QuestionsSearchInput } from "@/components/custom/knowledge/test-ai/questions-search-input";
import { AskQuestionButton } from "@/components/custom/knowledge/test-ai/ask-question-button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import {
  KNOWLEDGE_UNANSWERED_ALL_REASONS,
  KNOWLEDGE_UNANSWERED_PAGE_SIZE,
  KNOWLEDGE_UNANSWERED_REASONS,
  type KnowledgeUnansweredReason,
} from "@/lib/config";
import { formatDateTime, getThreadHref } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { FetchUnansweredQuestions } from "@/redux/api-slice/knowledge-test-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

type ReasonFilter =
  | KnowledgeUnansweredReason
  | typeof KNOWLEDGE_UNANSWERED_ALL_REASONS;

/** A reply's 0-1 confidence as a percentage, "-" when it has none. */
function formatConfidence(confidence: number | null): string {
  return confidence === null ? "-" : `${Math.round(confidence * 100)}%`;
}

/**
 * The "Unanswered Questions" tab: what customers asked that the AI couldn't
 * answer — its chat was escalated to a human, or the AI's reply had low
 * confidence. Searchable, filterable by reason, and paginated; each question
 * can be tried in the chat or opened in its conversation.
 */
export function UnansweredQuestionsTab({
  onAsk,
  isAsking,
}: {
  /** Asks the AI this question in the chat. */
  onAsk: (question: string) => void;
  /** True while the AI is answering a question. */
  isAsking: boolean;
}) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const {
    FetchUnansweredQuestionsData: data,
    FetchUnansweredQuestionsIsLoading: isLoading,
  } = useAppSelector(
    (state) => state.GetKnowledgeTestAiReducer.FetchUnansweredQuestionsState,
  );

  const [search, setSearch] = useState("");
  const [reason, setReason] = useState<ReasonFilter>(
    KNOWLEDGE_UNANSWERED_ALL_REASONS,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(KNOWLEDGE_UNANSWERED_PAGE_SIZE);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      FetchUnansweredQuestions({
        storeCode,
        page,
        pageSize,
        search: debouncedSearch,
        reason:
          reason === KNOWLEDGE_UNANSWERED_ALL_REASONS ? undefined : reason,
      }),
    );
  }, [dispatch, storeCode, page, pageSize, debouncedSearch, reason]);

  const questions = data?.results ?? [];
  // Before the first answer there is nothing to say "none" about.
  const showSkeleton = isLoading && data === null;
  // Also true while the debounce waits to send what was just typed, so the
  // list never looks settled while a new search is on its way.
  const isRefreshing = isLoading || search !== debouncedSearch;
  const hasFilters =
    debouncedSearch.trim() !== "" ||
    reason !== KNOWLEDGE_UNANSWERED_ALL_REASONS;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <QuestionsSearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search questions"
          isRefreshing={isRefreshing}
        />
        <Select
          value={reason}
          onValueChange={(value) => {
            setReason(value as ReasonFilter);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filter by reason" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={KNOWLEDGE_UNANSWERED_ALL_REASONS}>
              All reasons
            </SelectItem>
            {Object.entries(KNOWLEDGE_UNANSWERED_REASONS).map(
              ([value, meta]) => (
                <SelectItem key={value} value={value}>
                  {meta.label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      {showSkeleton ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <Empty className="rounded-lg border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconMessageCheck />
            </EmptyMedia>
            <EmptyTitle>
              {hasFilters
                ? "No questions match your filters"
                : "No unanswered questions"}
            </EmptyTitle>
            <EmptyDescription>
              {hasFilters
                ? "Try a different search or reason."
                : "Questions your AI couldn't answer will show up here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul
          aria-busy={isRefreshing}
          className={cn(
            "divide-y rounded-lg border transition-opacity",
            isRefreshing && "opacity-60",
          )}
        >
          {questions.map((item) => {
            const meta = KNOWLEDGE_UNANSWERED_REASONS[item.reason];
            return (
              <li key={item.id} className="flex flex-col gap-2 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-sm font-medium">{item.question}</p>
                  <AskQuestionButton
                    question={item.question}
                    onAsk={onAsk}
                    disabled={isAsking}
                  />
                </div>
                {item.answer && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    AI replied: {item.answer}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                  <Badge
                    variant="outline"
                    className={BADGE_TONE_STYLES[meta.tone]}
                  >
                    {meta.label}
                  </Badge>
                  {item.confidence !== null && (
                    <span>Confidence {formatConfidence(item.confidence)}</span>
                  )}
                  <span>{formatDateTime(item.askedAt)}</span>
                  <Link
                    href={getThreadHref(item.threadId, item.threadIsActive)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    View Chat
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <QuestionsDataTablePagination
        totalCount={data?.count ?? 0}
        pageSize={pageSize}
        page={page}
        onPaginationChange={(next) => {
          setPage(next.page);
          setPageSize(next.pageSize);
        }}
      />
    </div>
  );
}
