"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  IconMessageCircle,
  IconBrandWhatsapp,
  IconMail,
  IconCheck,
} from "@tabler/icons-react";
import { OnboardingHeader } from "./onboarding-header";

const SNIPPET =
  '<script src="https://cdn.storesignal.ai/w.js" data-id="ws_mb_8f2a"></script>';

const CHANNELS = [
  {
    key: "widget",
    icon: IconMessageCircle,
    title: "Website widget",
    subtitle: "One-click install to your theme",
    status: "Ready",
    tone: "text-emerald-600",
    selected: true,
  },
  {
    key: "whatsapp",
    icon: IconBrandWhatsapp,
    title: "WhatsApp",
    subtitle: "Connect your business number",
    status: "Connected",
    tone: "text-emerald-600",
    selected: true,
  },
  {
    key: "helpdesk",
    icon: IconMail,
    title: "Helpdesk / Email",
    subtitle: "Freshdesk, Zendesk, Gorgias",
    status: "Connect",
    tone: "text-primary",
    selected: false,
  },
];

export function StepGoLive({ onFinish }: { onFinish: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SNIPPET);
      setCopied(true);
      toast.success("Snippet copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select and copy the snippet manually.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <OnboardingHeader
        label="Final step"
        title="Go live"
        time="3 min"
        description="Pick where your AI works, then start small. You'll turn it up as you watch it perform."
      />

      <div className="flex flex-col gap-3">
        <p className="font-semibold">Where should it work?</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.key}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border bg-card p-4",
                  c.selected && "border-primary/40 bg-primary/5",
                )}
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-sm text-muted-foreground">{c.subtitle}</p>
                </div>
                <span className={cn("text-sm font-medium", c.tone)}>
                  {c.status !== "Connect" && "● "}
                  {c.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div>
            <p className="font-semibold">Install the widget</p>
            <p className="text-sm text-muted-foreground">
              One click for Shopify, or paste this before{" "}
              <code>&lt;/body&gt;</code> on any platform.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-foreground p-4 text-xs text-background">
            <code>{SNIPPET}</code>
          </pre>
          <div className="flex flex-wrap gap-3">
            <Button>
              <IconCheck /> Auto-install to Shopify
            </Button>
            <Button variant="outline" onClick={copy}>
              {copied ? "Copied!" : "Copy snippet"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <p className="font-semibold">Start small</p>
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-600">
              Recommended
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Your AI will handle{" "}
            <span className="font-semibold text-foreground">
              10% of conversations
            </span>
            . The rest go to your team as normal. Turn it up as you watch it
            perform.
          </p>
          <input
            type="range"
            min={5}
            max={100}
            defaultValue={10}
            className="w-full accent-primary"
            aria-label="Share of conversations handled by AI"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5% — toe in the water</span>
            <span>50%</span>
            <span>100% — full auto</span>
          </div>
        </CardContent>
      </Card>

      <div>
        <Button size="lg" onClick={onFinish}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
