"use client";

import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import type { KnowledgeItem } from "@/redux/api-slice/knowledge-rag-slice";
import {
  DataTablePagination,
  PAGE_SIZE_OPTIONS,
} from "@/components/custom/threads-data-table-pagination";

// The pagination bar only needs the table's pagination state, not any
// rendered rows, so it drives an empty, stable column set.
const NO_COLUMNS: ColumnDef<KnowledgeItem, unknown>[] = [];

// Hide the bar only when no page-size choice could ever produce a second
// page — otherwise picking a larger size to fit everything on one page
// would hide the only control that lets you pick a smaller one again.
const MIN_PAGE_SIZE = Math.min(...PAGE_SIZE_OPTIONS);

/**
 * Drives the shared pagination bar for the Knowledge Library list, which
 * renders its own cards rather than a `<table>`. Isolated in its own
 * `*data-table*` file — like every other `useReactTable` call in this
 * codebase — since TanStack Table's API is inherently unmemoizable and
 * this filename pattern is where the project turns that lint rule off.
 */
export function KnowledgeDataTablePagination({
  items,
  totalCount,
  pageSize,
  page,
  onPaginationChange,
}: {
  items: KnowledgeItem[];
  totalCount: number;
  pageSize: number;
  page: number;
  onPaginationChange: (next: { page: number; pageSize: number }) => void;
}) {
  // The shared pagination bar is zero-indexed; this screen's API is 1-indexed.
  const pagination: PaginationState = { pageIndex: page - 1, pageSize };
  // One combined callback, not a page setter + a size setter — a page-size
  // change and the page-index reset that comes with it arrive together in
  // the same `next`, so both are forwarded in one call.
  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    onPaginationChange({ page: next.pageIndex + 1, pageSize: next.pageSize });
  };
  const table = useReactTable({
    data: items,
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
      noun="knowledge item"
    />
  );
}
