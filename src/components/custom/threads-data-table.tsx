"use client";

import { Fragment } from "react";
import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingState } from "@/components/custom/loading-state";
import { DataTablePagination } from "@/components/custom/threads-data-table-pagination";
import { Thread } from "@/redux/api-slice/thread-slice";

interface ThreadsDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Total number of rows across all pages (from the API `count`). */
  totalCount: number;
  /** Controlled pagination state, owned by the parent (server-side paging). */
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  isLoading?: boolean;
  /** Navigate to a thread's detail page. */
  onSelectThread: (threadId: string, isActive: boolean) => void;
}

// "Today · Sep 29, 2026" / "Yesterday · …" / "Mon · …", in the viewer's timezone.
function dateKey(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dateGroupLabel(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  const full = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const key = dateKey(value);
  if (key === dateKey(today.toISOString())) return `Today · ${full}`;
  if (key === dateKey(yesterday.toISOString())) return `Yesterday · ${full}`;
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    d,
  );
  return `${weekday} · ${full}`;
}

export function ThreadsDataTable<TData, TValue>({
  columns,
  data,
  totalCount,
  pagination,
  onPaginationChange,
  isLoading = false,
  onSelectThread,
}: ThreadsDataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
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
                  <LoadingState label="Loading Threads…" className="py-0" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index, rows) => {
                const created = (row.original as Thread).created_at;
                const previous = rows[index - 1]?.original as
                  | Thread
                  | undefined;
                const startsGroup =
                  !previous ||
                  dateKey(previous.created_at) !== dateKey(created);
                return (
                  <Fragment key={row.id}>
                    {startsGroup && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={columns.length}
                          className="bg-muted/40 py-2 text-xs font-medium text-muted-foreground"
                        >
                          {dateGroupLabel(created)}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow
                      onClick={() =>
                        onSelectThread(
                          (row.original as Thread).id,
                          (row.original as Thread).is_active,
                        )
                      }
                      className={`cursor-pointer hover:bg-accent/50 data-[state=selected]:bg-accent ${
                        (row.original as Thread).is_active
                          ? "bg-primary/[0.025]"
                          : ""
                      }`}
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
                  </Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No threads found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} totalCount={totalCount} />
    </div>
  );
}
