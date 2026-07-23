import { IconChevronDown } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FieldBox, ToggleLine, SettingsCard } from "../ticketing-settings";

const businessHours = [
  ["Monday", "9:00 AM", "6:00 PM", true],
  ["Tuesday", "9:00 AM", "6:00 PM", true],
  ["Wednesday", "9:00 AM", "6:00 PM", true],
  ["Thursday", "9:00 AM", "6:00 PM", true],
  ["Friday", "9:00 AM", "5:00 PM", true],
  ["Saturday", "10:00 AM", "2:00 PM", true],
  ["Sunday", "Closed - AI covers", "", false],
] as const;

export function BusinessHoursSection() {
  return (
    <div className="space-y-4">
      <SettingsCard
        title="Support hours"
        action={
          <Button variant="outline" className="bg-white">
            Europe/Dublin (GMT) <IconChevronDown className="size-4" />
          </Button>
        }
      >
        <div className="p-5">
          {businessHours.map(([day, start, end, enabled]) => (
            <div
              key={day}
              className="grid grid-cols-[110px_1fr_auto] items-center gap-4 border-b py-3 last:border-b-0"
            >
              <div className="font-bold text-slate-950">{day}</div>
              {enabled ? (
                <div className="flex flex-wrap items-center gap-2">
                  <FieldBox className="w-28">{start}</FieldBox>
                  <span className="text-slate-500">to</span>
                  <FieldBox className="w-28">{end}</FieldBox>
                </div>
              ) : (
                <div className="text-sm font-medium text-slate-500">
                  {start}
                </div>
              )}
              <Switch defaultChecked={enabled} />
            </div>
          ))}
        </div>
      </SettingsCard>
      <SettingsCard title="Out-of-hours routing">
        <div className="p-5">
          <ToggleLine
            title="Let AI handle everything out of hours"
            detail="24/7 coverage - the AI resolves what it can, queues the rest for morning"
          />
          <ToggleLine
            title="Show customers your reply time"
            detail='"Our team is back at 9am - I can still help right now"'
            last
          />
        </div>
      </SettingsCard>
    </div>
  );
}
