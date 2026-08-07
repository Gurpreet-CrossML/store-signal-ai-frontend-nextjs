"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Column } from "@tanstack/react-table";
import {
  IconAlertCircle,
  IconArrowsUpDown,
  IconCircleCheck,
  IconClock,
  IconFileTypeDocx,
  IconFileTypePdf,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Spinner } from "@/components/ui/spinner";
import type {
  StoreDocument,
  StoreDocumentStatus,
} from "@/redux/api-slice/knowledge-slice";

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function formatDocumentType(type: string): string {
  if (type.includes("pdf")) return "PDF";
  if (type.includes("word") || type.includes("msword")) return "DOCX";
  return "FILE";
}

/** Column header that toggles ascending/descending sort on click. */
function SortableHeader<TData>({
  column,
  children,
}: {
  column: Column<TData, unknown>;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 gap-1 font-medium"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      <IconArrowsUpDown className="size-3.5 text-muted-foreground" />
    </Button>
  );
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

const STATUS_CONFIG: Record<
  StoreDocumentStatus,
  {
    label: string;
    icon: React.ReactNode;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  pending: {
    label: "Pending",
    icon: <IconClock className="size-3.5" />,
    variant: "outline",
  },
  "in-progress": {
    label: "In Progress",
    icon: <Spinner className="size-3.5" />,
    variant: "secondary",
  },
  completed: {
    label: "Completed",
    icon: <IconCircleCheck className="size-3.5" />,
    variant: "default",
  },
  failed: {
    label: "Failed",
    icon: <IconAlertCircle className="size-3.5" />,
    variant: "destructive",
  },
};

export const storeDocumentColumns: ColumnDef<StoreDocument>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>Name</SortableHeader>
    ),
    cell: ({ row }) => {
      const doc = row.original;
      const isPdf = doc.type.includes("pdf");
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {isPdf ? (
              <IconFileTypePdf className="size-4 shrink-0 text-destructive" />
            ) : (
              <IconFileTypeDocx className="size-4 shrink-0 text-primary" />
            )}
            <Typography variant="small" as="span" className="max-w-xs truncate">
              {doc.name}
            </Typography>
          </div>
          {doc.status === "failed" && doc.error && (
            <p
              className="ml-6 max-w-sm truncate text-xs text-destructive"
              title={doc.error}
            >
              {doc.error}
            </p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "size",
    header: ({ column }) => (
      <SortableHeader column={column}>Size</SortableHeader>
    ),
    cell: ({ row }) => (
      <Typography variant="muted" as="span" className="tabular-nums">
        {formatBytes(row.original.size)}
      </Typography>
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <SortableHeader column={column}>Type</SortableHeader>
    ),
    cell: ({ row }) => (
      <Typography
        variant="muted"
        as="span"
        className="text-xs font-semibold tracking-wide"
      >
        {formatDocumentType(row.original.type)}
      </Typography>
    ),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <SortableHeader column={column}>Uploaded</SortableHeader>
    ),
    cell: ({ row }) => (
      <Typography variant="muted" as="span" className="whitespace-nowrap">
        {formatDateTime(row.original.created_at)}
      </Typography>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader column={column}>Status</SortableHeader>
    ),
    cell: ({ row }) => {
      const config = STATUS_CONFIG[row.original.status];
      if (!config) return <span className="text-muted-foreground">—</span>;
      return (
        <Badge variant={config.variant} className="gap-1 font-normal">
          {config.icon}
          {config.label}
        </Badge>
      );
    },
  },
];
