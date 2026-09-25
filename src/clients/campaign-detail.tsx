"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconBrandWhatsapp,
  IconClock,
  IconMail,
  IconRocket,
  IconSpeakerphone,
  IconUsersGroup,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { useWhatsAppAccount } from "@/components/custom/social-ai/use-whatsapp-account";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchCampaignDetail,
  fetchEmailTemplates,
  fetchSegments,
  updateCampaignStatus,
  type Campaign,
  type EmailTemplate,
  type Segment,
} from "@/redux/api-slice/campaign-slice";
import {
  fetchWhatsAppTemplates,
  type WhatsAppTemplate,
} from "@/redux/api-slice/social-ai-slice";

/**
 * Render a "N min → 1h 20m" hint for the delay between steps. Anything
 * under 60 minutes stays as minutes; over that we show hours + minutes
 * so a multi-hour wait doesn't read as a huge integer.
 */
function formatDelay(minutes: number | null | undefined): string {
  if (!minutes) return "fires immediately";
  if (minutes < 60) return `wait ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0
    ? `wait ${hours}h`
    : `wait ${hours}h ${rem}m`;
}

export default function CampaignDetail({ campaignId }: { campaignId: number }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { account } = useWhatsAppAccount();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    if (!storeCode) return;
    setLoading(true);
    try {
      const c = await dispatch(
        fetchCampaignDetail({ storeCode, campaignId }),
      ).unwrap();
      setCampaign(c);
      const [segs, emails] = await Promise.all([
        dispatch(fetchSegments({ storeCode })).unwrap(),
        dispatch(fetchEmailTemplates(storeCode)).unwrap(),
      ]);
      setSegments(segs);
      setEmailTemplates(emails);
      if (account) {
        const was = await dispatch(
          fetchWhatsAppTemplates({
            storeCode,
            accountId: String(account.id),
          }),
        ).unwrap();
        setWaTemplates(was);
      }
    } catch {
      // Thunks already surface a toast; the 404 case just leaves campaign null.
    } finally {
      setLoading(false);
    }
  }, [dispatch, storeCode, campaignId, account]);

  useEffect(() => {
    load();
  }, [load]);

  const segment = useMemo(
    () =>
      campaign
        ? segments.find((s) => s.id === campaign.segment) ?? null
        : null,
    [segments, campaign],
  );
  const waById = useMemo(
    () => new Map(waTemplates.map((t) => [t.id, t])),
    [waTemplates],
  );
  const emailById = useMemo(
    () => new Map(emailTemplates.map((t) => [t.id, t])),
    [emailTemplates],
  );

  const handleToggleActive = async (checked: boolean) => {
    if (!storeCode || !campaign) return;
    setToggling(true);
    try {
      const updated = await dispatch(
        updateCampaignStatus({
          storeCode,
          campaignId: campaign.id,
          isActive: checked,
        }),
      ).unwrap();
      setCampaign(updated);
      toast.success(checked ? "Campaign resumed" : "Campaign paused");
    } catch {
      // Thunk already surfaced the toast.
    } finally {
      setToggling(false);
    }
  };

  const handlePublish = async () => {
    if (!storeCode || !campaign) return;
    setPublishing(true);
    try {
      const updated = await dispatch(
        updateCampaignStatus({
          storeCode,
          campaignId: campaign.id,
          status: "published",
          isActive: true,
        }),
      ).unwrap();
      setCampaign(updated);
      toast.success("Campaign published");
    } catch {
      // Thunk already surfaced the toast.
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <Typography variant="h4">Campaign not found</Typography>
        <Typography variant="muted">
          It may have been deleted, or belong to a different store.
        </Typography>
        <Button variant="outline" onClick={() => router.push("/campaign/campaigns")}>
          Back to campaigns
        </Button>
      </div>
    );
  }

  // Steps in ``step_order`` order — the array from the API is already
  // sorted, but sorting here means a future backend change can't
  // silently show them out of order.
  const steps = [...campaign.sequence_steps].sort(
    (a, b) => a.step_order - b.step_order,
  );

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/campaign/campaigns" aria-label="Back to campaigns">
              <IconArrowLeft />
            </Link>
          </Button>
          <div>
            <Typography variant="h4" as="h1">
              {campaign.name}
            </Typography>
            <Typography variant="muted">
              {campaign.continuous_entry
                ? "Continuous entry"
                : "One-time snapshot"}{" "}
              · Start time {campaign.start_time.slice(0, 5)}
            </Typography>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {campaign.status === "draft" ? (
            <Badge variant="secondary">Draft</Badge>
          ) : campaign.is_active ? (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              Live
            </Badge>
          ) : (
            <Badge variant="outline">Paused</Badge>
          )}
          {/* Draft -> published is the one status transition the UI
              exposes; pause/resume of a published campaign lives on the
              is_active switch below. There is no revert-to-draft. */}
          {campaign.status === "draft" ? (
            <Button onClick={handlePublish} disabled={publishing}>
              <IconRocket className="size-4" />
              {publishing ? "Publishing…" : "Publish"}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Active</span>
              <Switch
                checked={campaign.is_active}
                disabled={toggling}
                onCheckedChange={handleToggleActive}
                aria-label="Toggle campaign active"
              />
            </div>
          )}
        </div>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSpeakerphone className="size-4" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-md border p-3">
            <IconUsersGroup className="mt-0.5 size-4 text-muted-foreground" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Segment</div>
              <div className="truncate text-sm font-medium">
                {segment?.name ?? `#${campaign.segment}`}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md border p-3">
            <IconClock className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Steps</div>
              <div className="text-sm font-medium">
                {steps.length} step{steps.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconClock className="size-4" />
            Sequence
          </CardTitle>
          <CardDescription>
            Every step fires in order, waiting the configured delay after the
            previous one.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {steps.map((step, index) => {
            const isWa = !!step.whatsapp_template;
            const template = isWa
              ? waById.get(step.whatsapp_template!)
              : step.email_template
                ? emailById.get(step.email_template)
                : undefined;
            const templateLabel =
              template?.name ??
              (isWa
                ? `WhatsApp template #${step.whatsapp_template}`
                : `Email template #${step.email_template}`);

            return (
              <div
                key={step.id ?? step.step_order}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isWa ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <IconBrandWhatsapp className="size-3.5" />
                        WhatsApp
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        <IconMail className="size-3.5" />
                        Email
                      </Badge>
                    )}
                    <span className="font-medium">{templateLabel}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {index === 0
                      ? `fires at ${campaign.start_time.slice(0, 5)}`
                      : formatDelay(step.delay_value)}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
