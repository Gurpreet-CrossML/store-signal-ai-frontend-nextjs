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
import { Spinner } from "@/components/ui/spinner";
import { DataTablePagination } from "@/components/custom/threads-data-table-pagination";
import ThreadDetailDrawer from "@/components/custom/thread-detail-drawer";
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
  /** Id of the thread whose drawer is open (driven by the URL `?thread=`). */
  selectedThreadId: string | null;
  /** Full thread object for the open drawer, when present on the loaded page. */
  selectedThread: Thread | null;
  /** Open the drawer for a thread (writes `?thread=` to the URL). */
  onSelectThread: (threadId: string) => void;
  /** Close the drawer (clears `?thread=` from the URL). */
  onCloseThread: () => void;
}

export function ThreadsDataTable<TData, TValue>({
  columns,
  data,
  totalCount,
  pagination,
  onPaginationChange,
  isLoading = false,
  selectedThreadId,
  selectedThread,
  onSelectThread,
  onCloseThread,
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
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Spinner />
                    Loading threads…
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onSelectThread((row.original as Thread).id)}
                  className="cursor-pointer hover:bg-accent/50 data-[state=selected]:bg-accent"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === "last_message"
                          ? "max-w-[180px] truncate"
                          : ""
                      }
                    >
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
        open={Boolean(selectedThreadId)}
        setOpen={(open) => {
          if (!open) onCloseThread();
        }}
        threadId={selectedThreadId}
        thread={selectedThread}
      />
    </div>
  );
}
