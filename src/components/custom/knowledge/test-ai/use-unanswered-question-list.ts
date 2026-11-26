import { useEffect, useState } from "react";

import { useDebounce } from "@/hooks/use-debounce";
import { KNOWLEDGE_UNANSWERED_PAGE_SIZE } from "@/lib/config";
import { FetchUnansweredQuestions } from "@/redux/api-slice/knowledge-test-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/**
 * A searchable, paginated list of the customer questions the AI couldn't
 * answer, for the selected store: the one state that every table of them
 * shares. It loads again whenever the search, the page or one of the filters
 * changes, and a new search starts back at the first page.
 */
export function useUnansweredQuestionList({
  workflow,
  dateFrom,
  dateTo,
  trackedOnly,
}: {
  /** Only this workflow's questions; every workflow when left out. */
  workflow?: string;
  /** Only the questions asked in these days (yyyy-MM-dd). */
  dateFrom?: string;
  dateTo?: string;
  /** Only the questions KB coverage counts. */
  trackedOnly?: boolean;
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
        workflow,
        dateFrom,
        dateTo,
        trackedOnly,
      }),
    );
  }, [
    dispatch,
    storeCode,
    page,
    pageSize,
    debouncedSearch,
    workflow,
    dateFrom,
    dateTo,
    trackedOnly,
  ]);

  return {
    data,
    questions: data?.results ?? [],
    page,
    pageSize,
    search,
    // Before the first answer there is nothing to say "none" about.
    showLoading: isLoading && data === null,
    // Also true while the debounce waits to send what was just typed, so the
    // list never looks settled while a new search is on its way.
    isRefreshing: isLoading || search !== debouncedSearch,
    hasSearch: debouncedSearch.trim() !== "",
    changeSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    changePagination: (next: { page: number; pageSize: number }) => {
      setPage(next.page);
      setPageSize(next.pageSize);
    },
  };
}
