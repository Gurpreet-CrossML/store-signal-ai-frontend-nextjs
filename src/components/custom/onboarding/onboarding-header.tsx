import { Badge } from "@/components/ui/badge";
import { IconClock } from "@tabler/icons-react";

/**
 * The step header shared by every onboarding page: a small uppercase step
 * label, the title with an optional time-estimate pill, and a description.
 */
export function OnboardingHeader({
  label,
  title,
  time,
  description,
}: {
  label: string;
  title: string;
  time?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold tracking-widest text-primary uppercase">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {time && (
          <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-600">
            <IconClock className="size-3" />
            {time}
          </Badge>
        )}
      </div>
      {description && (
        <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
