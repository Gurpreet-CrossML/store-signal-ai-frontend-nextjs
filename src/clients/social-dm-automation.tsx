"use client";

import { useState } from "react";
import { IconDeviceFloppy, IconInbox, IconSend } from "@tabler/icons-react";
import { toast } from "sonner";

import { InfoIcon } from "@/components/custom/info-icon";
import { WorkflowCalloutBox } from "@/components/custom/settings/workflows/workflow-callout";
import { WorkflowGateRow } from "@/components/custom/settings/workflows/workflow-gate-row";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import {
  DM_MODE_NOTES,
  DM_RESOLVABLE_INTENTS,
  DM_RESPONSE_MODES,
  OUTBOUND_COMPLIANCE_NOTE,
  getStaticDmAutomation,
  updateStaticDmAutomation,
  type DmResponseMode,
} from "@/lib/dm-automation-data";
import { toggleInList } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { WorkflowGate } from "@/lib/workflow-types";

/**
 * How the AI handles direct messages.
 *
 * Two cards, mirroring the two directions a DM can flow: inbound — a
 * customer writes first and the mode decides how far the AI goes — and
 * outbound, the comment/keyword-triggered DMs Meta polices strictly, with
 * its compliance floor rendered as a locked gate rather than fine print.
 */
export default function SocialDmAutomation() {
  const [draft, setDraft] = useState(getStaticDmAutomation);
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify(getStaticDmAutomation()),
  );

  const current = JSON.stringify(draft);
  const isDirty = current !== baseline;

  const inboundOff = draft.responseMode === "off";

  const toggleGate = (
    listKey: "inboundGates" | "outboundGates",
    gateId: string,
    enabled: boolean,
  ) =>
    setDraft((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((gate) =>
        gate.id === gateId ? { ...gate, enabled } : gate,
      ),
    }));

  const handleSave = () => {
    updateStaticDmAutomation(draft);
    setBaseline(current);
    toast.success("DM automation saved", {
      description: "The AI follows these rules on new messages from now on.",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconInbox className="size-4" />
            Inbound DM Handling
          </CardTitle>
          <CardDescription>
            When a customer messages you directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Typography variant="small" as="span">
                Auto-Respond to DMs
              </Typography>
              <Typography variant="caption" as="p" className="leading-relaxed">
                The AI reads the message, pulls in context, and prepares a
                reply.
              </Typography>
              <Typography variant="caption" as="p" className="leading-relaxed">
                {DM_MODE_NOTES[draft.responseMode]}
              </Typography>
            </div>
            <Select
              value={draft.responseMode}
              onValueChange={(mode) =>
                setDraft((prev) => ({
                  ...prev,
                  responseMode: mode as DmResponseMode,
                }))
              }
            >
              <SelectTrigger
                size="sm"
                className="w-44"
                aria-label="How far the AI goes on incoming DMs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DM_RESPONSE_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* The rows below only matter while the AI answers at all, so Off
              greys them the way a disabled workflow section greys its gates —
              the choices survive underneath and come back with the mode. */}
          <div
            className={cn("flex flex-col gap-1.5", inboundOff && "opacity-50")}
          >
            <Typography
              variant="small"
              as="span"
              className="flex items-center gap-2"
            >
              What DMs Can Resolve Autonomously
              <InfoIcon text="The subjects the AI may close out without review — safe, high-volume asks. A DM outside this scope is drafted for a teammate, or handed off, instead." />
            </Typography>
            <Typography variant="caption" as="p" className="leading-relaxed">
              Scope the AI to safe, high-volume intents; anything else drafts or
              hands off.
            </Typography>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {DM_RESOLVABLE_INTENTS.map((intent) => {
                const selected = draft.resolvableIntents.includes(intent.value);
                return (
                  <Button
                    key={intent.value}
                    type="button"
                    variant={selected ? "secondary" : "outline"}
                    size="sm"
                    aria-pressed={selected}
                    disabled={inboundOff}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        resolvableIntents: toggleInList(
                          prev.resolvableIntents,
                          intent.value,
                        ),
                      }))
                    }
                  >
                    {intent.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {draft.inboundGates.map((gate) => (
            <div key={gate.id} className="flex flex-col gap-3">
              <Separator />
              <WorkflowGateRow
                gate={gate}
                parentDisabled={inboundOff}
                onChange={(patch) =>
                  toggleGate("inboundGates", gate.id, patch.enabled ?? false)
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSend className="size-4" />
            Proactive / Outbound DMs
          </CardTitle>
          <CardDescription>
            A DM triggered by a comment or keyword — powerful for leads, and
            strictly governed by Meta.
          </CardDescription>
          <CardAction>
            <Switch
              checked={draft.outboundEnabled}
              onCheckedChange={(outboundEnabled) =>
                setDraft((prev) => ({ ...prev, outboundEnabled }))
              }
              aria-label="Toggle outbound DMs"
            />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <WorkflowCalloutBox callout={OUTBOUND_COMPLIANCE_NOTE} />
          {draft.outboundGates.map((gate: WorkflowGate, index) => (
            <div key={gate.id} className="flex flex-col gap-3">
              {index > 0 && <Separator />}
              <WorkflowGateRow
                gate={gate}
                parentDisabled={!draft.outboundEnabled}
                onChange={(patch) =>
                  toggleGate("outboundGates", gate.id, patch.enabled ?? false)
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 border-t border-border py-3">
        <Button
          type="button"
          size="lg"
          onClick={handleSave}
          disabled={!isDirty}
        >
          <IconDeviceFloppy data-icon="inline-start" />
          Save Changes
        </Button>
        {isDirty && (
          <Typography variant="caption">You have unsaved changes.</Typography>
        )}
      </div>
    </div>
  );
}
