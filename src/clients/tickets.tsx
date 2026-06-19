"use client";

import { useEffect, useMemo, useState } from "react";
import type { PaginationState } from "@tanstack/react-table";

import { FetchTickets } from "@/redux/api-slice/ticket-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { TicketsDataTable } from "@/components/custom/tickets-data-table";
import { ticketsColumns } from "@/components/custom/tickets-columns";
import { useDebounce } from "@/hooks/use-debounce";
import TicketFilteration, {
  DEFAULT_TICKET_FILTERS,
  type TicketFilterState,
} from "@/components/custom/ticket-filteration";

export default function Tickets() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { FetchTicketsListData, FetchTicketsIsLoading } = useAppSelector(
    (state) => state.GetTicketReducer.FetchTicketsState,
  );

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const [filters, setFilters] = useState<TicketFilterState>(
    DEFAULT_TICKET_FILTERS,
  );

  const debouncedSearch = useDebounce(filters.search.trim());

  const filterSignature = JSON.stringify([
    storeCode,
    debouncedSearch,
    filters.status,
    filters.priority,
    filters.platform,
  ]);
  const [prevFilterSignature, setPrevFilterSignature] =
    useState(filterSignature);
  if (filterSignature !== prevFilterSignature) {
    setPrevFilterSignature(filterSignature);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  useEffect(() => {
    if (!storeCode) return;

    const activeFilters = {
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.platform ? { platform: filters.platform } : {}),
    };

    dispatch(
      FetchTickets({
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
    filters.status,
    filters.priority,
    filters.platform,
  ]);

  const rows = useMemo(
    () => FetchTicketsListData?.results ?? [],
    [FetchTicketsListData],
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <TicketFilteration
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(DEFAULT_TICKET_FILTERS)}
      />
      <TicketsDataTable
        columns={ticketsColumns}
        data={rows}
        totalCount={FetchTicketsListData?.count ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={FetchTicketsIsLoading}
      />
    </div>
  );
}
