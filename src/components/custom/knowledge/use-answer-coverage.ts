import { useEffect, useState } from "react";

import {
  DEFAULT_DASHBOARD_FILTERS,
  resolveDashboardRange,
  type DashboardFilterState,
} from "@/components/custom/dashboard-filters";
import { FetchAnswerCoverage } from "@/redux/api-slice/knowledge-test-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/** The period it starts on: the last 30 days. */
const DEFAULT_FILTERS: DashboardFilterState = {
  ...DEFAULT_DASHBOARD_FILTERS,
  range: "30d",
};

/**
 * How well the selected store's knowledge answered customers in a period the
 * user can change, shared by the KB Coverage card and its details page. It
 * loads again when the store or the period changes, and drops a request whose
 * period was changed again before it came back.
 */
export function useAnswerCoverage() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const {
    FetchAnswerCoverageData: data,
    FetchAnswerCoverageIsLoading: isLoading,
    FetchAnswerCoverageIsError: isError,
  } = useAppSelector(
    (state) => state.GetKnowledgeTestAiReducer.FetchAnswerCoverageState,
  );
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const range = resolveDashboardRange(filters);

  useEffect(() => {
    if (!storeCode || !range.from || !range.to) return;
    const request = dispatch(
      FetchAnswerCoverage({
        storeCode,
        dateFrom: range.from,
        dateTo: range.to,
      }),
    );
    return () => request.abort();
  }, [dispatch, storeCode, range.from, range.to]);

  return { data, isLoading, isError, filters, setFilters, range };
}
