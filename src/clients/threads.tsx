"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PaginationState } from "@tanstack/react-table";

import { FetchThreads } from "@/redux/api-slice/thread-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { PageHeading } from "@/components/custom/page-heading";
import { ThreadsDataTable } from "@/components/custom/threads-data-table";
import { threadsColumns } from "@/components/custom/threads-columns";
import { useDebounce } from "@/hooks/use-debounce";
import ThreadFilteration, {
  DEFAULT_THREAD_FILTERS,
  type ThreadFilterState,
} from "@/components/custom/thread-filteration";

export default function Threads() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { FetchThreadsListData, FetchThreadsIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchThreadsState,
  );

  // `useSearchParams`/`usePathname` are typed as nullable for migration compat;
  // normalise to stable, non-null values.
  const queryString = searchParams?.toString() ?? "";
  const basePath = pathname ?? "/threads";

  // Controlled, server-side pagination. Defaults to 25 rows per page. The
  // active page is mirrored in the `?page=` query param (1-indexed) so a shared
  // link lands on the same page the thread lives on.
  const [pagination, setPagination] = useState<PaginationState>(() => {
    const pageParam = Number(searchParams?.get("page"));
    const pageIndex = pageParam > 1 ? Math.floor(pageParam) - 1 : 0;
    return { pageIndex, pageSize: 25 };
  });

  // Keep the `?page=` param in sync with the active page. Guarded so it only
  // writes when the value actually changes, which avoids a sync loop when other
  // params (e.g. `thread`) change.
  useEffect(() => {
    const params = new URLSearchParams(queryString);
    const desired =
      pagination.pageIndex > 0 ? String(pagination.pageIndex + 1) : null;
    if ((params.get("page") ?? null) === desired) return;
    if (desired) params.set("page", desired);
    else params.delete("page");
    const query = params.toString();
    router.replace(query ? `${basePath}?${query}` : basePath, {
      scroll: false,
    });
  }, [pagination.pageIndex, queryString, basePath, router]);

  // Each thread opens as its own page; browser back returns to this list
  // (the `?page=` param keeps the list position).
  const handleSelectThread = useCallback(
    (threadId: string, isActive: boolean) => {
      if (isActive) {
        router.push(`/support/?chat=${threadId}`);
      } else {
        router.push(`/threads/${threadId}`);
      }
    },
    [router],
  );

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
    filters.feedback_rating,
    filters.from,
    filters.to,
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
      ...(filters.has_ticket
        ? { has_ticket: filters.has_ticket === "true" }
        : {}),
      ...(filters.has_feedback
        ? { has_feedback: filters.has_feedback === "true" }
        : {}),
      ...(filters.feedback_rating
        ? { feedback_rating: filters.feedback_rating }
        : {}),
      ...(filters.from ? { from: filters.from } : {}),
      ...(filters.to ? { to: filters.to } : {}),
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
    filters.feedback_rating,
    filters.from,
    filters.to,
  ]);

  const rows = useMemo(
    () => FetchThreadsListData?.results ?? [],
    [FetchThreadsListData],
  );

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeading
        title="Threads"
        description="Every conversation your AI assistant has handled — search, filter, and open any thread for its full transcript."
      />
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
        onSelectThread={handleSelectThread}
      />
    </div>
  );
}
