"use client";

import { useEffect, useMemo, useState } from "react";
import type { PaginationState } from "@tanstack/react-table";

import { FetchThreads } from "@/redux/api-slice/thread-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { ThreadsDataTable } from "@/components/custom/threads-data-table";
import { threadsColumns } from "@/components/custom/threads-columns";

export default function Threads() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore
  );

  const { FetchThreadsListData, FetchThreadsIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchThreadsState
  );

  // Controlled, server-side pagination. Defaults to 15 rows per page.
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  // Reset to the first page whenever the store changes.
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [storeCode]);

  // Fetch whenever the store, page or page size changes.
  // The API is 1-indexed, the table is 0-indexed.
  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      FetchThreads({
        store_code: storeCode,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })
    );
  }, [dispatch, storeCode, pagination.pageIndex, pagination.pageSize]);

  const rows = useMemo(
    () => FetchThreadsListData?.results ?? [],
    [FetchThreadsListData]
  );

  return (
    <div className="p-4">
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
