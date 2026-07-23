import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  FieldBox,
  ToggleLine,
  SettingsCard,
  InfoCallout,
  TableShell,
} from "../ticketing-settings";
import { cn } from "@/lib/utils";

const routingRules = [
  ["Language is Hindi", "Hindi support inbox", "1"],
  ['Keyword "wholesale" or "bulk"', "B2B team", "2"],
  ["Customer LTV > EUR1,000", "VIP team", "3"],
  ["Tag is Complaint", "Senior agents", "4"],
  ["Channel is WhatsApp", "Chat team", "5"],
];

export function RoutingAssignmentSection() {
  const [assignmentMethod, setAssignmentMethod] = useState<
    "balanced" | "round-robin"
  >("balanced");

  return (
    <div className="space-y-4">
      <SettingsCard title="Assignment method">
        <div className="space-y-5 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div
              role="button"
              tabIndex={0}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4 text-left transition",
                assignmentMethod === "balanced"
                  ? "border-indigo-500 bg-indigo-50"
                  : "bg-white hover:bg-slate-50",
              )}
              onClick={() => setAssignmentMethod("balanced")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setAssignmentMethod("balanced");
                }
              }}
            >
              <div className="flex-1">
                <div className="font-bold text-slate-950">
                  Balanced{" "}
                  <span className="ml-3 text-xs text-indigo-600">
                    Recommended
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Routes to the most available and relevant teammate, respecting
                  limits
                </p>
              </div>
              <Switch
                checked={assignmentMethod === "balanced"}
                onCheckedChange={() => setAssignmentMethod("balanced")}
              />
            </div>
            <div
              role="button"
              tabIndex={0}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4 text-left transition",
                assignmentMethod === "round-robin"
                  ? "border-indigo-500 bg-indigo-50"
                  : "bg-white hover:bg-slate-50",
              )}
              onClick={() => setAssignmentMethod("round-robin")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setAssignmentMethod("round-robin");
                }
              }}
            >
              <div className="flex-1">
                <div className="font-bold text-slate-950">Round-robin</div>
                <p className="mt-1 text-sm text-slate-500">
                  Even distribution in turn, regardless of current load
                </p>
              </div>
              <Switch
                checked={assignmentMethod === "round-robin"}
                onCheckedChange={() => setAssignmentMethod("round-robin")}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 border-b pb-4">
            <div className="flex-1">
              <div className="font-bold text-slate-950">
                Per-agent concurrency limit
              </div>
              <p className="text-sm text-slate-500">
                Max open conversations an agent holds at once - the guardrail
                that prevents burying
              </p>
            </div>
            <FieldBox className="w-16 justify-center">3</FieldBox>
            <span className="text-sm text-slate-500">tickets</span>
          </div>
          <ToggleLine
            title="Skip agents who are away"
            detail="Only route to Available agents"
          />
        </div>
      </SettingsCard>
      <SettingsCard
        title="Assignment rules (attribute - keyword - language)"
        action={
          <Button variant="outline" size="sm" className="bg-white">
            + New
          </Button>
        }
      >
        <TableShell
          columns={["If", "Route to", "Priority"]}
          rows={routingRules.map(([condition, route, priority]) => [
            <span key="condition" className="font-bold text-slate-950">
              {condition}
            </span>,
            route,
            <span
              key="priority"
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
            >
              {priority}
            </span>,
          ])}
        />
      </SettingsCard>
      <InfoCallout>
        Language-based routing is a genuine edge for your multilingual markets -
        send Hindi and regional-language speakers straight to matching-language
        agents.
      </InfoCallout>
    </div>
  );
}
