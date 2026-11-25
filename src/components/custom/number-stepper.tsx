"use client";

import { IconMinus, IconPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sanitizeWholeNumber } from "@/lib/sla";
import { cn } from "@/lib/utils";

/**
 * A whole-number box with − and + buttons (and the up / down arrow keys).
 *
 * Only a positive whole number can be entered: letters, a minus sign, a
 * decimal point and zero are dropped as they are typed or pasted, and the
 * value never goes above `max`. The value is text, so an empty box means
 * "not set". The − button stops at 1, unless the field is `clearable`: then
 * stepping down from 1 empties the box, which is how an optional value is
 * unset.
 */
export function NumberStepper({
  id,
  value,
  onChange,
  onBlur,
  max,
  label,
  placeholder,
  invalid,
  disabled,
  clearable = false,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** The most the box accepts. */
  max: number;
  /** What the box is for, read out by screen readers. */
  label: string;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Stepping down from 1 empties the box (an optional value, "not set"). */
  clearable?: boolean;
  className?: string;
}) {
  const current = Number(value) || 0;
  const canStepDown = clearable ? current >= 1 : current > 1;

  const step = (delta: number) => {
    // Down from 1 clears an optional box; it cannot go below 1 otherwise.
    if (delta < 0 && current <= 1) {
      if (clearable) onChange("");
      return;
    }
    // Stepping up from an empty box starts at 1.
    const next = Math.min(Math.max(current + delta, 1), max);
    onChange(String(next));
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 shrink-0"
        onClick={() => step(-1)}
        disabled={disabled || !canStepDown}
        aria-label={`Decrease ${label}`}
      >
        <IconMinus className="size-4" />
      </Button>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        role="spinbutton"
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={max}
        aria-valuenow={current || undefined}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(sanitizeWholeNumber(event.target.value, max))
        }
        onBlur={onBlur}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            step(1);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            if (canStepDown) step(-1);
          }
        }}
        className="w-16 px-1 text-center"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 shrink-0"
        onClick={() => step(1)}
        disabled={disabled || current >= max}
        aria-label={`Increase ${label}`}
      >
        <IconPlus className="size-4" />
      </Button>
    </div>
  );
}
