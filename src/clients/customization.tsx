"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchWidgetCustomization,
  UpdateWidgetCustomization,
  UpdateWidgetCustomizationWithImage,
  type UpdateWidgetCustomizationPayload,
  type WidgetCustomizationDataResponse,
  type WidgetQuickAction,
  type WidgetQuickLink,
} from "@/redux/api-slice/customization-slice";
import { darken, getReadableText, mix, normalizeHex } from "@/lib/color";
import { isValidUrl, normalizeUrl } from "@/lib/url";
import {
  applyServerFieldErrors,
  formikErrorsFromZod,
  serverFieldErrors,
} from "@/lib/form-errors";
import CustomizationTheme from "@/components/custom/customization-theme";
import CustomizationActionButtons from "@/components/custom/customization-action-buttons";
import CustomizationBranding from "@/components/custom/customization-branding";
import CustomizationQuickLinks from "@/components/custom/customization-quick-links";
import CustomizationLivePreview from "@/components/custom/customization-live-preview";
import type {
  ActionButton,
  ColorKey,
  QuickLinkItem,
} from "@/components/custom/customization-types";

const DEFAULT_PRIMARY = "#6c5ce7";
const DEFAULT_SECONDARY = "#f3f4f6";
const DEFAULT_TERTIARY = "#dfe6e9";
const DEFAULT_WELCOME = "What are you shopping for today?";
const DEFAULT_GREETING = "Hi there! How can I help you today?";

type CustomizationFormValues = {
  welcome_message: string;
  greeting_message: string;
  quick_links: { name: string; url: string }[];
  quick_actions: ActionButton[];
};

const customizationValidationSchema = z
  .object({
    welcome_message: z.string(),
    greeting_message: z
      .string()
      .trim()
      .min(1, "Please enter a greeting message before saving."),
    quick_links: z.array(
      z.object({
        name: z.string(),
        url: z.string(),
      }),
    ),
    quick_actions: z.array(
      z.object({
        id: z.number().optional(),
        name: z
          .string()
          .trim()
          .min(1, "Name is required.")
          .regex(
            /^[a-zA-Z\s\-'&]+$/,
            "Only letters, spaces, apostrophes, hyphens, and ampersand are allowed.",
          ),
        message: z.string().trim().min(1, "Message is required."),
      }),
    ),
  })
  .superRefine((values, ctx) => {
    const seenNames = new Set<string>();
    values.quick_links.forEach((link, index) => {
      const name = link.name.trim().toLowerCase();
      if (!name && link.url.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["quick_links", index, "name"],
          message: "Name is required.",
        });
      }
      if (name && seenNames.has(name)) {
        ctx.addIssue({
          code: "custom",
          path: ["quick_links", index, "name"],
          message: "Duplicate name",
        });
      }
      if (name) seenNames.add(name);
      if (link.url && !isValidUrl(link.url)) {
        ctx.addIssue({
          code: "custom",
          path: ["quick_links", index, "url"],
          message: "Enter a valid URL",
        });
      }
    });
  });

const customizationErrorsFromZod = (values: CustomizationFormValues) => {
  const result = customizationValidationSchema.safeParse(values);
  const errors = result.success
    ? {}
    : (formikErrorsFromZod(result.error.issues) as Record<string, unknown>);
  const rowErrors =
    "quick_links" in errors && Array.isArray(errors.quick_links)
      ? (errors.quick_links as Record<string, string>[])
      : [];
  return { errors, rowErrors };
};

export default function Customization() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const stores = useAppSelector(
    (state) => state.GetStoresReducer.GetStoresState.GetStoresListData,
  );

  const store = stores.find((item) => item.code === storeCode);
  const storeId = store ? Number(store.id) : null;
  const storeLabel = store?.name ?? "Selected store";

  const [savingAll, setSavingAll] = useState(false);

  const [themeColor, setThemeColor] = useState(DEFAULT_PRIMARY);
  const [themeHexInput, setThemeHexInput] = useState(DEFAULT_PRIMARY);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY);
  const [secondaryHexInput, setSecondaryHexInput] = useState(DEFAULT_SECONDARY);
  const [tertiaryColor, setTertiaryColor] = useState(DEFAULT_TERTIARY);
  const [tertiaryHexInput, setTertiaryHexInput] = useState(DEFAULT_TERTIARY);

  const [welcomeMessage, setWelcomeMessage] = useState(DEFAULT_WELCOME);
  const [greetingMessage, setGreetingMessage] = useState(DEFAULT_GREETING);
  /** Per-row field errors for Quick Links from the last rejected save,
   *  indexed the same way as `quickLinks`. */
  const [quickLinkRowErrors, setQuickLinkRowErrors] = useState<
    Record<string, string>[]
  >([]);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoObjectUrlRef = useRef<string | null>(null);

  const [actionButtons, setActionButtons] = useState<ActionButton[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLinkItem[]>([]);
  const [hasQuickActionError, setHasQuickActionError] = useState(false);
  const formik = useFormik<CustomizationFormValues>({
    initialValues: {
      welcome_message: DEFAULT_WELCOME,
      greeting_message: DEFAULT_GREETING,
      quick_links: [],
      quick_actions: [],
    },
    enableReinitialize: true,
    validate: (values) => {
      const { errors, rowErrors } = customizationErrorsFromZod(values);
      setQuickLinkRowErrors(rowErrors);
      return errors;
    },
    onSubmit: async (values) => {
      if (storeId == null) return;

      const quickActions: WidgetQuickAction[] = actionButtons.map((button) => ({
        ...(button.id != null ? { id: button.id } : {}),
        name: button.name,
        message: button.message,
      }));
      const quickLinksPayload: WidgetQuickLink[] = normalizedQuickLinks.map(
        (link) => ({
          ...(link.id != null ? { id: link.id } : {}),
          name: link.label.trim(),
          url: normalizeUrl(link.url),
          priority: link.priority,
          is_active: link.active,
        }),
      );

      const payload: UpdateWidgetCustomizationPayload = {
        store: storeId,
        primary_color: themeColor,
        secondary_color: secondaryColor,
        tertiary_color: tertiaryColor,
        welcome_message: values.welcome_message,
        greeting_message: values.greeting_message.trim(),
        quick_actions: quickActions,
        quick_links: quickLinksPayload,
      };

      setSavingAll(true);
      formik.setErrors({});
      setQuickLinkRowErrors([]);
      try {
        let result;
        if (logoFile) {
          result = await dispatch(
            UpdateWidgetCustomizationWithImage({ storeId, payload, logoFile }),
          );
        } else {
          if (!logoUrl) {
            payload.logo = null;
          }
          result = await dispatch(
            UpdateWidgetCustomization({ storeId, payload }),
          );
        }

        const fulfilled =
          UpdateWidgetCustomization.fulfilled.match(result) ||
          UpdateWidgetCustomizationWithImage.fulfilled.match(result);

        if (fulfilled) {
          formik.resetForm({ values });
          populate(result.payload as WidgetCustomizationDataResponse);
        } else {
          const errors = serverFieldErrors(result.payload);
          const rowErrors: Record<string, string>[] = [];
          for (const [key, message] of Object.entries(errors)) {
            const match = /^quick_links\.(\d+)\.(.+)$/.exec(key);
            if (!match) continue;
            const index = Number(match[1]);
            const field = match[2];
            rowErrors[index] = { ...rowErrors[index], [field]: message };
          }
          applyServerFieldErrors(formik, result.payload);
          setQuickLinkRowErrors(rowErrors);
        }
      } finally {
        setSavingAll(false);
      }
    },
  });

  const fieldErrors = formik.errors as Record<string, string>;

  const applyColor = (which: ColorKey, value: string) => {
    const normalized = normalizeHex(value) ?? value;
    if (which === "primary") {
      setThemeColor(normalized);
      setThemeHexInput(normalized);
    } else if (which === "secondary") {
      setSecondaryColor(normalized);
      setSecondaryHexInput(normalized);
    } else {
      setTertiaryColor(normalized);
      setTertiaryHexInput(normalized);
    }
  };

  const handleHexChange = (which: ColorKey, raw: string) => {
    const withHash = raw.startsWith("#") ? raw : `#${raw}`;
    if (which === "primary") setThemeHexInput(withHash);
    else if (which === "secondary") setSecondaryHexInput(withHash);
    else setTertiaryHexInput(withHash);
    const normalized = normalizeHex(withHash);
    if (normalized) applyColor(which, normalized);
  };

  const revokeLogoObjectUrl = () => {
    if (logoObjectUrlRef.current) {
      URL.revokeObjectURL(logoObjectUrlRef.current);
      logoObjectUrlRef.current = null;
    }
  };

  const populate = (data: WidgetCustomizationDataResponse | null) => {
    revokeLogoObjectUrl();
    setLogoFile(null);

    if (!data) {
      applyColor("primary", DEFAULT_PRIMARY);
      applyColor("secondary", DEFAULT_SECONDARY);
      applyColor("tertiary", DEFAULT_TERTIARY);
      setWelcomeMessage(DEFAULT_WELCOME);
      setGreetingMessage(DEFAULT_GREETING);
      setLogoUrl(null);
      setActionButtons([]);
      setQuickLinks([]);
      formik.setValues({
        welcome_message: DEFAULT_WELCOME,
        greeting_message: DEFAULT_GREETING,
        quick_links: [],
        quick_actions: [],
      });
      return;
    }

    applyColor("primary", data.primary_color ?? DEFAULT_PRIMARY);
    applyColor("secondary", data.secondary_color ?? DEFAULT_SECONDARY);
    applyColor("tertiary", data.tertiary_color ?? DEFAULT_TERTIARY);
    const nextWelcome = data.welcome_message || DEFAULT_WELCOME;
    const nextGreeting = data.greeting_message?.trim()
      ? data.greeting_message
      : DEFAULT_GREETING;
    const nextActionButtons = (data.quick_actions ?? []).map((action) => ({
      id: action.id,
      name: action.name,
      message: action.message,
    }));
    const nextQuickLinks = (data.quick_links ?? []).map((link) => ({
      id: link.id,
      label: link.name,
      url: link.url,
      priority: link.priority,
      active: link.is_active,
    }));
    setWelcomeMessage(nextWelcome);
    setGreetingMessage(nextGreeting);
    setLogoUrl(data.logo?.trim() ? data.logo : null);
    setActionButtons(nextActionButtons);
    setQuickLinks(nextQuickLinks);
    formik.setValues({
      welcome_message: nextWelcome,
      greeting_message: nextGreeting,
      quick_actions: nextActionButtons,
      quick_links: nextQuickLinks.map((link) => ({
        name: link.label,
        url: link.url,
      })),
    });
  };

  useEffect(() => {
    if (storeId == null) return;
    let active = true;
    (async () => {
      const result = await dispatch(FetchWidgetCustomization(storeId));
      if (!active) return;
      if (FetchWidgetCustomization.fulfilled.match(result)) {
        populate(result.payload as WidgetCustomizationDataResponse | null);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, storeId]);

  // Revoke any outstanding object URL on unmount.
  useEffect(() => () => revokeLogoObjectUrl(), []);

  const themeVars = useMemo(() => {
    const primary = normalizeHex(themeColor) ?? DEFAULT_PRIMARY;
    const secondary = normalizeHex(secondaryColor) ?? DEFAULT_SECONDARY;
    const tertiary = normalizeHex(tertiaryColor) ?? DEFAULT_TERTIARY;
    return {
      "--cb-primary": primary,
      "--cb-primary-dark": darken(primary, 0.14),
      "--cb-shell": mix(primary, "#ffffff", 0.92),
      "--cb-icon-bg": mix(primary, "#ffffff", 0.8),
      "--cb-hover-bg": mix(primary, "#ffffff", 0.93),
      "--cb-header-text": getReadableText(primary),
      "--cb-secondary": secondary,
      "--cb-tertiary": tertiary,
    } as React.CSSProperties;
  }, [themeColor, secondaryColor, tertiaryColor]);

  /** Drops one key out of `fieldErrors` — used to clear a stale server/local
   *  rejection the moment the user edits the field it was attached to. */
  const clearFieldError = (key: string) => {
    if (!(key in formik.errors)) return;
    const next = { ...formik.errors };
    delete next[key as keyof typeof next];
    formik.setErrors(next);
  };

  const handleWelcomeChange = (value: string) => {
    setWelcomeMessage(value);
    formik.setFieldValue("welcome_message", value, false);
    clearFieldError("welcome_message");
  };

  const handleGreetingChange = (value: string) => {
    setGreetingMessage(value);
    formik.setFieldValue("greeting_message", value, false);
    clearFieldError("greeting_message");
  };

  const updateQuickLink = (index: number, patch: Partial<QuickLinkItem>) => {
    setQuickLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
    const nextLink = { ...quickLinks[index], ...patch };
    formik.setFieldValue(
      `quick_links.${index}`,
      { name: nextLink.label, url: nextLink.url },
      false,
    );
    clearFieldError("quick_links");
    // Clear only the edited fields, keeping other field and row errors visible.
    setQuickLinkRowErrors((prev) => {
      if (!prev[index] || Object.keys(prev[index]).length === 0) return prev;
      const next = [...prev];
      next[index] = { ...prev[index] };
      for (const key of Object.keys(patch)) {
        delete next[index][
          key === "label" ? "name" : key === "active" ? "is_active" : key
        ];
      }
      return next;
    });
  };

  const addQuickLink = () => {
    setQuickLinks((prev) => [
      ...prev,
      { label: "", url: "", priority: prev.length + 1, active: true },
    ]);
    formik.setFieldValue(
      "quick_links",
      [...quickLinks, { label: "", url: "" }].map((link) => ({
        name: link.label,
        url: link.url,
      })),
      false,
    );
  };

  const removeQuickLink = (index: number) => {
    setQuickLinks((prev) => prev.filter((_, i) => i !== index));
    formik.setFieldValue(
      "quick_links",
      quickLinks
        .filter((_, i) => i !== index)
        .map((link) => ({ name: link.label, url: link.url })),
      false,
    );
    setQuickLinkRowErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const normalizedQuickLinks = quickLinks
    .map((link, index) => ({
      ...link,
      label: link.label ?? "",
      url: link.url ?? "",
      priority:
        Number.isFinite(link.priority) && link.priority > 0
          ? link.priority
          : index + 1,
      active: typeof link.active === "boolean" ? link.active : true,
    }))
    .filter((link) => link.label.trim().length > 0);

  const previewQuickLinks = normalizedQuickLinks
    .filter((link) => link.active)
    .sort((a, b) => a.priority - b.priority);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file", {
        description: "Please upload a valid image (PNG, JPG, SVG, WEBP).",
      });
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large", {
        description: "Please upload an image smaller than 2MB.",
      });
      event.target.value = "";
      return;
    }

    revokeLogoObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    logoObjectUrlRef.current = objectUrl;
    setLogoFile(file);
    setLogoUrl(objectUrl);
  };

  const removeLogo = () => {
    revokeLogoObjectUrl();
    setLogoFile(null);
    setLogoUrl(null);
  };

  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex flex-col gap-6">
        <CustomizationTheme
          fieldErrors={fieldErrors}
          themeColor={themeColor}
          themeHexInput={themeHexInput}
          secondaryColor={secondaryColor}
          secondaryHexInput={secondaryHexInput}
          tertiaryColor={tertiaryColor}
          tertiaryHexInput={tertiaryHexInput}
          themeVars={themeVars}
          applyColor={applyColor}
          handleHexChange={handleHexChange}
        />
        <CustomizationActionButtons
          fieldErrors={fieldErrors}
          actionButtons={actionButtons}
          onChange={setActionButtons}
          validateActionButton={(button) => {
            const values = {
              ...formik.values,
              quick_actions: [button],
            };
            const result = customizationValidationSchema.safeParse(values);
            if (result.success) return {};
            const errors = formikErrorsFromZod(result.error.issues) as {
              quick_actions?: { name?: string; message?: string }[];
            };
            return errors.quick_actions?.[0] ?? {};
          }}
          onPendingErrorChange={setHasQuickActionError}
          onInputChange={() => clearFieldError("quick_actions")}
        />
        <CustomizationBranding
          fieldErrors={fieldErrors}
          logoUrl={logoUrl}
          welcomeMessage={welcomeMessage}
          greetingMessage={greetingMessage}
          onWelcomeChange={handleWelcomeChange}
          onGreetingChange={handleGreetingChange}
          onLogoUpload={handleLogoUpload}
          onRemoveLogo={removeLogo}
        />
        <CustomizationQuickLinks
          fieldErrors={fieldErrors}
          quickLinks={quickLinks}
          onUpdate={updateQuickLink}
          onAdd={addQuickLink}
          onRemove={removeQuickLink}
          rowErrors={quickLinkRowErrors}
        />

        <div className="flex justify-start border-t border-border py-3">
          <Button
            type="button"
            size="lg"
            onClick={() => formik.handleSubmit()}
            disabled={savingAll || hasQuickActionError}
          >
            {savingAll ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <IconDeviceFloppy data-icon="inline-start" />
            )}
            {savingAll ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="relative">
        <CustomizationLivePreview
          storeLabel={storeLabel}
          logoUrl={logoUrl}
          welcomeMessage={welcomeMessage}
          greetingMessage={greetingMessage}
          themeColor={themeColor}
          secondaryColor={secondaryColor}
          themeVars={themeVars}
          actionButtons={actionButtons}
          quickLinks={previewQuickLinks}
        />
      </div>
    </div>
  );
}
