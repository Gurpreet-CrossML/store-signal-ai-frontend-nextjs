"use client";

import { IconHeadset } from "@tabler/icons-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SelfReference } from "@/redux/api-slice/brand-voice-slice";

const SAMPLE_CUSTOMER_MESSAGE =
  "Hi there, I'm here to ask about an order I placed. Can you help me out?";

type PersonaIdentityLivePreviewProps = {
  name?: string;
  roleDescription?: string;
  selfReference: SelfReference;
};

export default function PersonaIdentityLivePreview({
  name,
  roleDescription,
  selfReference,
}: PersonaIdentityLivePreviewProps) {
  const displayName = name?.trim() || "Your agent";
  const role = roleDescription?.trim() || "a helpful assistant";
  const pronoun = selfReference === "we" ? "We" : "I";
  const introVerb = selfReference === "we" ? "We're" : "I'm";
  const pronounLower = pronoun.toLowerCase();

  const replyLine1 = `Hello! ${introVerb} ${displayName}, ${
    role.charAt(0).toLowerCase() + role.slice(1)
  }.`;
  const replyLine2 = `${pronoun} can help you track an order, sort a return, or find the right product. What can ${pronounLower} do for you today?`;

  return (
    <Card className="sticky top-4">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Live preview</CardTitle>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Updates as you type
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {displayName.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Customer
            </span>
            <div className="rounded-lg bg-muted px-3 py-2 text-sm">
              {SAMPLE_CUSTOMER_MESSAGE}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <IconHeadset className="size-4" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {displayName}
            </span>
            <div className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <p>{replyLine1}</p>
              <p>{replyLine2}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          The AI introduces itself as{" "}
          <span className="font-medium text-foreground">{displayName}</span>,
          refers to itself as &quot;{pronoun}&quot;, and frames its role exactly
          as you&apos;ve set it.
        </p>
      </CardContent>
    </Card>
  );
}
