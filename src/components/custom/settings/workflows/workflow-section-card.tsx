"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type {
  WorkflowGatePatch,
  WorkflowSection,
} from "@/lib/workflow-types";

import { WorkflowGateRow } from "./workflow-gate-row";

/** A numbered rule group, e.g. "Eligibility conditions", with its own on/off switch. */
export function WorkflowSectionCard({
  section,
  index,
  onToggleSection,
  onGateChange,
}: {
  section: WorkflowSection;
  index: number;
  onToggleSection: (sectionId: string, enabled: boolean) => void;
  onGateChange: (gateId: string, patch: WorkflowGatePatch) => void;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
            {index}
          </span>
          {section.title}
        </CardTitle>
        {section.subtitle && (
          <CardDescription>{section.subtitle}</CardDescription>
        )}
        <CardAction>
          <Switch
            checked={section.enabled}
            onCheckedChange={(value) => onToggleSection(section.id, value)}
            aria-label={`Toggle ${section.title}`}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {section.gates.map((gate, gateIndex) => (
          <div key={gate.id} className="flex flex-col gap-3">
            {gateIndex > 0 && <Separator />}
            <WorkflowGateRow
              gate={gate}
              onChange={(patch) => onGateChange(gate.id, patch)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
