"use client";

import type { Table } from "@tanstack/react-table";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalCount: number;
  noun?: string;
  /**
   * On a phone, lay the bar out in two rows instead of stacking every part:
   * the total and the rows-per-page picker, then previous, the page
   * indicator and next. Other screens keep the stacked layout.
   */
  compactOnMobile?: boolean;
}

export function DataTablePagination<TData>({
  table,
  totalCount,
  noun = "thread",
  compactOnMobile = false,
}: DataTablePaginationProps<TData>) {
  // TanStack hands back the same `table` object on every render and changes
  // its state in place, so the React Compiler would cache what is read from
  // it and keep showing the old page. Opt out so it is read on each render.
  "use no memo";

  // Read the table's own state rather than a copy: a screen can move the
  // page itself (a filter resets it to page 1), and a copy only follows this
  // bar's buttons, so it would keep showing the old page.
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();

  const handlePageSizeChange = (newPageSize: number) => {
    table.setPageSize(newPageSize);
  };

  const handlePageIndexChange = (newPageIndex: number) => {
    table.setPageIndex(newPageIndex);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 px-2 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        // Three columns, the outer two equal so the page indicator sits in the
        // true centre: previous | page indicator | next, with the buttons
        // pulled in against the indicator. The total is in the first column
        // on the top row, the page-size picker over the other two.
        compactOnMobile &&
          "max-sm:grid max-sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] max-sm:items-center max-sm:gap-x-2 max-sm:gap-y-3 max-sm:px-0",
      )}
    >
      <div
        className={cn(
          "text-sm whitespace-nowrap text-muted-foreground",
          // Wraps rather than running under the page-size picker on a narrow phone.
          compactOnMobile && "max-sm:whitespace-normal",
        )}
      >
        {totalCount} {totalCount === 1 ? noun : `${noun}s`} total
      </div>

      {/* In the compact layout this wrapper (and the nav one below) vanish,
          so the pieces inside take part in the grid above directly. */}
      <div
        className={cn(
          "flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3",
          compactOnMobile && "max-sm:contents",
        )}
      >
        {/* Page size selector */}
        <div
          className={cn(
            "flex items-center gap-2",
            compactOnMobile &&
              "max-sm:col-span-2 max-sm:col-start-2 max-sm:row-start-1 max-sm:justify-self-end",
          )}
        >
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
        <div
          className={cn(
            "flex items-center justify-center text-sm font-medium whitespace-nowrap",
            compactOnMobile &&
              "max-sm:col-start-2 max-sm:row-start-2 max-sm:px-2",
          )}
        >
          Page {pageIndex + 1} of {pageCount || 1}
        </div>

        {/* Navigation */}
        <div
          className={cn(
            "flex items-center gap-2",
            compactOnMobile && "max-sm:contents",
          )}
        >
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
            className={cn(
              "h-8 w-8",
              compactOnMobile &&
                "max-sm:col-start-1 max-sm:row-start-2 max-sm:justify-self-end",
            )}
            onClick={() => handlePageIndexChange(pageIndex - 1)}
            disabled={pageIndex === 0}
            aria-label="Go to previous page"
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-8 w-8",
              compactOnMobile &&
                "max-sm:col-start-3 max-sm:row-start-2 max-sm:justify-self-start",
            )}
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
