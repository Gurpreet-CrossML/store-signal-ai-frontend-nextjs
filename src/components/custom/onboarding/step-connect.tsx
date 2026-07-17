"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { IconLock, IconArrowRight } from "@tabler/icons-react";
import { SHOPIFY_PERMISSION_GROUPS, scopeAccess } from "@/lib/onboarding";
import { OnboardingHeader } from "./onboarding-header";

function PlatformCard({
  selected,
  disabled,
  title,
  subtitle,
  onSelect,
}: {
  selected: boolean;
  disabled?: boolean;
  title: string;
  subtitle: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "hover:border-muted-foreground/30",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary" : "border-muted-foreground/40",
        )}
      >
        {selected && <span className="size-2 rounded-full bg-primary" />}
      </span>
      <span className="flex flex-col">
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}

function ScopeRow({ scope }: { scope: string }) {
  const access = scopeAccess(scope);
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <code className="text-xs text-muted-foreground">{scope}</code>
      <Badge
        className={cn(
          "shrink-0 capitalize",
          access === "write"
            ? "border-amber-200 bg-amber-50 text-amber-600"
            : "border-primary/20 bg-primary/10 text-primary",
        )}
      >
        {access}
      </Badge>
    </div>
  );
}

export function StepConnect({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <OnboardingHeader
        label="Step 1 of 4"
        title="Connect your store"
        time="60 sec"
        description="The only technical step — and it's one click. We start learning your store immediately in the background."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <PlatformCard
          selected
          title="Shopify"
          subtitle="Connect via secure OAuth"
          onSelect={() => {}}
        />
        <PlatformCard
          selected={false}
          disabled
          title="Magento 2"
          subtitle="Connect via admin OAuth · coming soon"
          onSelect={() => {}}
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-1">
          <div className="mb-2">
            <p className="font-semibold">What we&apos;ll access, and why</p>
            <p className="text-sm text-muted-foreground">
              We request the minimum needed. Here is every permission we ask
              for, grouped so you know exactly what you&apos;re granting.
            </p>
          </div>
          <Accordion
            type="single"
            collapsible
            defaultValue={SHOPIFY_PERMISSION_GROUPS[0].key}
          >
            {SHOPIFY_PERMISSION_GROUPS.map((group) => {
              const Icon = group.icon;
              return (
                <AccordionItem key={group.key} value={group.key}>
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      {group.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="divide-y divide-dashed">
                      {group.scopes.map((scope) => (
                        <ScopeRow key={scope} scope={scope} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button onClick={onNext}>
          Continue <IconArrowRight />
        </Button>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <IconLock className="size-3.5" /> You can revoke access anytime
        </span>
      </div>
    </div>
  );
}
