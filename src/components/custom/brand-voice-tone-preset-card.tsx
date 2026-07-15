"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type Icon } from "@tabler/icons-react";

type BrandVoiceTonePresetCardProps = {
  title: string;
  description: string;
  icon: Icon;
  active: boolean;
  onClick: () => void;
};

export default function BrandVoiceTonePresetCard({
  title,
  description,
  icon: Icon,
  active,
  onClick,
}: BrandVoiceTonePresetCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left"
      aria-pressed={active}
    >
      <Card
        size="sm"
        className={cn(
          "h-full border-border/70 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm",
          active && "border-primary bg-primary/5 ring-1 ring-primary/15",
        )}
      >
        <div className="flex h-full flex-col gap-3 px-4 py-4">
          <div className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground">
            <Icon className="size-4" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-medium leading-tight">{title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </Card>
    </button>
  );
}
