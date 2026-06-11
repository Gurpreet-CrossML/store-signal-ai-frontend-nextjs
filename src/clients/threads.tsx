"use client";

import { useEffect, useMemo, useState } from "react";
import type { PaginationState } from "@tanstack/react-table";

import { FetchThreads } from "@/redux/api-slice/thread-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { ThreadsDataTable } from "@/components/custom/threads-data-table";
import { threadsColumns } from "@/components/custom/threads-columns";
import { useDebounce } from "@/hooks/use-debounce";
import ThreadFilteration, {
  DEFAULT_THREAD_FILTERS,
  type ThreadFilterState,
} from "@/components/custom/thread-filteration";

export default function Threads() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { FetchThreadsListData, FetchThreadsIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchThreadsState,
  );

  // Controlled, server-side pagination. Defaults to 15 rows per page.
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const [filters, setFilters] = useState<ThreadFilterState>(
    DEFAULT_THREAD_FILTERS,
  );

  // Debounce the free-text search so we don't refetch on every keystroke.
  const debouncedSearch = useDebounce(filters.search.trim());

  // Reset to the first page whenever the store or any active filter changes
  // (render-phase, so the fetch effect below always sees page 0 for a new set).
  const filterSignature = JSON.stringify([
    storeCode,
    debouncedSearch,
    filters.is_active,
    filters.user_type,
    filters.has_ticket,
    filters.has_feedback,
  ]);
  const [prevFilterSignature, setPrevFilterSignature] =
    useState(filterSignature);
  if (filterSignature !== prevFilterSignature) {
    setPrevFilterSignature(filterSignature);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  // Fetch whenever the store, page, page size or filters change.
  // The API is 1-indexed, the table is 0-indexed.
  useEffect(() => {
    if (!storeCode) return;
    const activeFilters = {
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(filters.is_active ? { is_active: filters.is_active === "true" } : {}),
      ...(filters.user_type ? { user_type: filters.user_type } : {}),
      ...(filters.has_ticket ? { has_ticket: true } : {}),
      ...(filters.has_feedback ? { has_feedback: true } : {}),
    };
    dispatch(
      FetchThreads({
        store_code: storeCode,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        filters: activeFilters,
      }),
    );
  }, [
    dispatch,
    storeCode,
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    filters.is_active,
    filters.user_type,
    filters.has_ticket,
    filters.has_feedback,
  ]);

  const rows = useMemo(
    () => FetchThreadsListData?.results ?? [],
    [FetchThreadsListData],
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <ThreadFilteration
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(DEFAULT_THREAD_FILTERS)}
      />
      <ThreadsDataTable
        columns={threadsColumns}
        data={rows}
        totalCount={FetchThreadsListData?.count ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={FetchThreadsIsLoading}
      />
    </div>
  );
}
