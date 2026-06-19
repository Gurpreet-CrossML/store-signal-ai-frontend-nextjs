import {
  IconCircleCheck,
  IconCircleX,
  IconSearch,
  IconTicket,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export type TicketFilterState = {
  search: string;
  status: "" | "open" | "pending" | "resolved" | "closed";
  priority: "" | "low" | "normal" | "high" | "urgent";
  platform: "" | "freshdesk" | "zendesk";
};

export const DEFAULT_TICKET_FILTERS: TicketFilterState = {
  search: "",
  status: "",
  priority: "",
  platform: "",
};

type TicketFilterationProps = {
  filters: TicketFilterState;
  onChange: (filters: TicketFilterState) => void;
  onClear: () => void;
};

function FilterChip({
  active,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      className="rounded-full"
      aria-pressed={active}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}

export default function TicketFilteration({
  filters,
  onChange,
  onClear,
}: TicketFilterationProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "" ||
    filters.priority !== "" ||
    filters.platform !== "";

  const toggleStatus = (value: TicketFilterState["status"]) =>
    onChange({
      ...filters,
      status: filters.status === value ? "" : value,
    });

  const togglePriority = (value: TicketFilterState["priority"]) =>
    onChange({
      ...filters,
      priority: filters.priority === value ? "" : value,
    });

  const togglePlatform = (value: TicketFilterState["platform"]) =>
    onChange({
      ...filters,
      platform: filters.platform === value ? "" : value,
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          placeholder="Search ticket id, subject, thread id…"
          className="pl-8"
        />
      </div>

      <Separator orientation="vertical" className="h-5" />

      <FilterChip
        active={filters.status === "open"}
        icon={<IconCircleCheck />}
        label="Open"
        onClick={() => toggleStatus("open")}
      />
      <FilterChip
        active={filters.status === "pending"}
        icon={<IconTicket />}
        label="Pending"
        onClick={() => toggleStatus("pending")}
      />
      <FilterChip
        active={filters.status === "resolved" || filters.status === "closed"}
        icon={<IconCircleX />}
        label="Closed"
        onClick={() => toggleStatus("resolved")}
      />

      <Separator orientation="vertical" className="h-5" />

      <FilterChip
        active={filters.priority === "low"}
        label="Low"
        onClick={() => togglePriority("low")}
      />
      <FilterChip
        active={filters.priority === "normal"}
        label="Normal"
        onClick={() => togglePriority("normal")}
      />
      <FilterChip
        active={filters.priority === "high"}
        label="High"
        onClick={() => togglePriority("high")}
      />
      <FilterChip
        active={filters.priority === "urgent"}
        label="Urgent"
        onClick={() => togglePriority("urgent")}
      />

      <Separator orientation="vertical" className="h-5" />

      <FilterChip
        active={filters.platform === "freshdesk"}
        label="Freshdesk"
        onClick={() => togglePlatform("freshdesk")}
      />
      <FilterChip
        active={filters.platform === "zendesk"}
        label="Zendesk"
        onClick={() => togglePlatform("zendesk")}
      />

      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onClear}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
