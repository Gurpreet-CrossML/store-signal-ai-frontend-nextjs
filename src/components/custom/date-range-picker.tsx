"use client";

import { useState } from "react";
import { format, isMatch, isSameDay, parse } from "date-fns";
import { IconCalendar } from "@tabler/icons-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  ACTIVE_FILTER_STYLE,
  API_DATE_FORMAT,
  DISPLAY_DATE_FORMAT,
} from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DISPLAY_DATE_TIME_FORMAT = `${DISPLAY_DATE_FORMAT} hh:mm a`;

const isDateOnly = (value: string) => isMatch(value, API_DATE_FORMAT);

const pad = (value: number) => String(value).padStart(2, "0");

// Parse an API_DATE_FORMAT value as a local date. `new Date("yyyy-MM-dd")`
// parses as UTC midnight, which renders as the previous day in
// negative-offset timezones.
const parseISODate = (value: string) =>
  parse(value, API_DATE_FORMAT, new Date());

function parseDateTimeValue(
  value: string,
  defaultTime: "start" | "end",
): Date | undefined {
  if (!value) return undefined;
  if (isDateOnly(value)) {
    // The start or end of that day in UTC.
    const day = parseISODate(value);
    const [year, month, date] = [
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
    ];
    return new Date(
      defaultTime === "start"
        ? Date.UTC(year, month, date)
        : Date.UTC(year, month, date, 23, 59, 59, 999),
    );
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toDateTimeLocalValue(value: string): string {
  if (!value) return "";
  if (isDateOnly(value)) {
    // The <input type="datetime-local"> value format, fixed by HTML.
    return format(parseISODate(value), "yyyy-MM-dd'T'HH:mm");
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
  className,
}: {
  from: string;
  to: string;
  // Single atomic callback: sequential from/to setters invite lost updates
  // when the caller derives both from one state object.
  onRangeChange: (from: string, to: string) => void;
  disabled?: React.ComponentProps<typeof Calendar>["disabled"];
  withTime?: boolean;
  className?: string;
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
      ? `${format(committed.from, DISPLAY_DATE_TIME_FORMAT)} – ${format(
          committed.to,
          DISPLAY_DATE_TIME_FORMAT,
        )}`
      : committed?.from
        ? `From ${format(committed.from, DISPLAY_DATE_TIME_FORMAT)}`
        : committed?.to
          ? `Until ${format(committed.to, DISPLAY_DATE_TIME_FORMAT)}`
          : "Pick A Date/Time Range"
    : committed?.from && committed?.to
      ? `${format(committed.from, DISPLAY_DATE_FORMAT)} – ${format(
          committed.to,
          DISPLAY_DATE_FORMAT,
        )}`
      : "Pick A Date Range";

  const maxDateTimeValue =
    disabled &&
    typeof disabled === "object" &&
    "after" in disabled &&
    disabled.after
      ? toDateTimeLocalValue(disabled.after.toISOString())
      : undefined;

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      // Reopening starts from what is applied, not an abandoned draft.
      setDraft(committed);
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

  // With `min={1}` on the calendar the first click leaves `to` unset, so a
  // draft with both ends is a complete range ready to apply.
  const canApply = !!draft?.from && !!draft?.to;

  // `min={1}` would clear the range on a second click of the start day;
  // make that a one-day range instead.
  const handleSelect = (range: DateRange | undefined, day: Date) => {
    if (!range && draft?.from && !draft.to && isSameDay(day, draft.from)) {
      setDraft({ from: day, to: day });
      return;
    }
    setDraft(range);
  };

  const handleApply = () => {
    if (!draft?.from || !draft?.to) return;
    onRangeChange(
      format(draft.from, API_DATE_FORMAT),
      format(draft.to, API_DATE_FORMAT),
    );
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn((from || to) && ACTIVE_FILTER_STYLE, className)}
        >
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
          <>
            <Calendar
              mode="range"
              numberOfMonths={2}
              min={1}
              defaultMonth={draft?.from ?? committed?.from}
              selected={draft}
              onSelect={handleSelect}
              disabled={disabled}
            />
            <div className="flex justify-end gap-2 border-t p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleApply} disabled={!canApply}>
                Apply
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
