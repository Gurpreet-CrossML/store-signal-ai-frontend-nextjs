"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconAlertCircle,
  IconBrandWhatsapp,
  IconCircleCheck,
  IconDeviceMobile,
  IconListDetails,
  IconLoader2,
  IconSend2,
  IconTemplate,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import {
  WhatsAppTemplateCategoryBadge,
  WhatsAppTemplateStatusBadge,
} from "@/components/ui/status-badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InfoIcon } from "@/components/custom/info-icon";
import { useWhatsAppAccount } from "@/components/custom/social-ai/use-whatsapp-account";
import { WhatsAppPhoneMockup } from "@/components/custom/social-ai/whatsapp-phone-mockup";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { FetchCustomers } from "@/redux/api-slice/customer-slice";
import {
  fetchWhatsAppTemplates,
  sendWhatsAppTemplateToAllCustomers,
  type WhatsAppTemplateSendAllResponse,
} from "@/redux/api-slice/social-ai-slice";

export default function CampaignSend() {
  const dispatch = useAppDispatch();
  const { storeCode, account, loading: accountLoading } = useWhatsAppAccount();

  const {
    FetchWhatsAppTemplatesData,
    FetchWhatsAppTemplatesIsLoading,
    FetchWhatsAppTemplatesIsSuccess,
    FetchWhatsAppTemplatesIsError,
  } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchWhatsAppTemplatesState,
  );
  const { FetchCustomersData, FetchCustomersIsLoading } = useAppSelector(
    (state) => state.GetCustomerReducer.FetchCustomersState,
  );

  useEffect(() => {
    if (storeCode && account) {
      dispatch(
        fetchWhatsAppTemplates({ storeCode, accountId: String(account.id) }),
      );
    }
  }, [storeCode, account, dispatch]);

  useEffect(() => {
    if (storeCode) {
      dispatch(FetchCustomers({ storeCode, page: 1, limit: 1 }));
    }
  }, [storeCode, dispatch]);

  const templatesLoading =
    Boolean(account) &&
    (FetchWhatsAppTemplatesIsLoading ||
      (!FetchWhatsAppTemplatesIsSuccess && !FetchWhatsAppTemplatesIsError));

  const approvedTemplates = useMemo(
    () =>
      (FetchWhatsAppTemplatesData?.templates ?? []).filter(
        (t) => t.status === "APPROVED",
      ),
    [FetchWhatsAppTemplatesData],
  );

  // Raw user override only — an explicit pick from the Select. Falls back
  // to the first approved template below, so the preview isn't blank on
  // first load without needing an effect to sync that default into state.
  const [templateOverride, setTemplateOverride] = useState<string | null>(
    null,
  );
  const selectedTemplateId =
    templateOverride ?? approvedTemplates[0]?.id ?? null;

  const selectedTemplate = useMemo(
    () => approvedTemplates.find((t) => t.id === selectedTemplateId) ?? null,
    [approvedTemplates, selectedTemplateId],
  );

  const customerCount = FetchCustomersData?.count ?? 0;

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<WhatsAppTemplateSendAllResponse | null>(
    null,
  );

  const handleSend = async () => {
    if (!storeCode || !account || !selectedTemplate) return;
    setSending(true);
    setResult(null);
    try {
      const res = await dispatch(
        sendWhatsAppTemplateToAllCustomers({
          storeCode,
          accountId: String(account.id),
          metaTemplateId: selectedTemplate.id,
        }),
      ).unwrap();
      setResult(res);
      toast.success("Campaign sent", {
        description: `${res.sent} sent, ${res.failed} failed.`,
      });
    } catch {
      // The thunk already surfaces the error toast.
    } finally {
      setSending(false);
    }
  };

  if (!accountLoading && !account) {
    return (
      <Empty className="w-full">
        <EmptyHeader>
          <EmptyMedia>
            <IconBrandWhatsapp />
          </EmptyMedia>
          <EmptyTitle>No WhatsApp Account Connected</EmptyTitle>
          <EmptyDescription>
            Connect a WhatsApp Business Account under Social AI settings
            before sending a campaign.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-6">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBrandWhatsapp className="size-4" />
              WhatsApp Account
              <InfoIcon text="The connected WhatsApp Business number this campaign sends from — every store has exactly one." />
            </CardTitle>
            <CardDescription>Where this campaign sends from.</CardDescription>
          </CardHeader>
          <CardContent>
            {accountLoading ? (
              <Spinner className="size-5" />
            ) : (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <IconBrandWhatsapp className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{account?.name}</span>
                  {account?.phone_number && (
                    <span className="text-sm text-muted-foreground">
                      +{account.phone_number}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTemplate className="size-4" />
              Template
              <InfoIcon text="Only approved templates can be sent — Meta rejects anything still pending or rejected." />
            </CardTitle>
            <CardDescription>
              Choose an approved template to broadcast.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            {templatesLoading ? (
              <Spinner className="size-5" />
            ) : approvedTemplates.length === 0 ? (
              <Typography variant="muted">
                No approved templates yet.{" "}
                <Link
                  href="/campaign/whatsapp-templates"
                  className="font-medium text-primary hover:underline"
                >
                  Create or import one
                </Link>{" "}
                first.
              </Typography>
            ) : (
              <>
                <Select
                  value={selectedTemplateId ?? undefined}
                  onValueChange={setTemplateOverride}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <div className="flex flex-wrap items-center gap-2">
                    <WhatsAppTemplateCategoryBadge
                      category={selectedTemplate.category}
                    />
                    <Badge variant="outline">{selectedTemplate.language}</Badge>
                  </div>
                )}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                  <p className="text-muted-foreground">
                    Templates that need order, ticket, or product details
                    (like a tracking number) can&apos;t be sent this way —
                    there&apos;s no single order to pull those from when
                    messaging every customer at once. Pick a template that
                    only uses customer details (name, email, phone).
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUsersGroup className="size-4" />
              Audience
              <InfoIcon text="This always sends to every customer in the store who has a WhatsApp number on file — there's no segment picker yet." />
            </CardTitle>
            <CardDescription>Who this campaign reaches.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <IconUsersGroup className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">
                  All customers with a WhatsApp number
                </span>
                <span className="text-sm text-muted-foreground">
                  {FetchCustomersIsLoading
                    ? "Loading…"
                    : `${customerCount} customer${customerCount === 1 ? "" : "s"} on file in ${storeCode}`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Button
            size="lg"
            onClick={handleSend}
            disabled={!selectedTemplate || sending || !account}
            className="self-end"
          >
            {sending ? (
              <>
                <IconLoader2 className="size-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <IconSend2 className="size-4" />
                Send to All Customers
              </>
            )}
          </Button>

          {result && (
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <IconCircleCheck className="size-4" />
                  <span className="font-medium">{result.sent} sent</span>
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-1.5 text-destructive">
                    <IconAlertCircle className="size-4" />
                    <span className="font-medium">{result.failed} failed</span>
                  </div>
                )}
              </div>
              <div className="flex max-h-64 flex-col divide-y overflow-y-auto rounded-md border">
                {result.results.map((r) => (
                  <div
                    key={r.customer_id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{r.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.phone}
                      </span>
                    </div>
                    {r.success ? (
                      <IconCircleCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span
                        className="flex max-w-40 items-center gap-1 text-xs text-destructive"
                        title={r.error ?? undefined}
                      >
                        <IconAlertCircle className="size-3.5 shrink-0" />
                        <span className="truncate">{r.error}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <IconDeviceMobile className="size-4" />
                Template Preview
                <InfoIcon text="Exactly what the selected template looks like — Meta's approved version, not a specific customer's filled-in copy." />
              </span>
              {selectedTemplate && (
                <WhatsAppTemplateStatusBadge status={selectedTemplate.status} />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <WhatsAppPhoneMockup
                accountName={account?.name || ""}
                isVerified={Boolean(account?.is_active)}
                components={selectedTemplate.components}
              />
            ) : (
              <Typography variant="muted">
                Select a template to preview it.
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconListDetails className="size-4" />
              Campaign Summary
              <InfoIcon text="A quick recap of what's about to be sent." />
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <div className="flex items-center justify-between gap-2">
              <Typography variant="caption">Account</Typography>
              <Typography variant="small">{account?.name || "—"}</Typography>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Typography variant="caption">Template</Typography>
              <Typography variant="small">
                {selectedTemplate?.name || "—"}
              </Typography>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Typography variant="caption">Audience</Typography>
              <Typography variant="small">
                {FetchCustomersIsLoading ? "—" : `${customerCount} customers`}
              </Typography>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
