"use client";

import { useMemo } from "react";
import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { LoadingState } from "@/components/custom/loading-state";
import { DataTablePagination } from "@/components/custom/threads-data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  /**
   * The current page's rows. Tolerates undefined so a caller whose fetch
   * returned an unexpected shape renders an empty table rather than
   * bringing the page down.
   */
  data: TData[] | undefined;
  /** Total rows across all pages (the API's `count`). */
  totalCount: number;
  /** Controlled pagination state, owned by the parent (server-side paging). */
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  isLoading?: boolean;
  /** What the rows are, for the loader, empty state and pagination copy. */
  noun: string;
  nounPlural?: string;
  /** Rows become clickable when provided. */
  onRowClick?: (row: TData) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * The table every list screen uses: a bare bordered table over the shared
 * pagination bar — never wrapped in a card, so tables read the same way
 * across Threads, Tags and everything after them.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  totalCount,
  pagination,
  onPaginationChange,
  isLoading = false,
  noun,
  nounPlural = `${noun}s`,
  onRowClick,
  emptyTitle,
  emptyDescription,
}: DataTableProps<TData, TValue>) {
  // TanStack builds its row model straight off this array; handed undefined
  // it produces a row model with no `rows` at all, and every read of it
  // throws. One default here protects every list screen.
  const rows = useMemo(() => data ?? [], [data]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { pagination },
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: totalCount,
  });

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-border/50">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24">
                  <LoadingState
                    label={`Loading ${nounPlural}…`}
                    className="py-0"
                  />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  className={cn(
                    onRowClick &&
                      "cursor-pointer hover:bg-accent/50 data-[state=selected]:bg-accent",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <Typography variant="small" as="p">
                    {emptyTitle ?? `No ${nounPlural} found`}
                  </Typography>
                  {emptyDescription && (
                    <Typography variant="muted" className="mt-1">
                      {emptyDescription}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} totalCount={totalCount} noun={noun} />
    </div>
  );
}
