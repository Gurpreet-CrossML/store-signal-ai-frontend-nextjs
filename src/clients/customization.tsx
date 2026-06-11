"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  CreateWidgetCustomization,
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

export default function Customization() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const stores = useAppSelector(
    (state) => state.GetStoresReducer.GetStoresState.GetStoresListData,
  );
  // const { FetchWidgetCustomizationIsLoading } = useAppSelector(
  //     (state) => state.GetCustomizationReducer.FetchWidgetCustomizationState
  // );

  const store = stores.find((item) => item.code === storeCode);
  const storeId = store ? Number(store.id) : null;
  const storeLabel = store?.name ?? "Selected store";

  const [widgetExists, setWidgetExists] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  // const [hydrated, setHydrated] = useState(false);

  const [themeColor, setThemeColor] = useState(DEFAULT_PRIMARY);
  const [themeHexInput, setThemeHexInput] = useState(DEFAULT_PRIMARY);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY);
  const [secondaryHexInput, setSecondaryHexInput] = useState(DEFAULT_SECONDARY);
  const [tertiaryColor, setTertiaryColor] = useState(DEFAULT_TERTIARY);
  const [tertiaryHexInput, setTertiaryHexInput] = useState(DEFAULT_TERTIARY);

  const [welcomeMessage, setWelcomeMessage] = useState(DEFAULT_WELCOME);
  const [greetingMessage, setGreetingMessage] = useState(DEFAULT_GREETING);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoObjectUrlRef = useRef<string | null>(null);

  const [actionButtons, setActionButtons] = useState<ActionButton[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLinkItem[]>([]);

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
      setWidgetExists(false);
      applyColor("primary", DEFAULT_PRIMARY);
      applyColor("secondary", DEFAULT_SECONDARY);
      applyColor("tertiary", DEFAULT_TERTIARY);
      setWelcomeMessage(DEFAULT_WELCOME);
      setGreetingMessage(DEFAULT_GREETING);
      setLogoUrl(null);
      setActionButtons([]);
      setQuickLinks([]);
      return;
    }

    setWidgetExists(true);
    applyColor("primary", data.primary_color ?? DEFAULT_PRIMARY);
    applyColor("secondary", data.secondary_color ?? DEFAULT_SECONDARY);
    applyColor("tertiary", data.tertiary_color ?? DEFAULT_TERTIARY);
    setWelcomeMessage(data.welcome_message || DEFAULT_WELCOME);
    setGreetingMessage(
      data.greeting_message?.trim() ? data.greeting_message : DEFAULT_GREETING,
    );
    setLogoUrl(data.logo?.trim() ? data.logo : null);
    setActionButtons(
      (data.quick_actions ?? []).map((action) => ({
        id: action.id,
        name: action.name,
        message: action.message,
      })),
    );
    setQuickLinks(
      (data.quick_links ?? []).map((link) => ({
        id: link.id,
        label: link.name,
        url: link.url,
        priority: link.priority,
        active: link.is_active,
      })),
    );
  };

  useEffect(() => {
    if (storeId == null) return;
    let active = true;
    // setHydrated(false);
    (async () => {
      const result = await dispatch(FetchWidgetCustomization(storeId));
      if (!active) return;
      if (FetchWidgetCustomization.fulfilled.match(result)) {
        populate(result.payload as WidgetCustomizationDataResponse | null);
      }
      // setHydrated(true);
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

  const updateQuickLink = (index: number, patch: Partial<QuickLinkItem>) => {
    setQuickLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  };

  const addQuickLink = () => {
    setQuickLinks((prev) => [
      ...prev,
      { label: "", url: "", priority: prev.length + 1, active: true },
    ]);
  };

  const removeQuickLink = (index: number) => {
    setQuickLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const normalizedQuickLinks = useMemo(
    () =>
      quickLinks
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
        .filter((link) => link.label.trim().length > 0),
    [quickLinks],
  );

  const previewQuickLinks = useMemo(
    () =>
      normalizedQuickLinks
        .filter((link) => link.active)
        .sort((a, b) => a.priority - b.priority),
    [normalizedQuickLinks],
  );

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

  const handleSaveAll = async () => {
    if (storeId == null) return;

    if (
      normalizedQuickLinks.some(
        (link) => link.url !== "" && !isValidUrl(link.url),
      )
    ) {
      toast.error("Invalid links", {
        description:
          "Please fix any invalid URLs in Quick Links before saving.",
      });
      return;
    }
    if (!greetingMessage.trim()) {
      toast.error("Greeting is empty", {
        description: "Please enter a greeting message before saving.",
      });
      return;
    }

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
      primary_color: themeColor,
      secondary_color: secondaryColor,
      tertiary_color: tertiaryColor,
      welcome_message: welcomeMessage,
      greeting_message: greetingMessage.trim(),
      quick_actions: quickActions,
      quick_links: quickLinksPayload,
    };

    setSavingAll(true);
    try {
      let result;
      if (!widgetExists) {
        result = await dispatch(
          CreateWidgetCustomization({ storeId, payload }),
        );
        if (CreateWidgetCustomization.fulfilled.match(result) && logoFile) {
          result = await dispatch(
            UpdateWidgetCustomizationWithImage({
              storeId,
              payload: {},
              logoFile,
            }),
          );
        }
      } else if (logoFile) {
        result = await dispatch(
          UpdateWidgetCustomizationWithImage({ storeId, payload, logoFile }),
        );
      } else {
        result = await dispatch(
          UpdateWidgetCustomization({ storeId, payload }),
        );
      }

      const fulfilled =
        CreateWidgetCustomization.fulfilled.match(result) ||
        UpdateWidgetCustomization.fulfilled.match(result) ||
        UpdateWidgetCustomizationWithImage.fulfilled.match(result);

      if (fulfilled) {
        populate(result.payload as WidgetCustomizationDataResponse);
      }
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex flex-col gap-6">
        <CustomizationTheme
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
          actionButtons={actionButtons}
          onChange={setActionButtons}
        />
        <CustomizationBranding
          logoUrl={logoUrl}
          welcomeMessage={welcomeMessage}
          greetingMessage={greetingMessage}
          onWelcomeChange={setWelcomeMessage}
          onGreetingChange={setGreetingMessage}
          onLogoUpload={handleLogoUpload}
          onRemoveLogo={removeLogo}
        />
        <CustomizationQuickLinks
          quickLinks={quickLinks}
          onUpdate={updateQuickLink}
          onAdd={addQuickLink}
          onRemove={removeQuickLink}
        />

        <div className="sticky bottom-0 z-10 flex justify-end border-t border-border bg-background py-3">
          <Button
            type="button"
            size="lg"
            onClick={handleSaveAll}
            disabled={savingAll}
          >
            {savingAll && <Spinner data-icon="inline-start" />}
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
