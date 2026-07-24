import { IconClock, IconStar } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { ToggleLine, SettingsCard, InfoCallout } from "../ticketing-settings";
import { cn } from "@/lib/utils";

export function SlaPoliciesSection() {
  const policies = [
    [
      "VIP",
      "Applies when: customer is VIP or LTV > EUR1,000",
      "15m first response - 2h resolution",
      "red",
    ],
    [
      "Urgent / Complaint",
      "Applies when: priority Urgent or tag Complaint",
      "30m first response - 4h resolution",
      "orange",
    ],
    [
      "Standard",
      "Applies when: everything else",
      "4h first response - 24h resolution",
      "indigo",
    ],
  ];

  return (
    <div className="space-y-4">
      <InfoCallout tone="amber" icon="warning">
        <b>The detail that makes SLAs honest:</b> timers PAUSE on
        &quot;Pending&quot; (waiting on customer) and &quot;Snoozed&quot;, and
        resume when they reply. Never count customer-wait time against your
        target.
      </InfoCallout>
      <SettingsCard
        title="Policies"
        action={
          <Button variant="outline" size="sm" className="bg-white">
            + New policy
          </Button>
        }
      >
        <div className="space-y-3 p-5">
          {policies.map(([name, detail, target, color]) => (
            <div
              key={name}
              className="flex items-center gap-4 rounded-lg border px-4 py-3"
            >
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  color === "red" && "bg-red-50 text-red-500",
                  color === "orange" && "bg-orange-50 text-orange-500",
                  color === "indigo" && "bg-indigo-50 text-indigo-600",
                )}
              >
                {color === "red" ? (
                  <IconStar className="size-5" />
                ) : (
                  <IconClock className="size-5" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-950">{name}</div>
                <div className="text-xs font-medium text-slate-500">
                  {detail}
                </div>
              </div>
              <div className="text-sm font-bold text-slate-950">{target}</div>
            </div>
          ))}
        </div>
      </SettingsCard>
      <SettingsCard title="Pausing & escalation">
        <div className="p-5">
          <ToggleLine
            title='Pause on "Waiting on customer"'
            detail="Stops the clock while the ball is in the customer's court"
          />
          <ToggleLine title='Pause on "Snoozed"' />
          <ToggleLine
            title="Measure against business hours only"
            detail="Do not count nights and weekends against targets"
          />
          <ToggleLine
            title="Escalate at 80% of target"
            detail="Raise priority, reassign to a lead, and notify - before the breach, not after"
            last
          />
        </div>
      </SettingsCard>
    </div>
  );
}
