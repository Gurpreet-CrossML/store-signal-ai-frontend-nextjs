"use client";

import { useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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

/**
 * Set widths, with Status taking what is left. Without them one long name
 * stretched Member and pushed Role, Status and the menu off the screen.
 */
const COLUMN_WIDTHS: Record<string, string> = {
  member: "w-[42%]",
  role: "w-[22%]",
  actions: "w-14",
};

interface StaffDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  /** One member as a card, for phones, where the table does not fit. */
  renderCard: (row: TData) => React.ReactNode;
}

export function StaffDataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  renderCard,
}: StaffDataTableProps<TData, TValue>) {
  // Name, A to Z until the header is clicked.
  const [sorting, setSorting] = useState<SortingState>([
    { id: "member", desc: false },
  ]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });
  const rows = table.getRowModel().rows;

  const message = isLoading ? (
    <div className="flex items-center justify-center gap-2 text-muted-foreground">
      <Spinner />
      Loading staff…
    </div>
  ) : rows.length ? null : (
    <p className="text-center text-muted-foreground">
      No staff yet. Add your first staff user above.
    </p>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border/50">
      {/* Phones: one card per member. */}
      <div className="divide-y md:hidden">
        {message ? (
          <div className="px-4 py-8 text-sm">{message}</div>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="px-4 py-3">
              {renderCard(row.original)}
            </div>
          ))
        )}
      </div>

      {/* Tablet and up: the table. */}
      <Table className="hidden table-fixed md:table">
        <TableHeader className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={`h-10 px-4 text-xs font-medium text-muted-foreground ${COLUMN_WIDTHS[header.column.id] ?? ""}`}
                >
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
          {message ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-sm">
                {message}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {data.length > 0 && (
        <div className="border-t px-2">
          <DataTablePagination
            table={table}
            totalCount={data.length}
            noun="member"
            compactOnMobile
          />
        </div>
      )}
    </div>
  );
}
