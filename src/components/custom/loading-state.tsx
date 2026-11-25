import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

/**
 * The single loading state for pages and card sections. One spinner size, one
 * text style, one spacing — so loading looks identical across the app.
 */
export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-center gap-2 py-10", className)}
    >
      <Spinner className="size-5" />
      <Typography variant="muted" as="span">
        {label}
      </Typography>
    </div>
  );
}
