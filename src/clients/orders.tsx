"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconSearch, IconX } from "@tabler/icons-react";
import type { OnChangeFn, PaginationState } from "@tanstack/react-table";

import { DataTable } from "@/components/custom/data-table";
import { getOrderColumns } from "@/components/custom/crm/orders-columns";
import {
  EMPTY_ORDER_FILTERS,
  OrderFilterPopover,
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
import { endOfDay, startOfDay } from "@/lib/helpers";
import {
  FetchOrders,
  type OrderFilters,
  type OrderOrdering,
} from "@/redux/api-slice/order-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const PER_PAGE = 25;

const SORT_OPTIONS: { value: OrderOrdering; label: string }[] = [
  { value: "-created_at", label: "Newest first" },
  { value: "created_at", label: "Oldest first" },
  { value: "-total_price", label: "Highest value" },
  { value: "total_price", label: "Lowest value" },
  { value: "-order_number", label: "Order number" },
];

function numeric(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

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
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ordering, setOrdering] = useState<OrderOrdering>("-created_at");

  const [draftFilters, setDraftFilters] =
    useState<OrderFilterSelection>(EMPTY_ORDER_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<OrderFilterSelection>(EMPTY_ORDER_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search order number, email, phone or tracking…"
            aria-label="Search orders"
            className="pl-9"
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

        <div className="flex items-center gap-2">
          <Select
            value={ordering}
            onValueChange={(value) => {
              setOrdering(value as OrderOrdering);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44" aria-label="Sort orders">
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

          <OrderFilterPopover
            open={isFilterOpen}
            onOpenChange={(open) => {
              setIsFilterOpen(open);
              if (open) setDraftFilters(appliedFilters);
            }}
            filters={draftFilters}
            onFiltersChange={setDraftFilters}
            activeCount={activeFilterCount}
            onApply={() => {
              setAppliedFilters(draftFilters);
              setPage(1);
              setIsFilterOpen(false);
            }}
            onClear={() => {
              setDraftFilters(EMPTY_ORDER_FILTERS);
              setAppliedFilters(EMPTY_ORDER_FILTERS);
              setPage(1);
              setIsFilterOpen(false);
            }}
          />
        </div>
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
        emptyTitle={hasQuery ? "No matching orders" : "No orders yet"}
        emptyDescription={
          hasQuery
            ? "Try a different search or loosen the filters."
            : "Orders appear here once they are synced from your store."
        }
      />
    </div>
  );
}
