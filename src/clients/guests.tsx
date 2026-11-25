"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OnChangeFn, PaginationState } from "@tanstack/react-table";

import { DataTable } from "@/components/custom/data-table";
import { getGuestColumns } from "@/components/custom/crm/guests-columns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVE_FILTER_STYLE } from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  FetchGuests,
  type GuestFilters,
  type GuestOrdering,
} from "@/redux/api-slice/guest-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const PER_PAGE = 25;

const SORT_OPTIONS: { value: GuestOrdering; label: string }[] = [
  { value: "-last_visit_at", label: "Recent visit" },
  { value: "-visit_count", label: "Most visits" },
  { value: "-chats_count", label: "Most chats" },
  { value: "-first_seen", label: "Newest guests" },
  { value: "first_seen", label: "Oldest guests" },
];

type VisitsOption = "all" | "returning" | "first";

const VISITS_OPTIONS: { value: VisitsOption; label: string }[] = [
  { value: "all", label: "All visits" },
  { value: "returning", label: "Returning" },
  { value: "first", label: "First visit" },
];

export default function Guests() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchGuestsData, FetchGuestsIsLoading } = useAppSelector(
    (state) => state.GetGuestReducer.FetchGuestsState,
  );

  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState<GuestOrdering>("-last_visit_at");
  const [visits, setVisits] = useState<VisitsOption>("all");

  // "all" means the question isn't asked, so the param is left out.
  const requestFilters: GuestFilters = useMemo(
    () => ({
      ordering,
      returning: visits === "all" ? undefined : visits === "returning",
    }),
    [ordering, visits],
  );

  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      FetchGuests({
        storeCode,
        page,
        limit: PER_PAGE,
        filters: requestFilters,
      }),
    );
  }, [dispatch, storeCode, page, requestFilters]);

  const columns = useMemo(() => getGuestColumns(), []);

  // The shared table is zero-indexed; this screen's API is 1-indexed.
  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize: PER_PAGE,
  };
  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    setPage(next.pageIndex + 1);
  };

  const hasQuery = visits !== "all";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Select
          value={visits}
          onValueChange={(value) => {
            setVisits(value as VisitsOption);
            setPage(1);
          }}
        >
          <SelectTrigger
            className={cn("w-36", visits !== "all" && ACTIVE_FILTER_STYLE)}
            aria-label="Filter guests by visits"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VISITS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={ordering}
          onValueChange={(value) => {
            setOrdering(value as GuestOrdering);
            setPage(1);
          }}
        >
          <SelectTrigger
            // A sort order is always applied, including the default.
            className={cn("w-40", ACTIVE_FILTER_STYLE)}
            aria-label="Sort guests"
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
      </div>

      <DataTable
        columns={columns}
        data={FetchGuestsData.results}
        totalCount={FetchGuestsData.count}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        isLoading={FetchGuestsIsLoading}
        noun="guest"
        onRowClick={(guest) => router.push(`/crm/guests/${guest.id}`)}
        emptyTitle={hasQuery ? "No matching guests" : "No guests yet"}
        emptyDescription={
          hasQuery
            ? "Try a different visits filter."
            : "Guests appear here once shoppers open your chat."
        }
      />
    </div>
  );
}
