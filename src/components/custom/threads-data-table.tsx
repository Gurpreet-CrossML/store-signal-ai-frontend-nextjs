"use client";

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
import { DataTablePagination } from "@/components/custom/threads-data-table-pagination";
import ThreadDetailDrawer from "./thread-detail-drawer";
import { useState } from "react";
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
}

export function ThreadsDataTable<TData, TValue>({
  columns,
  data,
  totalCount,
  pagination,
  onPaginationChange,
  isLoading = false,
}: ThreadsDataTableProps<TData, TValue>) {
  const pageCount = Math.ceil(totalCount / pagination.pageSize) || 0;

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);

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
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading threads…
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => {
                    setSelectedThread(row.original as Thread);
                    setDrawerOpen(true);
                  }}
                  className="cursor-pointer hover:bg-accent/50 data-[state=selected]:bg-accent"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}
                      className={cell.column.id === "last_message" ? "max-w-[180px] truncate" : ""}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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
      <ThreadDetailDrawer
        open={drawerOpen}
        setOpen={setDrawerOpen}
        thread={selectedThread}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
