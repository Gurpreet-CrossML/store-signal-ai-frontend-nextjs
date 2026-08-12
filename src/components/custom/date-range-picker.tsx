"use client";

import { useState } from "react";
import { format } from "date-fns";
import { IconCalendar } from "@tabler/icons-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (value: number) => String(value).padStart(2, "0");

// Parse "yyyy-MM-dd" as a local date. `new Date("yyyy-MM-dd")` parses as UTC
// midnight, which renders as the previous day in negative-offset timezones.
const parseISODate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

function parseDateTimeValue(
  value: string,
  defaultTime: "start" | "end",
): Date | undefined {
  if (!value) return undefined;
  if (DATE_ONLY_RE.test(value)) {
    return new Date(
      `${value}T${defaultTime === "start" ? "00:00:00.000Z" : "23:59:59.999Z"}`,
    );
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toDateTimeLocalValue(value: string): string {
  if (!value) return "";
  if (DATE_ONLY_RE.test(value)) {
    return `${value}T00:00`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDateTimeLocalValue(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function DateRangePicker({
  from,
  to,
  onRangeChange,
  disabled,
  withTime = false,
}: {
  from: string;
  to: string;
  // Single atomic callback: sequential from/to setters invite lost updates
  // when the caller derives both from one state object.
  onRangeChange: (from: string, to: string) => void;
  disabled?: React.ComponentProps<typeof Calendar>["disabled"];
  withTime?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();
  const [timeDraft, setTimeDraft] = useState<
    { from: string; to: string } | undefined
  >();

  const committed: DateRange | undefined = from
    ? {
        from: withTime ? parseDateTimeValue(from, "start") : parseISODate(from),
        to: to
          ? withTime
            ? parseDateTimeValue(to, "end")
            : parseISODate(to)
          : undefined,
      }
    : undefined;

  const label = withTime
    ? committed?.from && committed?.to
      ? `${format(committed.from, "MMM dd, yyyy hh:mm a")} – ${format(
          committed.to,
          "MMM dd, yyyy hh:mm a",
        )}`
      : committed?.from
        ? `From ${format(committed.from, "MMM dd, yyyy hh:mm a")}`
        : committed?.to
          ? `Until ${format(committed.to, "MMM dd, yyyy hh:mm a")}`
          : "Pick a date/time range"
    : committed?.from && committed?.to
      ? `${format(committed.from, "MMM dd, yyyy")} – ${format(
          committed.to,
          "MMM dd, yyyy",
        )}`
      : "Pick a date range";

  const maxDateTimeValue =
    disabled &&
    typeof disabled === "object" &&
    "after" in disabled &&
    disabled.after
      ? toDateTimeLocalValue(disabled.after.toISOString())
      : undefined;

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setTimeDraft({
        from: toDateTimeLocalValue(from),
        to: toDateTimeLocalValue(to),
      });
    }
    setOpen(nextOpen);
  };

  const handleDateTimeInputChange = (key: "from" | "to", value: string) => {
    const nextDraft = {
      from: timeDraft?.from ?? toDateTimeLocalValue(from),
      to: timeDraft?.to ?? toDateTimeLocalValue(to),
      [key]: value,
    };
    setTimeDraft(nextDraft);

    const parsedFrom = nextDraft.from
      ? parseDateTimeLocalValue(nextDraft.from)
      : undefined;
    const parsedTo = nextDraft.to
      ? parseDateTimeLocalValue(nextDraft.to)
      : undefined;

    if (
      (nextDraft.from === "" || parsedFrom) &&
      (nextDraft.to === "" || parsedTo)
    ) {
      onRangeChange(
        nextDraft.from === "" ? "" : (parsedFrom?.toISOString() ?? ""),
        nextDraft.to === "" ? "" : (parsedTo?.toISOString() ?? ""),
      );
    }
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
        {withTime ? (
          <div className="grid gap-3 p-4">
            <label className="grid gap-2 text-xs text-muted-foreground">
              From
              <Input
                type="datetime-local"
                value={timeDraft?.from ?? toDateTimeLocalValue(from)}
                onChange={(event) =>
                  handleDateTimeInputChange("from", event.target.value)
                }
                max={maxDateTimeValue}
              />
            </label>
            <label className="grid gap-2 text-xs text-muted-foreground">
              To
              <Input
                type="datetime-local"
                value={timeDraft?.to ?? toDateTimeLocalValue(to)}
                onChange={(event) =>
                  handleDateTimeInputChange("to", event.target.value)
                }
                max={maxDateTimeValue}
              />
            </label>
          </div>
        ) : (
          <Calendar
            mode="range"
            numberOfMonths={2}
            defaultMonth={draft?.from ?? committed?.from}
            selected={draft}
            onSelect={handleSelect}
            disabled={disabled}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
