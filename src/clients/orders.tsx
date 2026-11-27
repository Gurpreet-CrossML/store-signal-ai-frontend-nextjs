"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconArrowsSort, IconSearch, IconX } from "@tabler/icons-react";
import type { PaginationState } from "@tanstack/react-table";

import { CountTabs, type CountTab } from "@/components/custom/count-tabs";
import { DataTable } from "@/components/custom/data-table";
import { getOrderColumns } from "@/components/custom/crm/orders-columns";
import { DateRangePicker } from "@/components/custom/date-range-picker";
import { Badge } from "@/components/ui/badge";
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
  FetchOrderSummary,
  FetchOrders,
  type OrderFilters,
  type OrderOrdering,
  type OrderPayment,
  type OrderTab,
} from "@/redux/api-slice/order-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const SORT_OPTIONS: { value: OrderOrdering; label: string }[] = [
  { value: "-created_at", label: "Newest First" },
  { value: "created_at", label: "Oldest First" },
  { value: "-total_price", label: "Total: High To Low" },
  { value: "total_price", label: "Total: Low To High" },
];

const PAYMENT_OPTIONS: { value: OrderPayment | "all"; label: string }[] = [
  { value: "all", label: "All Payments" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "refunded", label: "Refunded" },
];

/** A picked placed date range, as the picker gives it ("" when open). */
type DateRange = { from: string; to: string };

const NO_RANGE: DateRange = { from: "", to: "" };

export default function Orders() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Set when arriving from a customer's page: the list is that shopper's.
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
  const summary = useAppSelector(
    (state) =>
      state.GetOrderReducer.FetchOrderSummaryState.FetchOrderSummaryData,
  );

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  // A ticket's "View orders" link opens the list searched by email.
  const [searchInput, setSearchInput] = useState(
    () => searchParams?.get("search")?.trim() ?? "",
  );
  const [ordering, setOrdering] = useState<OrderOrdering>("-created_at");
  const [tab, setTab] = useState<OrderTab | "all">("all");
  const [payment, setPayment] = useState<OrderPayment | "all">("all");
  const [placed, setPlaced] = useState<DateRange>(NO_RANGE);
  // Search waits for typing to pause, so a request isn't fired per keystroke.
  const search = useDebounce(searchInput.trim());

  // Back to page 1 whenever the selection changes (render-phase, so the
  // fetch below never asks for a page past the end).
  const querySignature = JSON.stringify([
    storeCode,
    customerId,
    search,
    ordering,
    tab,
    payment,
    placed,
  ]);
  const [prevSignature, setPrevSignature] = useState(querySignature);
  if (querySignature !== prevSignature) {
    setPrevSignature(querySignature);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  const requestFilters = useMemo<OrderFilters>(
    () => ({
      ...(search ? { search } : {}),
      ...(customerId ? { customer: customerId } : {}),
      ...(tab !== "all" ? { tab } : {}),
      ...(payment !== "all" ? { payment } : {}),
      // The picker gives whole days; the range covers all of its last one.
      ...(placed.from ? { placed_from: startOfDay(placed.from) } : {}),
      ...(placed.to ? { placed_to: endOfDay(placed.to) } : {}),
      ordering,
    }),
    [search, customerId, tab, payment, placed, ordering],
  );

  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      FetchOrders({
        storeCode,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        filters: requestFilters,
      }),
    );
  }, [dispatch, storeCode, pagination, requestFilters]);

  // The tab counts are for the whole store (or the one customer), so they
  // only reload with those.
  useEffect(() => {
    if (!storeCode) return;
    dispatch(FetchOrderSummary({ storeCode, customerId }));
  }, [dispatch, storeCode, customerId]);

  // A column that would say the same on every row is left out.
  const columns = useMemo(
    () =>
      getOrderColumns({
        showCustomer: !customerId,
        // Pending and Refunded each cover several states (authorized,
        // partially refunded…), so only Paid makes the column redundant.
        showPayment: payment !== "paid",
        showFulfillment: tab === "all",
      }),
    [customerId, payment, tab],
  );

  const tabs: CountTab<OrderTab | "all">[] = [
    { key: "all", label: "All Orders", count: summary?.total },
    {
      key: "unfulfilled",
      label: "Unfulfilled",
      count: summary?.tabs.unfulfilled,
    },
    {
      key: "partial",
      label: "Partially Fulfilled",
      count: summary?.tabs.partial,
    },
    { key: "fulfilled", label: "Fulfilled", count: summary?.tabs.fulfilled },
    { key: "cancelled", label: "Cancelled", count: summary?.tabs.cancelled },
  ];

  const hasRange = Boolean(placed.from || placed.to);
  const hasQuery =
    Boolean(search) || tab !== "all" || payment !== "all" || hasRange;
  const customerName = customerId
    ? FetchOrdersData.results[0]?.customer?.name
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <CountTabs tabs={tabs} tab={tab} onChange={setTab} />

      <div className="flex flex-wrap items-center gap-2">
        {customerId ? (
          <Badge variant="outline" className="h-8 gap-1.5 px-2.5 font-normal">
            {customerName ? `Customer: ${customerName}` : "One Customer"}
            <button
              type="button"
              onClick={() => router.replace("/crm/orders", { scroll: false })}
              aria-label="Show every customer's orders"
              className="text-muted-foreground hover:text-foreground"
            >
              <IconX className="size-3.5" />
            </button>
          </Badge>
        ) : null}

        <div className="relative min-w-56 flex-1 sm:max-w-sm">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={
              customerId ? "Search order" : "Search order, customer or email"
            }
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

        <DateRangePicker
          from={placed.from}
          to={placed.to}
          placeholder="Placed"
          disabled={{ after: new Date() }}
          onRangeChange={(from, to) => setPlaced({ from, to })}
        />
        {hasRange ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setPlaced(NO_RANGE)}
          >
            <IconX />
            Clear
          </Button>
        ) : null}

        <Select
          value={payment}
          onValueChange={(value) => setPayment(value as OrderPayment | "all")}
        >
          <SelectTrigger
            size="sm"
            className={cn("w-auto", payment !== "all" && ACTIVE_FILTER_STYLE)}
            aria-label="Filter by payment"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={ordering}
          onValueChange={(value) => setOrdering(value as OrderOrdering)}
        >
          {/* Phones keep the default sort, as on Customers. */}
          <SelectTrigger
            size="sm"
            className="w-auto max-sm:hidden"
            aria-label="Sort orders"
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
        data={FetchOrdersData.results}
        totalCount={FetchOrdersData.count}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={FetchOrdersIsLoading}
        noun="order"
        headerClassName="bg-muted/50 max-md:hidden"
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
