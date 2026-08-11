import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

/**
 * The title and one-line description at the top of a page.
 *
 * The single source for that block — every screen renders it through this,
 * so the heading level, spacing and muted description can't drift apart
 * between pages. `action` holds anything that belongs on the same line as
 * the title, such as a filter or a primary button; it drops below the text
 * on narrow screens instead of squeezing it.
 */
export function PageHeading({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <Typography variant="h4" as="h2">
          {title}
        </Typography>
        {description && <Typography variant="muted">{description}</Typography>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
