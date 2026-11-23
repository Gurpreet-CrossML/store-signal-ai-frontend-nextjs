"use client";

import { useEffect, useState } from "react";
import { IconTestPipe } from "@tabler/icons-react";

import { QuestionsDataTablePagination } from "@/components/custom/knowledge/test-ai/questions-data-table-pagination";
import { QuestionsSearchInput } from "@/components/custom/knowledge/test-ai/questions-search-input";
import { AskQuestionButton } from "@/components/custom/knowledge/test-ai/ask-question-button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { KNOWLEDGE_TEST_QUESTIONS_PAGE_SIZE } from "@/lib/config";
import { cn } from "@/lib/utils";
import { FetchTestQuestions } from "@/redux/api-slice/knowledge-test-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/**
 * The "Test Questions" tab: the sample customer questions, the same for every
 * store, searchable and paginated. They are questions the AI should answer from
 * the store's knowledge alone; Ask puts one to the AI in the chat.
 */
export function TestQuestionsTab({
  onAsk,
  isAsking,
}: {
  /** Asks the AI this question in the chat. */
  onAsk: (question: string) => void;
  /** True while the AI is answering a question. */
  isAsking: boolean;
}) {
  const dispatch = useAppDispatch();
  const { FetchTestQuestionsData: questions, FetchTestQuestionsIsLoading } =
    useAppSelector(
      (state) => state.GetKnowledgeTestAiReducer.FetchTestQuestionsState,
    );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(KNOWLEDGE_TEST_QUESTIONS_PAGE_SIZE);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    dispatch(FetchTestQuestions({ page, pageSize, search: debouncedSearch }));
  }, [dispatch, page, pageSize, debouncedSearch]);

  // Before the first answer there is nothing to say "no questions" about.
  const isLoading = FetchTestQuestionsIsLoading && questions === null;
  // Also true while the debounce waits to send what was just typed, so the
  // list never looks settled while a new search is on its way.
  const isRefreshing =
    FetchTestQuestionsIsLoading || search !== debouncedSearch;
  const items = questions?.results ?? [];

  return (
    <div className="flex flex-col gap-3">
      <QuestionsSearchInput
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search questions"
        isRefreshing={isRefreshing}
      />

      {isLoading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : items.length === 0 ? (
        <Empty className="rounded-lg border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconTestPipe />
            </EmptyMedia>
            <EmptyTitle>No questions found</EmptyTitle>
            <EmptyDescription>
              {debouncedSearch
                ? "No question matches your search."
                : "There are no test questions yet."}
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
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
            >
              <span className="min-w-0">{item.question}</span>
              <AskQuestionButton
                question={item.question}
                onAsk={onAsk}
                disabled={isAsking}
              />
            </li>
          ))}
        </ul>
      )}

      <QuestionsDataTablePagination
        totalCount={questions?.count ?? 0}
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
