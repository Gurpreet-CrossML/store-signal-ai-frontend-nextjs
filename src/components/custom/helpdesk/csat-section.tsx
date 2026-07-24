import { IconChevronDown } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { ToggleLine, SettingsCard, InfoCallout } from "../ticketing-settings";
import { cn } from "@/lib/utils";

export function CsatSection() {
  return (
    <div className="space-y-4">
      <SettingsCard title="Survey settings">
        <div className="p-5">
          <ToggleLine title="Send CSAT survey on resolve" />
          <ToggleLine
            title="Also survey AI-resolved tickets"
            detail="Measure the AI's quality the same way you measure agents"
          />
          <div className="flex items-center border-b py-4">
            <div className="flex-1 font-bold text-slate-950">
              Channels to survey
            </div>
            <div className="text-sm font-medium text-slate-700">
              Email, Web chat, WhatsApp
            </div>
          </div>
          <div className="flex items-center py-4">
            <div className="flex-1 font-bold text-slate-950">
              Survey delay after resolve
            </div>
            <Button variant="outline" className="bg-white">
              After 10 minutes <IconChevronDown className="size-4" />
            </Button>
          </div>
        </div>
      </SettingsCard>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["4.6", "Avg CSAT (30d)", "text-emerald-600"],
          ["92%", "Positive (4-5 star)", "text-indigo-600"],
          ["4.5", "AI-resolved CSAT", "text-teal-600"],
        ].map(([value, label, color]) => (
          <div
            key={label}
            className="rounded-lg border bg-white p-6 text-center shadow-xs"
          >
            <div className={cn("text-3xl font-black", color)}>{value}</div>
            <div className="mt-2 text-xs font-bold text-slate-500">{label}</div>
          </div>
        ))}
      </div>
      <InfoCallout>
        Full CSAT breakdowns by agent, workflow, and channel live in the
        Analytics & Intent Insights module - this feeds it directly.
      </InfoCallout>
    </div>
  );
}
