"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowsSort, IconSearch, IconX } from "@tabler/icons-react";
import type { PaginationState } from "@tanstack/react-table";

import { DataTable } from "@/components/custom/data-table";
import { getCustomerColumns } from "@/components/custom/crm/customers-columns";
import {
  CustomerTabs,
  type CustomerTab,
} from "@/components/custom/crm/customer-tabs";
import { DateRangePicker } from "@/components/custom/date-range-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { ACTIVE_FILTER_STYLE } from "@/lib/config";
import { endOfDay, startOfDay } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import {
  FetchCustomerSummary,
  FetchCustomers,
  type CustomerFilters,
  type CustomerOrdering,
} from "@/redux/api-slice/customer-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const SORT_OPTIONS: { value: CustomerOrdering; label: string }[] = [
  { value: "-lifetime_value", label: "Lifetime Value" },
  { value: "-orders_count", label: "Orders" },
  { value: "-last_order_at", label: "Last Order" },
  { value: "-registered_at", label: "Newest Customers" },
  { value: "first_name", label: "Name (A–Z)" },
];

/** A picked last order date range, as the picker gives it ("" when open). */
type DateRange = { from: string; to: string };

const NO_RANGE: DateRange = { from: "", to: "" };

/** The request filters for the list's selection. */
function toRequestFilters(
  tab: CustomerTab,
  lastOrder: DateRange,
  search: string,
  ordering: CustomerOrdering,
): CustomerFilters {
  return {
    ...(search ? { search } : {}),
    ...(tab !== "all" ? { group: [tab] } : {}),
    // The picker gives whole days; the range covers all of its last one.
    ...(lastOrder.from ? { last_order_from: startOfDay(lastOrder.from) } : {}),
    ...(lastOrder.to ? { last_order_to: endOfDay(lastOrder.to) } : {}),
    ordering,
  };
}

export default function Customers() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchCustomersData, FetchCustomersIsLoading } = useAppSelector(
    (state) => state.GetCustomerReducer.FetchCustomersState,
  );
  const summary = useAppSelector(
    (state) =>
      state.GetCustomerReducer.FetchCustomerSummaryState
        .FetchCustomerSummaryData,
  );

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [searchInput, setSearchInput] = useState("");
  const [ordering, setOrdering] = useState<CustomerOrdering>("-lifetime_value");
  const [tab, setTab] = useState<CustomerTab>("all");
  const [lastOrder, setLastOrder] = useState<DateRange>(NO_RANGE);
  // Search waits for typing to pause, so a request isn't fired per keystroke.
  const search = useDebounce(searchInput.trim());

  // Back to page 1 whenever the store, search, sort, tab or dates change
  // (render-phase, so the fetch below never asks for a page past the end).
  const querySignature = JSON.stringify([
    storeCode,
    search,
    ordering,
    tab,
    lastOrder,
  ]);
  const [prevSignature, setPrevSignature] = useState(querySignature);
  if (querySignature !== prevSignature) {
    setPrevSignature(querySignature);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  const requestFilters = useMemo(
    () => toRequestFilters(tab, lastOrder, search, ordering),
    [tab, lastOrder, search, ordering],
  );

  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      FetchCustomers({
        storeCode,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        filters: requestFilters,
      }),
    );
  }, [dispatch, storeCode, pagination, requestFilters]);

  // The tab counts are for the whole store, so they only reload with it.
  useEffect(() => {
    if (!storeCode) return;
    dispatch(FetchCustomerSummary({ storeCode }));
  }, [dispatch, storeCode]);

  const columns = useMemo(
    () => getCustomerColumns({ currency: summary?.currency ?? "USD", tab }),
    [summary, tab],
  );

  const hasRange = Boolean(lastOrder.from || lastOrder.to);
  const hasQuery = Boolean(search) || tab !== "all" || hasRange;

  return (
    <div className="flex flex-col gap-4">
      <CustomerTabs tab={tab} onChange={setTab} summary={summary} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 sm:max-w-sm">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name or email"
            aria-label="Search customers"
            className={cn("h-8 pl-9", searchInput && ACTIVE_FILTER_STYLE)}
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              aria-label="Clear customer search"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX className="size-4" />
            </button>
          ) : null}
        </div>

        <DateRangePicker
          from={lastOrder.from}
          to={lastOrder.to}
          placeholder="Last Order"
          disabled={{ after: new Date() }}
          onRangeChange={(from, to) => setLastOrder({ from, to })}
        />
        {hasRange ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setLastOrder(NO_RANGE)}
          >
            <IconX />
            Clear
          </Button>
        ) : null}

        <Select
          value={ordering}
          onValueChange={(value) => setOrdering(value as CustomerOrdering)}
        >
          {/* Phones keep the default sort, as in the mobile design. */}
          <SelectTrigger
            size="sm"
            className="w-auto max-sm:hidden"
            aria-label="Sort customers"
          >
            <IconArrowsSort className="text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={FetchCustomersData.results}
        totalCount={FetchCustomersData.count}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={FetchCustomersIsLoading}
        noun="customer"
        headerClassName="bg-muted/50 max-md:hidden"
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
