"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconSearch, IconX } from "@tabler/icons-react";
import type { OnChangeFn, PaginationState } from "@tanstack/react-table";
import type { ReadonlyURLSearchParams } from "next/navigation";

import { DataTable } from "@/components/custom/data-table";
import { getOrderColumns } from "@/components/custom/crm/orders-columns";
import {
  EMPTY_ORDER_FILTERS,
  FINANCIAL_STATUSES,
  FULFILLMENT_STATUSES,
  OrderFilterBar,
  countActiveOrderFilters,
  type OrderFilterSelection,
} from "@/components/custom/crm/order-filters";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { endOfDay, startOfDay } from "@/lib/helpers";
import {
  FetchOrders,
  type OrderFilters,
  type OrderOrdering,
} from "@/redux/api-slice/order-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { ACTIVE_FILTER_STYLE } from "@/lib/config";
import { cn } from "@/lib/utils";

const PER_PAGE = 25;

const SORT_OPTIONS: { value: OrderOrdering; label: string }[] = [
  { value: "-created_at", label: "Newest First" },
  { value: "created_at", label: "Oldest First" },
  { value: "-total_price", label: "Highest Value" },
  { value: "total_price", label: "Lowest Value" },
  { value: "-order_number", label: "Order Number" },
];

function numeric(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// The applied filters live in the URL (same names the API takes), so they can
// be seen, shared and survive a refresh.
function filtersFromParams(
  params: ReadonlyURLSearchParams | null,
): OrderFilterSelection {
  if (!params) return EMPTY_ORDER_FILTERS;
  const known = (list: readonly { value: string }[], key: string) =>
    params.getAll(key).filter((v) => list.some((o) => o.value === v));
  return {
    financialStatuses: known(FINANCIAL_STATUSES, "financial_status"),
    fulfillmentStatuses: known(FULFILLMENT_STATUSES, "fulfillment_status"),
    totalMin: params.get("total_min") ?? "",
    totalMax: params.get("total_max") ?? "",
    createdFrom: params.get("created_from") ?? "",
    createdTo: params.get("created_to") ?? "",
    money:
      params.get("has_outstanding") === "true"
        ? "outstanding"
        : params.get("has_refund") === "true"
          ? "refunded"
          : "any",
    cancelled:
      params.get("cancelled") === "true"
        ? "yes"
        : params.get("cancelled") === "false"
          ? "no"
          : "any",
  };
}

export default function Orders() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const safePathname = pathname ?? "/crm/orders";
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
  const [searchInput, setSearchInput] = useState(
    () => searchParams?.get("search")?.trim() ?? "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(
    () => searchParams?.get("search")?.trim() ?? "",
  );
  const [ordering, setOrdering] = useState<OrderOrdering>(() => {
    const value = searchParams?.get("ordering");
    return SORT_OPTIONS.some((o) => o.value === value)
      ? (value as OrderOrdering)
      : "-created_at";
  });

  // Filters apply as they change; the request uses the debounced copy so
  // half-typed bounds don't fire a query on every keystroke.
  const [filters, setFilters] = useState<OrderFilterSelection>(() =>
    filtersFromParams(searchParams),
  );
  const appliedFilters = useDebounce(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const requestFilters: OrderFilters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(customerId ? { customer: customerId } : {}),
      ...(appliedFilters.financialStatuses.length
        ? { financial_status: appliedFilters.financialStatuses }
        : {}),
      ...(appliedFilters.fulfillmentStatuses.length
        ? { fulfillment_status: appliedFilters.fulfillmentStatuses }
        : {}),
      total_min: numeric(appliedFilters.totalMin),
      total_max: numeric(appliedFilters.totalMax),
      ...(appliedFilters.money === "outstanding"
        ? { has_outstanding: true }
        : {}),
      ...(appliedFilters.money === "refunded" ? { has_refund: true } : {}),
      ...(appliedFilters.cancelled === "any"
        ? {}
        : { cancelled: appliedFilters.cancelled === "yes" }),
      // The picker yields whole days; the range has to cover all of its
      // last one or "up to today" would stop at midnight.
      ...(appliedFilters.createdFrom
        ? { created_from: startOfDay(appliedFilters.createdFrom) }
        : {}),
      ...(appliedFilters.createdTo
        ? { created_to: endOfDay(appliedFilters.createdTo) }
        : {}),
      ordering,
    }),
    [appliedFilters, customerId, debouncedSearch, ordering],
  );

  // Mirror the search, sort and applied filters into the URL.
  useEffect(() => {
    const params = new URLSearchParams();
    if (customerId) params.set("customer", String(customerId));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (ordering !== "-created_at") params.set("ordering", ordering);
    for (const [key, value] of Object.entries(requestFilters)) {
      if (["search", "customer", "ordering"].includes(key)) continue;
      if (value === undefined) continue;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
      else params.set(key, String(value));
    }

    // The request carries whole-day timestamps; the URL keeps the picked day.
    if (appliedFilters.createdFrom)
      params.set("created_from", appliedFilters.createdFrom);
    if (appliedFilters.createdTo)
      params.set("created_to", appliedFilters.createdTo);
    const query = params.toString();
    if (query === (searchParams?.toString() ?? "")) return;
    router.replace(query ? `${safePathname}?${query}` : safePathname, {
      scroll: false,
    });
  }, [
    appliedFilters,
    customerId,
    debouncedSearch,
    ordering,
    safePathname,
    requestFilters,
    router,
    searchParams,
  ]);
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
  const activeFilterCount = countActiveOrderFilters(appliedFilters);

  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize: PER_PAGE,
  };
  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    setPage(next.pageIndex + 1);
  };

  const hasQuery =
    Boolean(debouncedSearch) || activeFilterCount > 0 || Boolean(customerId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search order number, email, phone or tracking…"
            aria-label="Search orders"
            className={cn("h-8 pl-9", searchInput && ACTIVE_FILTER_STYLE)}
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              aria-label="Clear order search"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX className="size-4" />
            </button>
          ) : null}
        </div>

        <Select
          value={ordering}
          onValueChange={(value) => {
            setOrdering(value as OrderOrdering);
            setPage(1);
          }}
        >
          <SelectTrigger
            size="sm"
            // A sort order is always applied, including the default.
            className={cn("w-44", ACTIVE_FILTER_STYLE)}
            aria-label="Sort orders"
          >
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

        <OrderFilterBar
          filters={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
          activeCount={countActiveOrderFilters(filters)}
          onClear={() => {
            setFilters(EMPTY_ORDER_FILTERS);
            setPage(1);
          }}
        />
      </div>

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
