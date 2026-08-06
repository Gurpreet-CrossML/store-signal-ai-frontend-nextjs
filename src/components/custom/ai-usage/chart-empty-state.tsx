/** Displays a consistent fallback when an AI usage chart has no data. */
export default function ChartEmptyState() {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
      No usage data for the selected filters
    </div>
  );
}
