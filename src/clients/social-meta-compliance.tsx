"use client";

import { IconShieldCheck } from "@tabler/icons-react";

import { InfoIcon } from "@/components/custom/info-icon";
import { WorkflowGateRow } from "@/components/custom/settings/workflows/workflow-gate-row";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import {
  META_COMPLIANCE_NOTE,
  META_COMPLIANCE_RAILS,
  META_RAILS_INFO,
  META_RETENTION,
} from "@/lib/meta-compliance-data";

/**
 * A window onto the Meta rails the platform enforces on every connected
 * account. Read-only by design: nothing here is configurable and there is
 * no API behind it. The locked rows exist so "why can't I turn this off"
 * and "are we compliant" are both answerable at a glance.
 */
export default function SocialMetaCompliance() {
  return (
    <div className="flex flex-col gap-6">
      {/* Same banner anatomy as the inbox's policy strip: icon, short
          title, muted body — in the reassuring tone. */}
      <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-3 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
        <IconShieldCheck className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0">
          <Typography variant="small" as="p" className="leading-normal">
            {META_COMPLIANCE_NOTE.title}
          </Typography>
          <Typography variant="muted" className="text-inherit">
            {META_COMPLIANCE_NOTE.body}
          </Typography>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Typography variant="small" as="h3" className="flex items-center gap-2">
          Platform Rails
          <InfoIcon text={META_RAILS_INFO} />
        </Typography>

        <Card size="sm">
          <CardContent className="flex flex-col gap-3">
            {META_COMPLIANCE_RAILS.map((rail, index) => (
              <div key={rail.id} className="flex flex-col gap-3">
                {index > 0 && <Separator />}
                <WorkflowGateRow
                  gate={rail}
                  // Locked rows never fire a change; the handler exists
                  // only to satisfy the shared row's contract.
                  onChange={() => undefined}
                />
              </div>
            ))}

            <Separator />

            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Typography variant="small" as="span">
                  {META_RETENTION.title}
                </Typography>
                <Typography
                  variant="caption"
                  as="p"
                  className="leading-relaxed"
                >
                  {META_RETENTION.description}
                </Typography>
              </div>
              <Select value={META_RETENTION.value} disabled>
                <SelectTrigger
                  size="sm"
                  className="w-32"
                  aria-label={META_RETENTION.title}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={META_RETENTION.value}>
                    {META_RETENTION.value}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
