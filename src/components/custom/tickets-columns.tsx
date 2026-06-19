import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { Ticket } from "@/redux/api-slice/ticket-slice";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusVariant(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "open") return "default";
  if (normalized === "pending") return "secondary";
  if (normalized === "resolved" || normalized === "closed") return "outline";
  return "secondary";
}

function getPriorityVariant(priority: string) {
  const normalized = priority.toLowerCase();
  if (normalized === "high") return "destructive";
  if (normalized === "medium" || normalized === "normal") return "default";
  if (normalized === "low") return "secondary";
  return "secondary";
}

export const ticketsColumns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "ticket_id",
    header: "Ticket",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground" title={`${row.original.ticket_id}`}>
        TCK-{row.original.ticket_id}
      </span>
    ),
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <div className="max-w-[260px] truncate text-sm text-foreground" title={row.original.subject}>
        {row.original.subject || "—"}
      </div>
    ),
  },
  {
    accessorKey: "platform",
    header: "Platform",
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-normal">
        {row.original.platform || "—"}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={getStatusVariant(row.original.status)} className="font-normal">
        {row.original.status || "Unknown"}
      </Badge>
    ),
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <Badge variant={getPriorityVariant(row.original.priority)} className="font-normal">
        {row.original.priority || "N/A"}
      </Badge>
    ),
  },
  {
    accessorKey: "thread",
    header: "Thread",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground" title={row.original.thread}>
        {row.original.thread}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDateTime(row.original.created_at)}
      </span>
    ),
  },
  {
    accessorKey: "updated_at",
    header: "Updated",
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDateTime(row.original.updated_at)}
      </span>
    ),
  },
];
