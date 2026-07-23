import type { ReactNode } from "react";
import { IconChevronDown } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  TableShell,
  FieldBox,
  SettingsCard,
  InfoCallout,
} from "../ticketing-settings";
import { cn } from "@/lib/utils";

const rules = [
  ["Auto-route returns to Returns team", "Ticket created", "1,240"],
  ["Send tracking + close for WISMO", "Ticket created", "3,180"],
  ["Auto-close thank-you messages", "Message received", "890"],
  ["Escalate negative sentiment", "Message received", "142"],
  ["Follow up non-responders (48h)", "Time elapses", "410"],
  ["VIP -> priority + VIP SLA", "Ticket created", "86"],
  ["Out-of-hours -> AI only", "Ticket created", "2,020"],
];

function RuleBlock({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "indigo" | "amber" | "green";
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <div
        className={cn(
          "mb-3 inline-flex rounded-md px-2 py-1 text-xs font-black uppercase",
          tone === "indigo" && "bg-indigo-50 text-indigo-600",
          tone === "amber" && "bg-orange-50 text-orange-600",
          tone === "green" && "bg-emerald-50 text-emerald-700",
        )}
      >
        {label}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function RulesAutomationsSection() {
  return (
    <div className="space-y-4">
      <InfoCallout>
        A resolving rule (send tracking + close) beats an acknowledging one
        (send &quot;we got your message&quot; - which still leaves the ticket
        open).
      </InfoCallout>
      <SettingsCard
        title="Active rules"
        action={
          <div className="flex gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
              7 active
            </span>
            <Button variant="outline" size="sm" className="bg-white">
              + New rule
            </Button>
          </div>
        }
      >
        <TableShell
          columns={["Rule", "Trigger", "Runs", ""]}
          rows={rules.map(([rule, trigger, runs]) => [
            <span key="rule" className="font-bold text-slate-950">
              {rule}
            </span>,
            trigger,
            <span key="runs" className="font-bold text-slate-500">
              {runs}x
            </span>,
            <Switch key="switch" defaultChecked className="bg-emerald-600" />,
          ])}
        />
      </SettingsCard>
      <SettingsCard title="Editing: Auto-route returns to Returns team">
        <div className="space-y-3 p-5">
          <RuleBlock label="When" tone="indigo">
            <FieldBox>
              A ticket is created{" "}
              <IconChevronDown className="ml-auto size-4 text-slate-400" />
            </FieldBox>
          </RuleBlock>
          <RuleBlock label="If all of these match" tone="amber">
            <div className="grid gap-2 md:grid-cols-[1fr_90px_1fr]">
              <FieldBox>Detected intent</FieldBox>
              <FieldBox>is</FieldBox>
              <FieldBox>Returns</FieldBox>
              <FieldBox>Channel</FieldBox>
              <FieldBox>is any</FieldBox>
              <FieldBox>email, chat, whatsapp</FieldBox>
            </div>
            <Button variant="link" size="sm" className="px-0 text-indigo-600">
              + Add condition
            </Button>
          </RuleBlock>
          <RuleBlock label="Then do" tone="green">
            <div className="grid gap-2 md:grid-cols-2">
              <FieldBox>
                Assign to team{" "}
                <IconChevronDown className="ml-auto size-4 text-slate-400" />
              </FieldBox>
              <FieldBox>Returns team</FieldBox>
              <FieldBox>
                Apply SLA{" "}
                <IconChevronDown className="ml-auto size-4 text-slate-400" />
              </FieldBox>
              <FieldBox>Standard - 4h first response</FieldBox>
            </div>
            <Button variant="link" size="sm" className="px-0 text-indigo-600">
              + Add action
            </Button>
          </RuleBlock>
        </div>
      </SettingsCard>
    </div>
  );
}
