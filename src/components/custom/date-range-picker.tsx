"use client";

import { useState } from "react";
import { format } from "date-fns";
import { IconCalendar } from "@tabler/icons-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Parse "yyyy-MM-dd" as a local date. `new Date("yyyy-MM-dd")` parses as UTC
// midnight, which renders as the previous day in negative-offset timezones.
const parseISODate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export function DateRangePicker({
  from,
  to,
  onRangeChange,
  disabled,
}: {
  from: string;
  to: string;
  // Single atomic callback: sequential from/to setters invite lost updates
  // when the caller derives both from one state object.
  onRangeChange: (from: string, to: string) => void;
  disabled?: React.ComponentProps<typeof Calendar>["disabled"];
}) {
  const [open, setOpen] = useState(false);
  // The in-progress selection. Committed to the parent (and refetched) only
  // once both ends are picked; discarded if the popover closes early.
  const [draft, setDraft] = useState<DateRange | undefined>();

  const committed: DateRange | undefined = from
    ? { from: parseISODate(from), to: to ? parseISODate(to) : undefined }
    : undefined;

  const label =
    committed?.from && committed?.to
      ? `${format(committed.from, "MMM dd, yyyy")} – ${format(committed.to, "MMM dd, yyyy")}`
      : "Pick a date range";

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setDraft(committed);
    setOpen(nextOpen);
  };

  const handleSelect = (range: DateRange | undefined) => {
    setDraft(range);
    // First click yields {from: day, to: day}; treat that as "start picked,
    // still choosing the end". Commit and close only on a completed range.
    if (
      range?.from &&
      range?.to &&
      range.to.getTime() !== range.from.getTime()
    ) {
      onRangeChange(
        format(range.from, "yyyy-MM-dd"),
        format(range.to, "yyyy-MM-dd"),
      );
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <IconCalendar />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          numberOfMonths={2}
          defaultMonth={draft?.from ?? committed?.from}
          selected={draft}
          onSelect={handleSelect}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}
