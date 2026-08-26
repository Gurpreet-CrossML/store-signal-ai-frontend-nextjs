"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconCategory,
  IconClick,
  IconClipboardText,
  IconDeviceFloppy,
  IconDeviceMobile,
  IconFileText,
  IconLanguage,
  IconLayoutBottombar,
  IconLayoutNavbar,
  IconLink,
  IconListDetails,
  IconLoader2,
  IconMessage2,
  IconMessageCircle,
  IconPhoneCall,
  IconPhoto,
  IconPlus,
  IconSend2,
  IconTag,
  IconTrash,
  IconUpload,
  IconVariable,
  IconVideo,
  IconX,
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { InfoIcon } from "@/components/custom/info-icon";
import { useWhatsAppAccount } from "@/components/custom/social-ai/use-whatsapp-account";
import { WhatsAppPhoneMockup } from "@/components/custom/social-ai/whatsapp-phone-mockup";
import { WhatsAppVariablePicker } from "@/components/custom/social-ai/whatsapp-variable-picker";
import {
  extractVariableTokens,
  findUnknownVariables,
  renderPreviewText,
  WHATSAPP_LANGUAGES,
  WHATSAPP_VARIABLES_BY_TOKEN,
} from "@/lib/whatsapp-template-fields";
import { useAppDispatch } from "@/redux/hooks";
import {
  createWhatsAppTemplateDraft,
  fetchLocalWhatsAppTemplate,
  fetchWhatsAppTemplateDraft,
  submitWhatsAppTemplate,
  submitWhatsAppTemplateDraft,
  updateWhatsAppTemplate,
  updateWhatsAppTemplateDraft,
  uploadWhatsAppTemplateMedia,
  type WhatsAppTemplateComponent,
} from "@/redux/api-slice/social-ai-slice";

const CATEGORY_OPTIONS = [
  { value: "MARKETING", label: "Marketing" },
  { value: "UTILITY", label: "Utility" },
  { value: "AUTHENTICATION", label: "Authentication" },
];

const HEADER_FORMATS = [
  { value: "NONE", label: "None" },
  { value: "TEXT", label: "Text" },
  { value: "IMAGE", label: "Image" },
  { value: "VIDEO", label: "Video" },
  { value: "DOCUMENT", label: "Document" },
] as const;

type HeaderFormat = (typeof HEADER_FORMATS)[number]["value"];

const BUTTON_TYPES = [
  { value: "QUICK_REPLY", label: "Quick Reply", icon: IconMessageCircle },
  { value: "URL", label: "Website URL", icon: IconLink },
  { value: "PHONE_NUMBER", label: "Phone Number", icon: IconPhoneCall },
] as const;

type ButtonType = (typeof BUTTON_TYPES)[number]["value"];

type ButtonDraft = {
  key: string;
  type: ButtonType;
  text: string;
  url: string;
  phoneNumber: string;
};

const MAX_BUTTONS = 3;

function newButtonDraft(): ButtonDraft {
  return {
    key: crypto.randomUUID(),
    type: "QUICK_REPLY",
    text: "",
    url: "",
    phoneNumber: "",
  };
}

function sanitizeName(raw: string) {
  return raw.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
}

export default function WhatsAppTemplateCreate({
  templateId,
  draftId,
}: {
  templateId?: string;
  draftId?: string;
} = {}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { storeCode, account, loading: accountLoading } = useWhatsAppAccount();
  const isEditMode = Boolean(templateId);
  // Stable, URL-driven — controls heading/copy only. Separate from
  // savedDraftId below (which also updates after an in-session "Save
  // Draft") so the page chrome doesn't shift under the user mid-edit.
  const isDraftMode = Boolean(draftId);

  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en_US");
  const [category, setCategory] = useState("MARKETING");

  const [headerFormat, setHeaderFormat] = useState<HeaderFormat>("NONE");
  const [headerText, setHeaderText] = useState("");
  const [headerPreviewUrl, setHeaderPreviewUrl] = useState<string | null>(null);
  const [headerHandle, setHeaderHandle] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [buttons, setButtons] = useState<ButtonDraft[]>([]);
  // Per-template overrides for a body variable's review sample — keyed by
  // bare token, only entries the user has actually edited (see bodyTokens'
  // rendering below for the registry-default fallback when a token has no
  // override yet).
  const [variableSamples, setVariableSamples] = useState<
    Record<string, string>
  >({});

  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(
    isEditMode || isDraftMode,
  );
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  // The draft this session is saving to — seeded from the URL when resuming
  // one, then set after the FIRST successful in-session "Save Draft" so a
  // second click updates that same row instead of creating a duplicate.
  const [savedDraftId, setSavedDraftId] = useState<number | null>(
    draftId ? Number(draftId) : null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (headerPreviewUrl) URL.revokeObjectURL(headerPreviewUrl);
    };
  }, [headerPreviewUrl]);

  // Edit/draft mode: load the local mirror once the account resolves, and
  // prefill every field from its raw components — the exact array
  // originally submitted (or last saved), so this is a straight parse
  // rather than a reconstruction. Both endpoints return the same shape
  // (see WhatsAppTemplateLocalDetail), so one effect covers both.
  useEffect(() => {
    if ((!templateId && !draftId) || !storeCode || !account) return;
    let cancelled = false;

    const fetchPromise = templateId
      ? dispatch(
          fetchLocalWhatsAppTemplate({
            storeCode,
            accountId: String(account.id),
            metaTemplateId: templateId,
          }),
        ).unwrap()
      : dispatch(
          fetchWhatsAppTemplateDraft({
            storeCode,
            accountId: String(account.id),
            draftId: Number(draftId),
          }),
        ).unwrap();

    fetchPromise
      .then((data) => {
        if (cancelled) return;
        setName(data.name);
        setLanguage(data.language);
        setCategory(data.category);
        setExistingStatus(data.status);

        const header = data.components.find((c) => c.type === "HEADER");
        if (header?.format === "TEXT") {
          setHeaderFormat("TEXT");
          setHeaderText(header.text ?? "");
        } else if (
          header?.format === "IMAGE" ||
          header?.format === "VIDEO" ||
          header?.format === "DOCUMENT"
        ) {
          setHeaderFormat(header.format);
          setHeaderHandle(header.example?.header_handle?.[0] ?? null);
        }

        const bodyComponent = data.components.find((c) => c.type === "BODY");
        setBody(bodyComponent?.text ?? "");
        setFooter(data.components.find((c) => c.type === "FOOTER")?.text ?? "");

        const namedParams = bodyComponent?.example?.body_text_named_params;
        if (namedParams?.length) {
          setVariableSamples(
            Object.fromEntries(
              namedParams.map((param) => [param.param_name, param.example]),
            ),
          );
        }

        const buttonsComponent = data.components.find(
          (c) => c.type === "BUTTONS",
        );
        if (buttonsComponent?.buttons?.length) {
          setButtons(
            buttonsComponent.buttons.map((b) => ({
              key: crypto.randomUUID(),
              type: (b.type as ButtonType) || "QUICK_REPLY",
              text: b.text || "",
              url: b.url || "",
              phoneNumber: b.phone_number || "",
            })),
          );
        }
      })
      .catch(() => {
        // The thunk already surfaced an error toast — nothing to edit.
        if (!cancelled) router.push("/campaign/whatsapp-templates");
      })
      .finally(() => {
        if (!cancelled) setLoadingTemplate(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, draftId, storeCode, account?.id]);

  const handleHeaderFormatChange = (format: HeaderFormat) => {
    setHeaderFormat(format);
    if (format !== "IMAGE" && format !== "VIDEO" && format !== "DOCUMENT") {
      if (headerPreviewUrl) URL.revokeObjectURL(headerPreviewUrl);
      setHeaderPreviewUrl(null);
      setHeaderHandle(null);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !storeCode || !account) return;

    if (headerPreviewUrl) URL.revokeObjectURL(headerPreviewUrl);
    setHeaderPreviewUrl(URL.createObjectURL(file));
    setHeaderHandle(null);
    setUploadingMedia(true);
    try {
      const result = await dispatch(
        uploadWhatsAppTemplateMedia({
          storeCode,
          accountId: String(account.id),
          file,
        }),
      ).unwrap();
      setHeaderHandle(result.header_handle);
    } catch {
      // The thunk already surfaces the error toast.
      setHeaderPreviewUrl(null);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveMedia = () => {
    if (headerPreviewUrl) URL.revokeObjectURL(headerPreviewUrl);
    setHeaderPreviewUrl(null);
    setHeaderHandle(null);
  };

  const addButton = () =>
    setButtons((prev) =>
      prev.length >= MAX_BUTTONS ? prev : [...prev, newButtonDraft()],
    );
  const removeButton = (key: string) =>
    setButtons((prev) => prev.filter((b) => b.key !== key));
  const updateButton = (key: string, patch: Partial<ButtonDraft>) =>
    setButtons((prev) =>
      prev.map((b) => (b.key === key ? { ...b, ...patch } : b)),
    );

  const buildButtonComponents = () =>
    buttons
      .filter((b) => b.text.trim())
      .map((b) => {
        if (b.type === "URL") {
          return { type: "URL", text: b.text.trim(), url: b.url.trim() };
        }
        if (b.type === "PHONE_NUMBER") {
          return {
            type: "PHONE_NUMBER",
            text: b.text.trim(),
            phone_number: b.phoneNumber.trim(),
          };
        }
        return { type: "QUICK_REPLY", text: b.text.trim() };
      });

  // What actually gets submitted to Meta — the real, opaque media handle
  // from the resumable upload (not a URL; Meta resolves it server-side).
  // Every recognized {{token}} currently in the body — drives both the
  // "Variable samples" section below and the two component builders.
  const bodyTokens = useMemo(() => extractVariableTokens(body), [body]);

  // The sample that'll actually be used for a token: the user's own
  // override if they've set one, else the registry default — same rule the
  // "Variable samples" inputs display, so what's shown is what's sent.
  const sampleFor = (token: string) =>
    variableSamples[token]?.trim() || WHATSAPP_VARIABLES_BY_TOKEN[token].sample;

  const submitComponents = useMemo((): WhatsAppTemplateComponent[] => {
    const components: WhatsAppTemplateComponent[] = [];
    if (headerFormat === "TEXT" && headerText.trim()) {
      components.push({
        type: "HEADER",
        format: "TEXT",
        text: headerText.trim(),
      });
    } else if (headerFormat !== "NONE" && headerHandle) {
      components.push({
        type: "HEADER",
        format: headerFormat,
        example: { header_handle: [headerHandle] },
      });
    }

    components.push({
      type: "BODY",
      text: body,
      ...(bodyTokens.length
        ? {
            example: {
              body_text_named_params: bodyTokens.map((token) => ({
                param_name: token,
                example: sampleFor(token),
              })),
            },
          }
        : {}),
    });

    if (footer.trim()) components.push({ type: "FOOTER", text: footer.trim() });

    const buttonComponents = buildButtonComponents();
    if (buttonComponents.length) {
      components.push({ type: "BUTTONS", buttons: buttonComponents });
    }
    return components;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    headerFormat,
    headerText,
    headerHandle,
    body,
    bodyTokens,
    variableSamples,
    footer,
    buttons,
  ]);

  // What the live preview shows — a local object URL stands in for the
  // media (the real handle isn't a renderable image), and named tokens are
  // swapped for sample values (the user's override, or the registry
  // default) so the bubble reads like a real message rather than raw
  // {{...}} syntax.
  const previewComponents = useMemo((): WhatsAppTemplateComponent[] => {
    const components: WhatsAppTemplateComponent[] = [];
    if (headerFormat === "TEXT" && headerText.trim()) {
      components.push({
        type: "HEADER",
        format: "TEXT",
        text: renderPreviewText(headerText.trim()),
      });
    } else if (headerFormat !== "NONE" && headerPreviewUrl) {
      components.push({
        type: "HEADER",
        format: headerFormat,
        example: { header_handle: [headerPreviewUrl] },
      });
    }
    components.push({
      type: "BODY",
      text: renderPreviewText(body, variableSamples),
    });
    if (footer.trim()) {
      components.push({
        type: "FOOTER",
        text: renderPreviewText(footer.trim()),
      });
    }
    const buttonComponents = buildButtonComponents();
    if (buttonComponents.length) {
      components.push({ type: "BUTTONS", buttons: buttonComponents });
    }
    return components;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    headerFormat,
    headerText,
    headerPreviewUrl,
    body,
    variableSamples,
    footer,
    buttons,
  ]);

  const unknownVariables = useMemo(() => findUnknownVariables(body), [body]);
  const mediaPending =
    headerFormat !== "NONE" && headerFormat !== "TEXT" && !headerHandle;

  // The bar every save clears, draft or real: a name to identify it by, a
  // body to actually say something, and no variable this app doesn't know
  // how to resolve.
  const baseValidationError = !name.trim()
    ? "Template name is required."
    : !body.trim()
      ? "Body text is required."
      : unknownVariables.length
        ? `Unsupported variable${unknownVariables.length > 1 ? "s" : ""}: ${unknownVariables
            .map((token) => `{{${token}}}`)
            .join(", ")}`
        : null;

  // Save Draft is deliberately looser than Submit — a draft is exactly the
  // "come back and finish later" case, so it shouldn't demand the header
  // media be uploaded yet.
  const draftValidationError = baseValidationError;

  const validationError =
    baseValidationError ??
    (mediaPending
      ? uploadingMedia
        ? "Waiting for the media sample to finish uploading…"
        : "Upload a media sample for the header, or switch it to Text/None."
      : !account
        ? "No WhatsApp account connected for this store."
        : null);

  const handleSaveDraft = async () => {
    if (!storeCode || !account) return;
    if (draftValidationError) {
      toast.error(draftValidationError);
      return;
    }
    setSavingDraft(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        language,
        components: submitComponents,
        parameter_format: "NAMED" as const,
      };
      const result = savedDraftId
        ? await dispatch(
            updateWhatsAppTemplateDraft({
              storeCode,
              accountId: String(account.id),
              draftId: savedDraftId,
              payload,
            }),
          ).unwrap()
        : await dispatch(
            createWhatsAppTemplateDraft({
              storeCode,
              accountId: String(account.id),
              payload,
            }),
          ).unwrap();
      setSavedDraftId(result.local_id);
      setExistingStatus(result.status);
      toast.success("Draft saved", {
        description:
          "Find it later in the templates list — it won't be sent to Meta until you submit it.",
      });
    } catch {
      // The thunk already surfaces the error toast.
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!storeCode || !account || validationError) {
      if (validationError) toast.error(validationError);
      return;
    }
    setSubmitting(true);
    try {
      if (isEditMode && templateId) {
        await dispatch(
          updateWhatsAppTemplate({
            storeCode,
            accountId: String(account.id),
            metaTemplateId: templateId,
            payload: {
              category,
              components: submitComponents,
              parameter_format: "NAMED",
            },
          }),
        ).unwrap();
        toast.success("Template updated", {
          description:
            "Your changes were sent to Meta. If the content changed, it'll be re-reviewed before going live.",
        });
      } else if (savedDraftId) {
        // Promote whatever draft this session has been saving to — not a
        // fresh submission, so nothing's left behind for a duplicate.
        const result = await dispatch(
          submitWhatsAppTemplateDraft({
            storeCode,
            accountId: String(account.id),
            draftId: savedDraftId,
          }),
        ).unwrap();
        toast.success("Template submitted for review", {
          description: `Meta status: ${result.status}. It'll show up in the templates list once reviewed.`,
        });
      } else {
        const result = await dispatch(
          submitWhatsAppTemplate({
            storeCode,
            accountId: String(account.id),
            payload: {
              name: name.trim(),
              category,
              language,
              components: submitComponents,
              parameter_format: "NAMED",
            },
          }),
        ).unwrap();
        toast.success("Template submitted for review", {
          description: `Meta status: ${result.status}. It'll show up in the templates list once reviewed.`,
        });
      }
      router.push("/campaign/whatsapp-templates");
    } catch {
      // The thunk already surfaces the error toast.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            aria-label="Back to templates"
          >
            <Link href="/campaign/whatsapp-templates">
              <IconArrowLeft />
            </Link>
          </Button>
          <div>
            <Typography variant="h4" as="h1">
              {isEditMode
                ? "Edit WhatsApp Template"
                : isDraftMode
                  ? "Edit Draft"
                  : "Create WhatsApp Template"}
            </Typography>
            <Typography variant="muted">
              {isEditMode
                ? "Update your template's content. Name and language can't be changed after creation."
                : isDraftMode
                  ? "Continue editing this draft. Nothing reaches Meta until you submit it for review."
                  : "Design and personalize your template using variables to engage your customers."}
            </Typography>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isEditMode && (
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={savingDraft || accountLoading || loadingTemplate}
            >
              {savingDraft ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconDeviceFloppy className="size-4" />
              )}
              {savingDraft ? "Saving…" : "Save Draft"}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={submitting || accountLoading || loadingTemplate}
          >
            {submitting ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : isEditMode ? (
              <IconDeviceFloppy className="size-4" />
            ) : (
              <IconSend2 className="size-4" />
            )}
            {isEditMode ? "Save Changes" : "Submit for Review"}
          </Button>
        </div>
      </div>

      {loadingTemplate ? (
        <div className="flex items-center justify-center py-24">
          <Spinner className="size-6" />
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-6">
            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconClipboardText className="size-4" />
                  Template Details
                  <InfoIcon text="The basics Meta uses to identify and review this template." />
                </CardTitle>
                <CardDescription>
                  Name, language, and category — Meta checks these first.
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-4">
                <Field className="gap-2">
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor="wa-template-name">
                      <IconTag className="size-4" />
                      Template Name
                      <span className="-ml-1 text-xs text-destructive">*</span>
                      <InfoIcon text="Meta's own identifier for this template — lowercase letters, numbers and underscores only, and can't be changed once it's created." />
                    </FieldLabel>
                    <FieldDescription>
                      {isEditMode
                        ? "Name can't be changed after a template is created."
                        : "Unique name to identify your template."}
                    </FieldDescription>
                  </div>
                  <div className="relative">
                    <Input
                      id="wa-template-name"
                      value={name}
                      onChange={(event) =>
                        setName(sanitizeName(event.target.value))
                      }
                      placeholder="e.g. order_confirmation_v1"
                      maxLength={512}
                      className="pr-16"
                      disabled={isEditMode}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                      {name.length}/512
                    </span>
                  </div>
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field className="gap-2">
                    <FieldLabel>
                      <IconLanguage className="size-4" />
                      Language
                      <InfoIcon text="The language customers see this template in. Meta reviews and approves each language separately, even for the same name." />
                    </FieldLabel>
                    <Select
                      value={language}
                      onValueChange={setLanguage}
                      disabled={isEditMode}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {/* WHATSAPP_LANGUAGES is a curated subset, not
                          exhaustive — an edited template's stored code might
                          not be in it, so it gets its own option rather than
                          the Select showing blank. */}
                        {!WHATSAPP_LANGUAGES.some((l) => l.code === language) &&
                          language && (
                            <SelectItem value={language}>{language}</SelectItem>
                          )}
                        {WHATSAPP_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.label} ({lang.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isEditMode && (
                      <FieldDescription>
                        Language can&apos;t be changed after creation.
                      </FieldDescription>
                    )}
                  </Field>
                  <Field className="gap-2">
                    <FieldLabel>
                      <IconCategory className="size-4" />
                      Category
                      <InfoIcon text="Meta's classification for this template — affects which pricing tier it falls into and how strictly the wording gets reviewed." />
                    </FieldLabel>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Choose the best category for your template.
                    </FieldDescription>
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconLayoutNavbar className="size-4" />
                  Header (Optional)
                  <InfoIcon text="An optional title or media shown above the message body — image, video, document, or a short line of text." />
                </CardTitle>
                <CardDescription>
                  Add a title or choose media for your header.
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-3">
                <div className="flex flex-wrap gap-2">
                  {HEADER_FORMATS.map((format) => (
                    <Button
                      key={format.value}
                      type="button"
                      size="sm"
                      variant={
                        headerFormat === format.value ? "default" : "outline"
                      }
                      onClick={() => handleHeaderFormatChange(format.value)}
                    >
                      {format.label}
                    </Button>
                  ))}
                </div>

                {headerFormat === "TEXT" && (
                  <div className="relative">
                    <Input
                      value={headerText}
                      onChange={(event) => setHeaderText(event.target.value)}
                      placeholder="Enter header text"
                      maxLength={60}
                      className="pr-16"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                      {headerText.length}/60
                    </span>
                  </div>
                )}

                {(headerFormat === "IMAGE" ||
                  headerFormat === "VIDEO" ||
                  headerFormat === "DOCUMENT") && (
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={
                        headerFormat === "IMAGE"
                          ? "image/*"
                          : headerFormat === "VIDEO"
                            ? "video/*"
                            : undefined
                      }
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {headerPreviewUrl || headerHandle ? (
                      <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                        {headerFormat === "IMAGE" ? (
                          <IconPhoto className="size-4 text-muted-foreground" />
                        ) : headerFormat === "VIDEO" ? (
                          <IconVideo className="size-4 text-muted-foreground" />
                        ) : (
                          <IconFileText className="size-4 text-muted-foreground" />
                        )}
                        <Typography variant="small">
                          {uploadingMedia
                            ? "Uploading…"
                            : headerPreviewUrl
                              ? "Sample uploaded"
                              : "Existing media attached"}
                        </Typography>
                        {uploadingMedia && (
                          <IconLoader2 className="size-3.5 animate-spin text-muted-foreground" />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Remove media sample"
                          onClick={handleRemoveMedia}
                        >
                          <IconX className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <IconUpload className="size-4" />
                        Upload sample
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconMessage2 className="size-4" />
                  Body
                  <span className="-ml-1 text-xs text-destructive">*</span>
                  <InfoIcon text="The main message text. Insert variables like {{customer_name}} to personalize it — Meta requires a sample value for each one before it'll review the template." />
                </CardTitle>
                <CardDescription>
                  Enter the main message content.
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-2">
                <WhatsAppVariablePicker
                  value={body}
                  onChange={setBody}
                  maxLength={1024}
                  placeholder={
                    "Hi {{customer_name}},\n\nThank you for your order {{order_number}}."
                  }
                />
              </CardContent>
            </Card>

            {bodyTokens.length > 0 && (
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconVariable className="size-4" />
                    Variable Samples
                    <InfoIcon text="Meta needs one example value per variable to review your template — these examples are never sent to real customers." />
                  </CardTitle>
                  <CardDescription>
                    Add a sample for each variable so Meta can review your
                    template. Samples are only used for review — they won&apos;t
                    be sent to your customers. Don&apos;t include any real
                    customer information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="gap-3">
                  <div className="flex flex-col gap-2">
                    {bodyTokens.map((token) => (
                      <div key={token} className="flex items-center gap-2">
                        <span className="shrink-0 rounded-md border bg-muted px-2 py-1.5 font-mono text-xs text-muted-foreground">
                          {`{{${token}}}`}
                        </span>
                        <Input
                          value={
                            variableSamples[token] ??
                            WHATSAPP_VARIABLES_BY_TOKEN[token].sample
                          }
                          onChange={(event) =>
                            setVariableSamples((prev) => ({
                              ...prev,
                              [token]: event.target.value,
                            }))
                          }
                          maxLength={100}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Reset ${token} to its default sample`}
                          onClick={() =>
                            setVariableSamples((prev) => {
                              const next = { ...prev };
                              delete next[token];
                              return next;
                            })
                          }
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconLayoutBottombar className="size-4" />
                  Footer (Optional)
                  <InfoIcon text="Static text only — footers can't contain variables. Good for a tagline, business hours, or a one-line disclaimer." />
                </CardTitle>
                <CardDescription>Add a short footer text.</CardDescription>
              </CardHeader>
              <CardContent className="gap-2">
                <div className="relative">
                  <Input
                    value={footer}
                    onChange={(event) => setFooter(event.target.value)}
                    placeholder="Enter footer text"
                    maxLength={60}
                    className="pr-16"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                    {footer.length}/60
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconClick className="size-4" />
                  Buttons (Optional)
                  <InfoIcon text="Quick Reply buttons let customers respond with one tap; Website URL and Phone Number buttons open a link or start a call. Up to 3 per template." />
                </CardTitle>
                <CardDescription>
                  Add quick-reply, link, or call buttons below the message.
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-3">
                {buttons.map((btn) => (
                  <div
                    key={btn.key}
                    className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center"
                  >
                    <Select
                      value={btn.type}
                      onValueChange={(value) =>
                        updateButton(btn.key, { type: value as ButtonType })
                      }
                    >
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUTTON_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={btn.text}
                      onChange={(event) =>
                        updateButton(btn.key, { text: event.target.value })
                      }
                      placeholder="Button text"
                      maxLength={25}
                      className="sm:flex-1"
                    />
                    {btn.type === "URL" && (
                      <Input
                        value={btn.url}
                        onChange={(event) =>
                          updateButton(btn.key, { url: event.target.value })
                        }
                        placeholder="https://example.com"
                        className="sm:flex-1"
                      />
                    )}
                    {btn.type === "PHONE_NUMBER" && (
                      <Input
                        value={btn.phoneNumber}
                        onChange={(event) =>
                          updateButton(btn.key, {
                            phoneNumber: event.target.value,
                          })
                        }
                        placeholder="15551234567"
                        className="sm:flex-1"
                      />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove button"
                      onClick={() => removeButton(btn.key)}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addButton}
                  disabled={buttons.length >= MAX_BUTTONS}
                  className="self-start"
                >
                  <IconPlus className="size-4" />
                  Add Button
                </Button>
                {buttons.length >= MAX_BUTTONS && (
                  <Typography variant="caption">
                    Up to {MAX_BUTTONS} buttons per template.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <IconDeviceMobile className="size-4" />
                    Template Preview
                    <InfoIcon text="Updates live as you edit the form — this shows one recipient's device, not Meta's actual review queue." />
                  </span>
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    WhatsApp Preview
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WhatsAppPhoneMockup
                  accountName={account?.name || ""}
                  isVerified={Boolean(account?.is_active)}
                  components={previewComponents}
                />
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconListDetails className="size-4" />
                  Template Summary
                  <InfoIcon text="A quick recap of what's about to be saved or submitted." />
                </CardTitle>
              </CardHeader>
              <CardContent className="gap-4">
                {existingStatus && (
                  <div className="flex items-center justify-between gap-2">
                    <Typography variant="caption">Current Status</Typography>
                    <WhatsAppTemplateStatusBadge status={existingStatus} />
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <Typography variant="caption">Name</Typography>
                  <Typography variant="small">{name || "—"}</Typography>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Typography variant="caption">Category</Typography>
                  <WhatsAppTemplateCategoryBadge category={category} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Typography variant="caption">Language</Typography>
                  <Typography variant="small">{language}</Typography>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Typography variant="caption">Variable Type</Typography>
                  <Badge variant="outline">Name</Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Typography variant="caption">Media Sample</Typography>
                  <Typography variant="small">
                    {headerFormat === "NONE" || headerFormat === "TEXT"
                      ? "None"
                      : headerFormat.charAt(0) +
                        headerFormat.slice(1).toLowerCase()}
                  </Typography>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-medium text-primary">
                Follow WhatsApp&apos;s template guidelines
              </p>
              <p className="mt-1 text-muted-foreground">
                Templates will be reviewed by Meta before they can be used to
                send messages.
              </p>
              <a
                href="https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-medium text-primary hover:underline"
              >
                Learn more →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
