"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OnChangeFn, PaginationState } from "@tanstack/react-table";

import { DataTable } from "@/components/custom/data-table";
import { getCustomerColumns } from "@/components/custom/crm/customers-columns";
import {
  CustomerFilterBar,
  DEFAULT_CUSTOMER_FILTERS,
  hasCustomerFilters,
  type CustomerFilterState,
} from "@/components/custom/crm/customer-filters";
import { useDebounce } from "@/hooks/use-debounce";
import { endOfDay, startOfDay } from "@/lib/helpers";
import {
  FetchCustomers,
  type CustomerFilters,
} from "@/redux/api-slice/customer-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const PER_PAGE = 25;

export default function Customers() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchCustomersData, FetchCustomersIsLoading } = useAppSelector(
    (state) => state.GetCustomerReducer.FetchCustomersState,
  );

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CustomerFilterState>(
    DEFAULT_CUSTOMER_FILTERS,
  );
  // So a request isn't fired per keystroke.
  const debouncedSearch = useDebounce(filters.search.trim());

  const requestFilters: CustomerFilters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(filters.hasOrders === "true" ? { orders_count_min: 1 } : {}),
      ...(filters.hasOrders === "false" ? { orders_count_max: 0 } : {}),
      ...(filters.emailVerified
        ? { is_email_verified: filters.emailVerified === "true" }
        : {}),
      // The picker yields whole days; the range has to cover all of its last
      // one or "up to today" would stop at midnight.
      ...(filters.registeredFrom
        ? { registered_from: startOfDay(filters.registeredFrom) }
        : {}),
      ...(filters.registeredTo
        ? { registered_to: endOfDay(filters.registeredTo) }
        : {}),
      ordering: filters.ordering,
    }),
    [
      debouncedSearch,
      filters.hasOrders,
      filters.emailVerified,
      filters.registeredFrom,
      filters.registeredTo,
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
      FetchCustomers({
        storeCode,
        page,
        limit: PER_PAGE,
        filters: requestFilters,
      }),
    );
  }, [dispatch, storeCode, page, requestFilters]);

  const columns = useMemo(() => getCustomerColumns(), []);

  // The shared table is zero-indexed; this screen's API is 1-indexed.
  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize: PER_PAGE,
  };
  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    setPage(next.pageIndex + 1);
  };

  const hasQuery = hasCustomerFilters(filters);

  return (
    <div className="flex flex-col gap-6">
      <CustomerFilterBar
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(DEFAULT_CUSTOMER_FILTERS)}
      />

      <DataTable
        columns={columns}
        data={FetchCustomersData.results}
        totalCount={FetchCustomersData.count}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        isLoading={FetchCustomersIsLoading}
        noun="customer"
        onRowClick={(customer) => router.push(`/crm/customers/${customer.id}`)}
        emptyTitle={hasQuery ? "No Matching Customers" : "No Customers Yet"}
        emptyDescription={
          hasQuery
            ? "Try a different search or loosen the filters."
            : "Customers appear here once they are synced from your store."
        }
      />
    </div>
  );
}
