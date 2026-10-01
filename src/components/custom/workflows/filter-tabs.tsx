import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A row of mutually exclusive filters with a count on each — the status
 * filter on the Workflows page and the kind filter in the Tools panel.
 */
export function FilterTabs<Value extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: Value; label: string; count: number }[];
  value: Value;
  onChange: (value: Value) => void;
  /** Accessible name of the group, e.g. "Filter by status". */
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex flex-wrap gap-1 rounded-lg bg-muted p-1", className)}
    >
      {options.map((option) => (
        <Button
          key={option.value}
          variant="ghost"
          size="xs"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "gap-1.5 px-2.5",
            value === option.value &&
              "bg-background shadow-xs hover:bg-background",
          )}
        >
          {option.label}
          <span className="text-muted-foreground tabular-nums">
            {option.count}
          </span>
        </Button>
      ))}
    </div>
  );
}
