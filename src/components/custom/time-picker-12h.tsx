"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Hour/minute/AM-PM selects that still store and emit plain 24-hour
 * "HH:MM" — the shape every start_time field on the backend expects —
 * so callers read and write exactly what they already do with a native
 * `<input type="time">`. Exists because that native input renders in
 * whatever format the OS locale picks (often 24-hour), with no way to
 * force 12-hour + AM/PM from HTML alone.
 */
export function TimePicker12h({
  value,
  onChange,
  disabled,
  idPrefix = "time",
}: {
  /** 24-hour "HH:MM". */
  value: string;
  /** Called with the new value in the same 24-hour "HH:MM" shape. */
  onChange: (value: string) => void;
  disabled?: boolean;
  idPrefix?: string;
}) {
  const [hourStr, minuteStr] = value.split(":");
  const hour24 = Number(hourStr) || 0;
  const minute = Number(minuteStr) || 0;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";

  const emit = (
    nextHour12: number,
    nextMinute: number,
    nextPeriod: "AM" | "PM",
  ) => {
    const nextHour24 = (nextHour12 % 12) + (nextPeriod === "PM" ? 12 : 0);
    onChange(`${pad(nextHour24)}:${pad(nextMinute)}`);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={String(hour12)}
        onValueChange={(v) => emit(Number(v), minute, period)}
        disabled={disabled}
      >
        <SelectTrigger
          id={`${idPrefix}-hour`}
          className="w-[68px]"
          aria-label="Hour"
        >
          <SelectValue />
        </SelectTrigger>
        {/* position="popper": the default "item-aligned" mode positions
            the panel by aligning the selected item with the trigger, which
            falls apart once a custom maxHeight caps a 60-item list — the
            panel ends up floating far from the trigger. "popper" anchors
            it as a normal dropdown instead.
            The inline style (not a max-h-* class) is needed because
            SelectContent's own base class already sets max-height via a
            CSS variable, and Tailwind's class-merging doesn't reliably
            treat that as the same "slot" as a plain max-h-64 — the
            override was silently lost. Inline style always wins. */}
        <SelectContent position="popper" style={{ maxHeight: "16rem" }}>
          {HOURS.map((h) => (
            <SelectItem key={h} value={String(h)}>
              {pad(h)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select
        value={String(minute)}
        onValueChange={(v) => emit(hour12, Number(v), period)}
        disabled={disabled}
      >
        <SelectTrigger
          id={`${idPrefix}-minute`}
          className="w-[68px]"
          aria-label="Minute"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent style={{ maxHeight: "16rem" }}>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={String(m)}>
              {pad(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={period}
        onValueChange={(v) => emit(hour12, minute, v as "AM" | "PM")}
        disabled={disabled}
      >
        <SelectTrigger
          id={`${idPrefix}-period`}
          className="w-[74px]"
          aria-label="AM or PM"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
