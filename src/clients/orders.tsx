"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OnChangeFn, PaginationState } from "@tanstack/react-table";

import { DataTable } from "@/components/custom/data-table";
import { getOrderColumns } from "@/components/custom/crm/orders-columns";
import {
  DEFAULT_ORDER_FILTERS,
  OrderFilterBar,
  hasOrderFilters,
  type OrderFilterState,
} from "@/components/custom/crm/order-filters";
import { useDebounce } from "@/hooks/use-debounce";
import { endOfDay, startOfDay } from "@/lib/helpers";
import { FetchOrders, type OrderFilters } from "@/redux/api-slice/order-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const PER_PAGE = 25;

export default function Orders() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Set when arriving from a customer's page, so the list opens scoped to
  // that shopper rather than making you search for them again.
  const customerParam = Number(searchParams?.get("customer") ?? "");
  const customerId =
    Number.isInteger(customerParam) && customerParam > 0
      ? customerParam
      : undefined;

  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchOrdersData, FetchOrdersIsLoading } = useAppSelector(
    (state) => state.GetOrderReducer.FetchOrdersState,
  );

  const [page, setPage] = useState(1);
  // Arriving from a customer's page fills the search with their email, so
  // the list opens scoped to that shopper and the filter shows in the box.
  const [filters, setFilters] = useState<OrderFilterState>(() => ({
    ...DEFAULT_ORDER_FILTERS,
    search: searchParams?.get("search")?.trim() ?? "",
  }));
  // So a request isn't fired per keystroke.
  const debouncedSearch = useDebounce(filters.search.trim());

  const requestFilters: OrderFilters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(customerId ? { customer: customerId } : {}),
      ...(filters.financialStatus
        ? { financial_status: [filters.financialStatus] }
        : {}),
      ...(filters.fulfillmentStatus
        ? { fulfillment_status: [filters.fulfillmentStatus] }
        : {}),
      ...(filters.cancelled ? { cancelled: filters.cancelled === "true" } : {}),
      // The picker yields whole days; the range has to cover all of its
      // last one or "up to today" would stop at midnight.
      ...(filters.createdFrom
        ? { created_from: startOfDay(filters.createdFrom) }
        : {}),
      ...(filters.createdTo ? { created_to: endOfDay(filters.createdTo) } : {}),
      ordering: filters.ordering,
    }),
    [
      debouncedSearch,
      customerId,
      filters.financialStatus,
      filters.fulfillmentStatus,
      filters.cancelled,
      filters.createdFrom,
      filters.createdTo,
      filters.ordering,
    ],
  );

  // A new search, filter or sort starts again from page 1 (during render, as
  // on Threads, so the fetch below never runs with the old page).
  const [prevRequestFilters, setPrevRequestFilters] = useState(requestFilters);
  if (requestFilters !== prevRequestFilters) {
    setPrevRequestFilters(requestFilters);
    setPage(1);
  }

  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      FetchOrders({
        storeCode,
        page,
        limit: PER_PAGE,
        filters: requestFilters,
      }),
    );
  }, [dispatch, storeCode, page, requestFilters]);

  const columns = useMemo(() => getOrderColumns(), []);

  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize: PER_PAGE,
  };
  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    setPage(next.pageIndex + 1);
  };

  const hasQuery = hasOrderFilters(filters) || Boolean(customerId);

  return (
    <div className="flex flex-col gap-6">
      <OrderFilterBar
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(DEFAULT_ORDER_FILTERS)}
      />

      <DataTable
        columns={columns}
        data={FetchOrdersData.results}
        totalCount={FetchOrdersData.count}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        isLoading={FetchOrdersIsLoading}
        noun="order"
        onRowClick={(order) => router.push(`/crm/orders/${order.id}`)}
        emptyTitle={hasQuery ? "No Matching Orders" : "No Orders Yet"}
        emptyDescription={
          hasQuery
            ? "Try a different search or loosen the filters."
            : "Orders appear here once they are synced from your store."
        }
      />
    </div>
  );
}
