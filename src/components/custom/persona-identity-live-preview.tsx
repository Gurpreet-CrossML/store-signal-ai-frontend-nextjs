"use client";

import { IconHeadset } from "@tabler/icons-react";

import { InfoIcon } from "@/components/custom/info-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type { SelfReference } from "@/redux/api-slice/brand-voice-slice";

type PersonaIdentityLivePreviewProps = {
  name?: string;
  roleDescription?: string;
  selfReference: SelfReference;
};

/**
 * What the persona settings resolve to — deliberately not a mock of the
 * assistant's reply.
 *
 * This panel used to render an invented two-line answer to an invented
 * customer question ("I can help you track an order, sort a return…").
 * Nothing generated those sentences; they were written here, while a real
 * reply is composed by the model from the whole brand-voice profile and the
 * store's knowledge. The two could only ever agree by coincidence, and the
 * difference read as the assistant ignoring these settings.
 *
 * The resolved identity is the part this screen can state truthfully. A
 * preview of actual wording has to come from the server running the same
 * system prompt with the unsaved settings — there is no honest way to
 * produce it in the browser.
 */
export default function PersonaIdentityLivePreview({
  name,
  roleDescription,
  selfReference,
}: PersonaIdentityLivePreviewProps) {
  const displayName = name?.trim() || "Your agent";
  const role = roleDescription?.trim() || "a helpful assistant";
  const pronoun = selfReference === "we" ? "We" : "I";

  const facts = [
    { label: "Introduces itself as", value: displayName },
    { label: "Refers to itself as", value: `“${pronoun}”` },
    { label: "Describes its role as", value: role },
  ];

  return (
    <Card className="sticky top-4">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Persona summary
          <InfoIcon text="How your settings resolve for the assistant. Updates as you type — nothing is saved until you hit Save Changes." />
        </CardTitle>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Updates as you type
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconHeadset className="size-5" />
          </div>
          <div className="min-w-0">
            <Typography variant="h6" as="p" className="truncate">
              {displayName}
            </Typography>
            <Typography variant="muted" className="truncate">
              {role}
            </Typography>
          </div>
        </div>

        <dl className="flex flex-col gap-3 border-t border-border pt-4">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="flex items-baseline justify-between gap-4"
            >
              <dt className="shrink-0 text-sm text-muted-foreground">
                {fact.label}
              </dt>
              <dd className="min-w-0 text-right text-sm font-medium text-foreground">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        <Typography variant="muted" className="border-t border-border pt-4">
          These settings decide the identity the assistant uses. What it
          actually writes is composed for each customer from your tone,
          vocabulary and knowledge settings, so its exact wording will differ
          from any sample shown here.
        </Typography>
      </CardContent>
    </Card>
  );
}
