"use client";

import type { Table } from "@tanstack/react-table";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export const PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 50];

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalCount: number;
  noun?: string;
}

export function DataTablePagination<TData>({
  table,
  totalCount,
  noun = "thread",
}: DataTablePaginationProps<TData>) {
  const [{ pageIndex, pageSize }, setPagination] = useState(
    table.getState().pagination,
  );
  const pageCount = table.getPageCount();

  const handlePageSizeChange = (newPageSize: number) => {
    table.setPageSize(newPageSize);
    setPagination((prev) => ({ ...prev, pageSize: newPageSize }));
  };

  const handlePageIndexChange = (newPageIndex: number) => {
    table.setPageIndex(newPageIndex);
    setPagination((prev) => ({ ...prev, pageIndex: newPageIndex }));
  };

  return (
    <div className="flex flex-col gap-4 px-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {totalCount} {totalCount === 1 ? noun : `${noun}s`} total
      </div>

      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium whitespace-nowrap">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => handlePageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-18">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page indicator */}
        <div className="flex items-center justify-center text-sm font-medium whitespace-nowrap">
          Page {pageIndex + 1} of {pageCount || 1}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden h-8 w-8 lg:flex"
            onClick={() => handlePageIndexChange(0)}
            disabled={pageIndex === 0}
            aria-label="Go to first page"
          >
            <IconChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageIndexChange(pageIndex - 1)}
            disabled={pageIndex === 0}
            aria-label="Go to previous page"
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageIndexChange(pageIndex + 1)}
            disabled={pageIndex === pageCount - 1}
            aria-label="Go to next page"
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden h-8 w-8 lg:flex"
            onClick={() => handlePageIndexChange(pageCount - 1)}
            disabled={pageIndex === pageCount - 1}
            aria-label="Go to last page"
          >
            <IconChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
