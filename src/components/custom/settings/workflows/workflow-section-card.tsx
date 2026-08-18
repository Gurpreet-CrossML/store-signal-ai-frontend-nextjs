"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoIcon } from "@/components/custom/info-icon";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { WorkflowGatePatch, WorkflowSection } from "@/lib/workflow-types";

import { WorkflowGateRow } from "./workflow-gate-row";

/** A rule group, e.g. "Eligibility Conditions", with its own on/off switch. */
export function WorkflowSectionCard({
  section,
  onToggleSection,
  onGateChange,
}: {
  section: WorkflowSection;
  onToggleSection: (sectionId: string, enabled: boolean) => void;
  onGateChange: (gateId: string, patch: WorkflowGatePatch) => void;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        {/* Just the title and its ⓘ. A filled counter chip sat here,
            which nothing else in the app puts in a heading — and the cards
            are already in order down the page, so it was decoration
            carrying no information the reader did not have. */}
        <CardTitle className="flex items-center gap-2">
          {section.title}
          {/* What the group switch does, which the switch itself cannot
              say. Intent phrasing: these are instructions to the AI, not
              promises about what it will do. */}
          <InfoIcon text="Every check in this group. Turning the group off tells the AI to skip all of them; the individual switches stay as you left them." />
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
              parentDisabled={!section.enabled}
              onChange={(patch) => onGateChange(gate.id, patch)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
