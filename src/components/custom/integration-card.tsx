import type { KeyboardEvent } from "react";
import { IconArrowRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Integration } from "@/lib/integration-types";
import { getIntegrationLogoUrl } from "@/lib/integration-logo";

function categoryStyles(category: string) {
  return category === "chat"
    ? "border-violet-500/30 bg-violet-500/15 text-violet-700 dark:text-violet-300"
    : "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300";
}

export function LogoMark({ integration }: { integration: Integration }) {
  const logoUrl = getIntegrationLogoUrl(integration.logo);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${integration.name} logo`}
        className="size-11 rounded-lg bg-background object-contain p-1 ring-1 ring-border/60"
      />
    );
  }

  return (
    <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-foreground ring-1 ring-border/60">
      {integration.name.slice(0, 1).toUpperCase()}
    </div>
  );
}

interface IntegrationCardProps {
  integration: Integration;
  checked: boolean;
  saved: boolean;
  onToggle: (checked: boolean) => void;
  onOpenPanel: () => void;
}

export function IntegrationCard({
  integration,
  checked,
  saved,
  onToggle,
  onOpenPanel,
}: IntegrationCardProps) {
  return (
    <Card
      size="sm"
      role="button"
      tabIndex={0}
      onClick={onOpenPanel}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenPanel();
        }
      }}
      className="gap-5 border-border/60 bg-card/80 shadow-none transition-transform duration-150 hover:-translate-y-0.5 hover:border-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <CardHeader className="gap-4 pb-0">
        <div className="flex items-start gap-3">
          <LogoMark integration={integration} />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="truncate text-base">
                {integration.name}
              </CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  "min-w-24 shrink-0 justify-center px-3 py-1 text-[11px] font-semibold capitalize tracking-wide",
                  categoryStyles(integration.category?.category || ""),
                )}
                title={integration.category_label}
              >
                {integration.category_label || "uncategorized"}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2 text-sm">
              {integration.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{saved ? "Enabled" : "Not enabled yet"}</span>
          <span>{integration.is_active ? "Active" : "Inactive"}</span>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
          <div className="uppercase tracking-wide">Scope</div>
          <div className="mt-1 line-clamp-2 text-foreground">
            {integration.scope
              ? Array.isArray(integration.scope)
                ? integration.scope.join(", ")
                : integration.scope
                    .split(",")
                    .map((s) => s.trim())
                    .join(", ")
              : "No scope details provided."}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onOpenPanel();
          }}
        >
          Configure
          <IconArrowRight />
        </Button>
        <div
          className="flex items-center space-x-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Switch
            id={`enable-${integration.id}`}
            checked={checked}
            onCheckedChange={onToggle}
            aria-label={`Enable ${integration.name}`}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
