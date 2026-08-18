"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type { WorkflowBranch, WorkflowGatePatch } from "@/lib/workflow-types";

import { WorkflowGateRow } from "./workflow-gate-row";

/** One return-reason branch inside the "branch by return reason" step. */
export function WorkflowBranchCard({
  branch,
  onGateChange,
}: {
  branch: WorkflowBranch;
  onGateChange: (gateId: string, patch: WorkflowGatePatch) => void;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn("uppercase", BADGE_TONE_STYLES.warning)}
          >
            Reason
          </Badge>
          {branch.reason}
        </CardTitle>
        {branch.note && <CardDescription>{branch.note}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {branch.gates.map((gate, index) => (
          <div key={gate.id} className="flex flex-col gap-3">
            {index > 0 && <Separator />}
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
