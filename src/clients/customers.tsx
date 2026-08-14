"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch, IconX } from "@tabler/icons-react";
import type { OnChangeFn, PaginationState } from "@tanstack/react-table";

import { DataTable } from "@/components/custom/data-table";
import { getCustomerColumns } from "@/components/custom/crm/customers-columns";
import {
  CustomerFilterPopover,
  EMPTY_CUSTOMER_FILTERS,
  countActiveCustomerFilters,
  type CustomerFilterSelection,
} from "@/components/custom/crm/customer-filters";
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
  FetchCustomers,
  type CustomerFilters,
  type CustomerOrdering,
} from "@/redux/api-slice/customer-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const PER_PAGE = 25;

const SORT_OPTIONS: { value: CustomerOrdering; label: string }[] = [
  { value: "-total_spent", label: "Top spenders" },
  { value: "-orders_count", label: "Most orders" },
  { value: "-registered_at", label: "Newest customers" },
  { value: "registered_at", label: "Oldest customers" },
  { value: "first_name", label: "Name (A–Z)" },
];

/** "any" means the question isn't being asked, so the param is omitted. */
function triState(value: "any" | "yes" | "no") {
  return value === "any" ? undefined : value === "yes";
}

function numeric(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ordering, setOrdering] = useState<CustomerOrdering>("-total_spent");

  // Draft is what the popover edits; applied is what the request uses, so
  // half-typed bounds don't fire a query on every keystroke.
  const [draftFilters, setDraftFilters] = useState<CustomerFilterSelection>(
    EMPTY_CUSTOMER_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] = useState<CustomerFilterSelection>(
    EMPTY_CUSTOMER_FILTERS,
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debounce the search so a request isn't fired per keystroke, and reset to
  // page 1 in the same tick rather than chaining a second effect off it.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const requestFilters: CustomerFilters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      accepts_email_marketing: triState(appliedFilters.emailConsent),
      accepts_sms_marketing: triState(appliedFilters.smsConsent),
      is_email_verified: triState(appliedFilters.emailVerified),
      orders_count_min: numeric(appliedFilters.ordersMin),
      orders_count_max: numeric(appliedFilters.ordersMax),
      total_spent_min: numeric(appliedFilters.spentMin),
      total_spent_max: numeric(appliedFilters.spentMax),
      // The picker yields whole days; the range has to cover all of its last
      // one or "up to today" would stop at midnight.
      ...(appliedFilters.registeredFrom
        ? { registered_from: startOfDay(appliedFilters.registeredFrom) }
        : {}),
      ...(appliedFilters.registeredTo
        ? { registered_to: endOfDay(appliedFilters.registeredTo) }
        : {}),
      ordering,
    }),
    [appliedFilters, debouncedSearch, ordering],
  );

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
  const activeFilterCount = countActiveCustomerFilters(appliedFilters);

  // The shared table is zero-indexed; this screen's API is 1-indexed.
  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize: PER_PAGE,
  };
  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    setPage(next.pageIndex + 1);
  };

  const hasQuery = Boolean(debouncedSearch) || activeFilterCount > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, email, phone or customer ID…"
            aria-label="Search customers"
            className="pl-9"
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

        <div className="flex items-center gap-2">
          <Select
            value={ordering}
            onValueChange={(value) => {
              setOrdering(value as CustomerOrdering);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44" aria-label="Sort customers">
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

          <CustomerFilterPopover
            open={isFilterOpen}
            onOpenChange={(open) => {
              setIsFilterOpen(open);
              // Reopening starts from what is actually applied, not from an
              // abandoned draft.
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
              setDraftFilters(EMPTY_CUSTOMER_FILTERS);
              setAppliedFilters(EMPTY_CUSTOMER_FILTERS);
              setPage(1);
              setIsFilterOpen(false);
            }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={FetchCustomersData.results}
        totalCount={FetchCustomersData.count}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        isLoading={FetchCustomersIsLoading}
        noun="customer"
        onRowClick={(customer) => router.push(`/crm/customers/${customer.id}`)}
        emptyTitle={hasQuery ? "No matching customers" : "No customers yet"}
        emptyDescription={
          hasQuery
            ? "Try a different search or loosen the filters."
            : "Customers appear here once they are synced from your store."
        }
      />
    </div>
  );
}
