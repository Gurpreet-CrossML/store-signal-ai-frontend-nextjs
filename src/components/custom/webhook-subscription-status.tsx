import { IconCheck, IconX } from "@tabler/icons-react";

import { webhookFailureReason } from "@/lib/helpers";
import type { ShopifyConnectedStore } from "@/redux/api-slice/onboarding-slice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

/**
 * Per-topic outcome of the webhook subscriptions made while connecting a
 * store: a check for each subscribed topic, a red cross for each that
 * Shopify refused. Shown on the onboarding drawer and the connect dialog.
 */
export function WebhookSubscriptionStatus({
  webhooks,
}: {
  webhooks: ShopifyConnectedStore["webhooks"];
}) {
  const failed = Object.entries(webhooks.failed);
  const subscribed = [...webhooks.subscribed, ...webhooks.existing];

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Store updates</CardTitle>
        <CardDescription>
          {failed.length === 0
            ? "All store updates are subscribed. You're good to go."
            : "Some store updates couldn't be subscribed yet. You can still use StoreSignal; it retries these automatically, and reconnecting the store retries them right away."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-3">
          {subscribed.map((topic) => (
            <li key={topic} className="flex items-center gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-emerald-500 text-emerald-600">
                <IconCheck className="size-4" />
              </span>
              <Typography variant="small" as="span">
                {topic}
              </Typography>
            </li>
          ))}
          {failed.map(([topic, reason]) => (
            <li key={topic} className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-destructive text-destructive">
                <IconX className="size-4" />
              </span>
              <div className="flex flex-col gap-1">
                <Typography variant="small" as="span">
                  {topic}
                </Typography>
                <Typography variant="muted" as="span">
                  {webhookFailureReason(reason)}
                </Typography>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
