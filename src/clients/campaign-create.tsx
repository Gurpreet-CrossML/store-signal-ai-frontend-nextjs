"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconBrandWhatsapp,
  IconClock,
  IconEye,
  IconMail,
  IconPlus,
  IconSpeakerphone,
  IconTrash,
  IconUsersGroup,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { useWhatsAppAccount } from "@/components/custom/social-ai/use-whatsapp-account";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  createCampaign,
  fetchEmailTemplates,
  fetchSegments,
  type CampaignWritePayload,
  type EmailTemplate,
  type Segment,
} from "@/redux/api-slice/campaign-slice";
import {
  fetchWhatsAppTemplates,
  type WhatsAppTemplate,
} from "@/redux/api-slice/social-ai-slice";

type Channel = "whatsapp" | "email";

type StepForm = {
  key: string;
  channel: Channel;
  templateId: string;
  delayValue: string;
};

function newStep(channel: Channel = "whatsapp"): StepForm {
  return {
    key: crypto.randomUUID(),
    channel,
    templateId: "",
    delayValue: "60",
  };
}

// The backend rejects a total sequence span >= 24h and a spacing < 30min
// between consecutive steps; the form mirrors both so a user sees the
// problem before submit.
const MAX_TOTAL_DELAY_MINUTES = 24 * 60;
const MIN_STEP_SPACING_MINUTES = 30;

/**
 * The DRF envelope's ``data`` on a 400 is either the field-error dict
 * or a top-level error list; extract the first message per field so we
 * can hang it under the matching input.
 *
 * The Campaign serializer has ``sequence_steps`` as a list-of-lists, so
 * this also handles the ``sequence_steps[i].delay_value`` shape and
 * turns it into a ``step-<i>-delayValue`` key that lines up with the
 * per-step render below.
 */
function parseFieldErrors(rejected: unknown): Record<string, string> {
  const envelope = rejected as
    | { data?: unknown; message?: string }
    | undefined;
  const errors: Record<string, string> = {};
  const data = envelope?.data;

  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const [field, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        // sequence_steps: a list where each entry maps step-index -> field errors.
        if (field === "sequence_steps") {
          value.forEach((entry, i) => {
            if (entry && typeof entry === "object" && !Array.isArray(entry)) {
              for (const [nestedField, nestedValue] of Object.entries(entry)) {
                const message = Array.isArray(nestedValue)
                  ? String(nestedValue[0] ?? "")
                  : String(nestedValue);
                // Map serializer field names to the form's local keys.
                const key =
                  nestedField === "delay_value"
                    ? `step-${i}-delayValue`
                    : nestedField === "whatsapp_template" ||
                        nestedField === "email_template"
                      ? `step-${i}-templateId`
                      : `step-${i}-${nestedField}`;
                errors[key] = message;
              }
            } else if (typeof entry === "string" && entry) {
              errors[`step-${i}`] = entry;
            }
          });
          continue;
        }
        if (typeof value[0] === "string") errors[field] = value[0];
      } else if (typeof value === "string") {
        errors[field] = value;
      }
    }
  }
  if (!Object.keys(errors).length && envelope?.message) {
    errors.__form__ = envelope.message;
  }
  return errors;
}

export default function CampaignCreate() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { account } = useWhatsAppAccount();

  const [name, setName] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [continuousEntry, setContinuousEntry] = useState(false);
  const [publish, setPublish] = useState(false);
  const [steps, setSteps] = useState<StepForm[]>([
    { ...newStep("whatsapp"), delayValue: "0" },
  ]);

  const [segments, setSegments] = useState<Segment[]>([]);
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!storeCode) return;
    setLoading(true);
    try {
      const segs = await dispatch(fetchSegments({ storeCode })).unwrap();
      setSegments(segs);
      const emails = await dispatch(fetchEmailTemplates(storeCode)).unwrap();
      setEmailTemplates(emails);
      if (account) {
        const was = await dispatch(
          fetchWhatsAppTemplates({
            storeCode,
            accountId: String(account.id),
          }),
        ).unwrap();
        setWaTemplates(was);
      } else {
        setWaTemplates([]);
      }
    } catch {
      // Thunks already surface a toast.
    } finally {
      setLoading(false);
    }
  }, [dispatch, storeCode, account]);

  useEffect(() => {
    load();
  }, [load]);

  // WhatsApp templates only make sense as a send target once Meta has
  // approved them — a Draft/Pending row would fail the send at runtime.
  const approvedWaTemplates = useMemo(
    () => waTemplates.filter((t) => t.status === "APPROVED"),
    [waTemplates],
  );
  const activeEmailTemplates = useMemo(
    () => emailTemplates.filter((t) => t.is_active),
    [emailTemplates],
  );

  const addStep = () => setSteps((prev) => [...prev, newStep()]);
  const removeStep = (key: string) =>
    setSteps((prev) =>
      prev.length > 1 ? prev.filter((s) => s.key !== key) : prev,
    );
  const updateStep = (key: string, patch: Partial<StepForm>) =>
    setSteps((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    );

  const totalDelay = useMemo(
    () =>
      steps
        .slice(1)
        .reduce((sum, s) => sum + (Number(s.delayValue) || 0), 0),
    [steps],
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /**
   * Run the same rules the backend enforces so we can show inline
   * errors before the request goes out. Returns an errors dict keyed by
   * field name; empty when everything is fine.
   */
  const runClientValidation = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Give the campaign a name.";
    if (!segmentId) errors.segment = "Pick a segment for the audience.";
    if (!startTime) errors.start_time = "Set the start time.";
    if (steps.length === 0) errors.__form__ = "Add at least one step.";

    steps.forEach((step, i) => {
      if (!step.templateId) {
        errors[`step-${i}-templateId`] = "Pick a template.";
      }
      if (i > 0) {
        const delay = Number(step.delayValue);
        if (Number.isNaN(delay) || delay < MIN_STEP_SPACING_MINUTES) {
          errors[`step-${i}-delayValue`] =
            `Wait at least ${MIN_STEP_SPACING_MINUTES} minutes after step ${i}.`;
        }
      }
    });

    if (totalDelay >= MAX_TOTAL_DELAY_MINUTES) {
      errors.__form__ =
        `Total sequence span must stay under 24 hours (${totalDelay} min right now).`;
    }
    return errors;
  };

  const handleSubmit = async () => {
    if (!storeCode) return;

    const clientErrors = runClientValidation();
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      return;
    }

    // Backend expects HH:MM:SS; the input gives us HH:MM.
    const paddedStartTime = `${startTime}:00`;

    const payload: CampaignWritePayload = {
      name: name.trim(),
      status: publish ? "published" : "draft",
      is_active: publish,
      start_time: paddedStartTime,
      segment: Number(segmentId),
      continuous_entry: continuousEntry,
      sequence_steps: steps.map((s, index) => ({
        whatsapp_template:
          s.channel === "whatsapp" ? Number(s.templateId) : null,
        email_template: s.channel === "email" ? Number(s.templateId) : null,
        // First step's start_time is overridden by the backend to the
        // campaign's own start_time; sending it just to satisfy the required
        // field on the serializer.
        start_time: paddedStartTime,
        // First step has no previous step to wait on, so its delay is null.
        delay_value: index === 0 ? null : Number(s.delayValue),
        step_order: index,
      })),
    };

    setSubmitting(true);
    setFieldErrors({});
    try {
      await dispatch(createCampaign({ storeCode, payload })).unwrap();
      toast.success(
        publish ? "Campaign published" : "Campaign saved as draft",
      );
      router.push("/campaign/campaigns");
    } catch (rejected) {
      setFieldErrors(parseFieldErrors(rejected));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="size-6" />
      </div>
    );
  }

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
              New Campaign
            </Typography>
            <Typography variant="muted">
              Pick the segment, arrange the send sequence, then save as draft
              or publish it.
            </Typography>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setPublish(false);
              handleSubmit();
            }}
            disabled={submitting}
          >
            Save draft
          </Button>
          <Button
            onClick={() => {
              setPublish(true);
              handleSubmit();
            }}
            disabled={submitting}
          >
            {submitting ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSpeakerphone className="size-4" />
            Campaign details
          </CardTitle>
          <CardDescription>
            Name, target audience and when new entrants start.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {fieldErrors.__form__ && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive sm:col-span-2">
              {fieldErrors.__form__}
            </div>
          )}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="campaign-name">Name</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                clearFieldError("name");
              }}
              placeholder="e.g. Abandoned cart winback"
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name && (
              <p className="text-xs text-destructive">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-segment">
              <span className="inline-flex items-center gap-1.5">
                <IconUsersGroup className="size-4" />
                Segment
              </span>
            </Label>
            <Select
              value={segmentId}
              onValueChange={(value) => {
                setSegmentId(value);
                clearFieldError("segment");
              }}
            >
              <SelectTrigger
                id="campaign-segment"
                aria-invalid={!!fieldErrors.segment}
              >
                <SelectValue placeholder="Pick a saved segment" />
              </SelectTrigger>
              <SelectContent>
                {segments.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No segments yet — create one first.
                  </div>
                ) : (
                  segments.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {fieldErrors.segment && (
              <p className="text-xs text-destructive">{fieldErrors.segment}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-start-time">
              <span className="inline-flex items-center gap-1.5">
                <IconClock className="size-4" />
                Start time
              </span>
            </Label>
            <Input
              id="campaign-start-time"
              type="time"
              value={startTime}
              onChange={(event) => {
                setStartTime(event.target.value);
                clearFieldError("start_time");
              }}
              aria-invalid={!!fieldErrors.start_time}
            />
            {fieldErrors.start_time && (
              <p className="text-xs text-destructive">
                {fieldErrors.start_time}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3 sm:col-span-2">
            <div>
              <div className="text-sm font-medium">Continuous entry</div>
              <div className="text-xs text-muted-foreground">
                Off: only customers who existed before this segment was
                created enter. On: every customer currently matching the
                segment enters, regardless of when their account was created.
              </div>
            </div>
            <Switch
              checked={continuousEntry}
              onCheckedChange={setContinuousEntry}
            />
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
            Steps fire in order. Each step must wait at least 30 minutes
            after the previous one, and the whole sequence must fit inside 24
            hours. Total right now:{" "}
            <span className="font-medium text-foreground">
              {totalDelay} min
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {steps.map((step, index) => {
            const templateOptions =
              step.channel === "whatsapp"
                ? approvedWaTemplates.map((t) => ({
                    id: t.id,
                    label: t.name,
                  }))
                : activeEmailTemplates.map((t) => ({
                    id: t.id,
                    label: t.name,
                  }));

            const templateErrorKey = `step-${index}-templateId`;
            const delayErrorKey = `step-${index}-delayValue`;

            return (
              <div
                key={step.key}
                className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {index + 1}
                </div>
                <div className="grid flex-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Channel</Label>
                    <Select
                      value={step.channel}
                      onValueChange={(value) => {
                        updateStep(step.key, {
                          channel: value as Channel,
                          templateId: "",
                        });
                        clearFieldError(templateErrorKey);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">
                          <span className="inline-flex items-center gap-1.5">
                            <IconBrandWhatsapp className="size-4" />
                            WhatsApp
                          </span>
                        </SelectItem>
                        <SelectItem value="email">
                          <span className="inline-flex items-center gap-1.5">
                            <IconMail className="size-4" />
                            Email
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <Label>Template</Label>
                    <Select
                      value={step.templateId}
                      onValueChange={(value) => {
                        updateStep(step.key, { templateId: value });
                        clearFieldError(templateErrorKey);
                      }}
                    >
                      <SelectTrigger aria-invalid={!!fieldErrors[templateErrorKey]}>
                        <SelectValue
                          placeholder={
                            templateOptions.length === 0
                              ? step.channel === "whatsapp"
                                ? "No approved templates"
                                : "No active templates"
                              : "Pick a template"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {templateOptions.map((opt) => (
                          <SelectItem key={opt.id} value={String(opt.id)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldErrors[templateErrorKey] && (
                      <p className="text-xs text-destructive">
                        {fieldErrors[templateErrorKey]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      {index === 0 ? "Fires at start" : "Wait after previous (min)"}
                    </Label>
                    <Input
                      type="number"
                      min={index === 0 ? 0 : MIN_STEP_SPACING_MINUTES}
                      value={index === 0 ? "0" : step.delayValue}
                      disabled={index === 0}
                      onChange={(event) => {
                        updateStep(step.key, { delayValue: event.target.value });
                        clearFieldError(delayErrorKey);
                      }}
                      aria-invalid={!!fieldErrors[delayErrorKey]}
                    />
                    {fieldErrors[delayErrorKey] && (
                      <p className="text-xs text-destructive">
                        {fieldErrors[delayErrorKey]}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeStep(step.key)}
                  disabled={steps.length === 1}
                  aria-label={`Remove step ${index + 1}`}
                >
                  <IconTrash className="size-4" />
                </Button>
              </div>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={addStep}
            className="self-start"
          >
            <IconPlus className="size-4" />
            Add step
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
