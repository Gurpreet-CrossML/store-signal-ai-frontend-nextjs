"use client";

import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  DataTablePagination,
  PAGE_SIZE_OPTIONS,
} from "@/components/custom/threads-data-table-pagination";

// The pagination bar only needs the table's pagination state, not any
// rendered rows, so it drives an empty, stable column set.
const NO_COLUMNS: ColumnDef<unknown, unknown>[] = [];
const MIN_PAGE_SIZE = Math.min(...PAGE_SIZE_OPTIONS);

/**
 * Drives the shared pagination bar for the Test AI question lists. Kept in
 * its own `*data-table*` file, like every other `useReactTable` call here,
 * since that filename pattern is where the project turns the lint rule for
 * TanStack Table's unmemoizable API off.
 */
export function QuestionsDataTablePagination({
  totalCount,
  pageSize,
  page,
  onPaginationChange,
}: {
  totalCount: number;
  pageSize: number;
  page: number;
  onPaginationChange: (next: { page: number; pageSize: number }) => void;
}) {
  // The shared bar is zero-indexed; the API is 1-indexed.
  const pagination: PaginationState = { pageIndex: page - 1, pageSize };
  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    onPaginationChange({ page: next.pageIndex + 1, pageSize: next.pageSize });
  };
  const table = useReactTable({
    data: [],
    columns: NO_COLUMNS,
    state: { pagination },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: totalCount,
  });

  if (totalCount <= MIN_PAGE_SIZE) return null;
  return (
    <DataTablePagination
      table={table}
      totalCount={totalCount}
      noun="question"
      compactOnMobile
    />
  );
}
