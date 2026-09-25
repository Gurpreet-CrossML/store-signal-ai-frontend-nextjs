"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconPlus, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { WhatsAppVariablePicker } from "@/components/custom/social-ai/whatsapp-variable-picker";
import { EmailTemplateMonitorPreview } from "@/components/custom/social-ai/email-template-monitor-preview";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  createEmailTemplate,
  fetchEmailTemplateDetail,
  updateEmailTemplate,
  type EmailTemplateDetailRow,
  type EmailTemplateWritePayload,
} from "@/redux/api-slice/campaign-slice";
import { toast } from "sonner";

const EMPTY_ROW: EmailTemplateDetailRow = { icon: "", label: "", value: "" };

export default function EmailTemplateForm({
  templateId,
}: {
  templateId?: number;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const isEdit = templateId != null;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [accentColor, setAccentColor] = useState("#2563EB");
  const [icon, setIcon] = useState("");
  const [heading, setHeading] = useState("");
  const [intro, setIntro] = useState("");
  const [detailRows, setDetailRows] = useState<EmailTemplateDetailRow[]>([]);
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrlToken, setCtaUrlToken] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isEdit || !storeCode || !templateId) return;
    setLoading(true);
    dispatch(fetchEmailTemplateDetail({ storeCode, templateId }))
      .unwrap()
      .then((template) => {
        setName(template.name);
        setSubject(template.subject);
        setPreheader(template.preheader);
        setAccentColor(template.accent_color);
        setIcon(template.icon);
        setHeading(template.heading);
        setIntro(template.body_text);
        setDetailRows(template.detail_rows || []);
        setCtaLabel(template.button_label);
        setCtaUrlToken(template.button_url);
        setFooterNote(template.footer_text);
        setIsActive(template.is_active);
      })
      .catch(() => {
        router.push("/campaign/email-templates");
      })
      .finally(() => setLoading(false));
  }, [isEdit, storeCode, templateId, dispatch, router]);

  const addDetailRow = () =>
    setDetailRows((prev) => [...prev, { ...EMPTY_ROW }]);

  const updateDetailRow = (
    index: number,
    field: keyof EmailTemplateDetailRow,
    value: string,
  ) =>
    setDetailRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );

  const removeDetailRow = (index: number) =>
    setDetailRows((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = useCallback(async () => {
    if (!storeCode) return;
    if (!name.trim() || !subject.trim() || !heading.trim() || !intro.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload: EmailTemplateWritePayload = {
      name: name.trim(),
      subject: subject.trim(),
      preheader: preheader.trim(),
      accent_color: accentColor,
      icon: icon.trim(),
      heading: heading.trim(),
      body_text: intro.trim(),
      detail_rows: detailRows.filter((r) => r.label.trim() || r.value.trim()),
      button_label: ctaLabel.trim(),
      button_url: ctaUrlToken.trim(),
      footer_text: footerNote.trim(),
      is_active: isActive,
    };

    setSubmitting(true);
    try {
      if (isEdit && templateId) {
        await dispatch(
          updateEmailTemplate({ storeCode, templateId, payload }),
        ).unwrap();
        toast.success("Template updated");
      } else {
        await dispatch(
          createEmailTemplate({ storeCode, payload }),
        ).unwrap();
        toast.success("Template created");
      }
      router.push("/campaign/email-templates");
    } catch {
      // The thunk already surfaces the error toast.
    } finally {
      setSubmitting(false);
    }
  }, [
    storeCode,
    name,
    subject,
    preheader,
    accentColor,
    icon,
    heading,
    intro,
    detailRows,
    ctaLabel,
    ctaUrlToken,
    footerNote,
    isActive,
    isEdit,
    templateId,
    dispatch,
    router,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-8" />
      </div>
    );
  }

  const previewData = {
    name,
    subject,
    preheader,
    accent_color: accentColor,
    icon,
    heading,
    body_text: intro,
    detail_rows: detailRows,
    button_label: ctaLabel,
    button_url: ctaUrlToken,
    footer_text: footerNote,
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/campaign/email-templates")}
        >
          <IconArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold">
          {isEdit ? "Edit Email Template" : "Create Email Template"}
        </h1>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_520px]">
        {/* Form */}
        <div className="flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Order Confirmation"
            />
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subject">Subject *</Label>
            <WhatsAppVariablePicker
              value={subject}
              onChange={setSubject}
              maxLength={255}
              placeholder="e.g. Your order {{order_id}} has been confirmed!"
            />
          </div>

          {/* Preheader */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="preheader">Preheader</Label>
            <Input
              id="preheader"
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              placeholder="Inbox preview text (hidden in the email body)"
              maxLength={255}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Accent Color */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="accent_color">Accent Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="accent_color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded border"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  maxLength={7}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Icon */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="icon">Icon (emoji)</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g. 📦"
                maxLength={16}
              />
            </div>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="heading">Heading *</Label>
            <WhatsAppVariablePicker
              value={heading}
              onChange={setHeading}
              maxLength={255}
              placeholder="e.g. Order Confirmed!"
            />
          </div>

          {/* Intro */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="intro">Intro Text *</Label>
            <WhatsAppVariablePicker
              value={intro}
              onChange={setIntro}
              placeholder="e.g. Hi {{customer_name}}, your order is confirmed and being prepared."
            />
          </div>

          {/* Detail Rows */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Detail Rows</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDetailRow}
              >
                <IconPlus className="size-3.5" />
                Add Row
              </Button>
            </div>
            {detailRows.map((row, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="grid flex-1 grid-cols-3 gap-2">
                  <Input
                    value={row.icon}
                    onChange={(e) =>
                      updateDetailRow(index, "icon", e.target.value)
                    }
                    placeholder="Icon"
                    maxLength={16}
                  />
                  <Input
                    value={row.label}
                    onChange={(e) =>
                      updateDetailRow(index, "label", e.target.value)
                    }
                    placeholder="Label"
                  />
                  <Input
                    value={row.value}
                    onChange={(e) =>
                      updateDetailRow(index, "value", e.target.value)
                    }
                    placeholder="Value or {{variable}}"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeDetailRow(index)}
                >
                  <IconTrash className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cta_label">Button Label</Label>
              <Input
                id="cta_label"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="e.g. Track Order"
                maxLength={40}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cta_url">Button URL / Token</Label>
              <Input
                id="cta_url"
                value={ctaUrlToken}
                onChange={(e) => setCtaUrlToken(e.target.value)}
                placeholder="e.g. {{tracking_url}}"
                maxLength={255}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="footer_note">Footer Note</Label>
            <WhatsAppVariablePicker
              value={footerNote}
              onChange={setFooterNote}
              maxLength={255}
              placeholder="e.g. Need help? Reply to this email."
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner className="size-4" />
                  {isEdit ? "Updating…" : "Creating…"}
                </>
              ) : isEdit ? (
                "Update Template"
              ) : (
                "Create Template"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/campaign/email-templates")}
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="hidden xl:block">
          <div className="sticky top-6">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Live Preview
            </h3>
            <EmailTemplateMonitorPreview template={previewData} />
          </div>
        </div>
      </div>
    </div>
  );
}
