"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { isAxiosError } from "axios";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconChevronRight,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { GetStores } from "@/redux/api-slice/stores-slice";
import {
  connectStoreIntegration,
  deleteStoreIntegration,
  fetchStoreIntegrations,
  fetchStoreIntegrationDetail,
  testStoreIntegrationConnection,
} from "@/redux/api-slice/integrations-slice";
import type {
  CoreIntegration,
  IntegrationAttribute,
  IntegrationCategory,
} from "@/lib/integration-types";
import type { IntegrationCatalogItem } from "@/lib/integration-types";
import { getIntegrationLogoUrl } from "@/lib/integration-logo";

type StepId = 0 | 1 | 2;

type StoreIntegrationRecord = {
  id: number;
  integration: number;
};

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const responseMessage = error.response?.data as
      | { message?: string; detail?: string; error?: string }
      | undefined;

    return (
      responseMessage?.message ||
      responseMessage?.detail ||
      responseMessage?.error ||
      error.message ||
      "Something went wrong."
    );
  }

  if (error instanceof Error) return error.message || "Something went wrong.";
  return "Something went wrong.";
}

function categoryStyles(category: IntegrationCategory) {
  return category === "chat"
    ? "border-violet-500/30 bg-violet-500/15 text-violet-700 dark:text-violet-300"
    : "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300";
}

function isSecretField(attr: IntegrationAttribute): boolean {
  const s = (attr.code + attr.display_name).toLowerCase();
  return (
    s.includes("key") ||
    s.includes("token") ||
    s.includes("secret") ||
    s.includes("password") ||
    s.includes("pass")
  );
}

function LogoMark({ integration }: { integration: CoreIntegration }) {
  const logoUrl = getIntegrationLogoUrl(integration.logo);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${integration.name} logo`}
        className="size-11 rounded-lg bg-background object-contain p-1 ring-1 ring-border/60"
      />
    );
  }

  return (
    <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-foreground ring-1 ring-border/60">
      {integration.name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        if (disabled) return;
        onCheckedChange(!checked);
      }}
      className={cn(
        "relative inline-flex h-8 w-14 items-center rounded-full border transition-colors duration-200",
        checked
          ? "border-emerald-600/50 bg-emerald-600/30"
          : "border-border bg-muted/60",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "inline-flex size-6 items-center justify-center rounded-full bg-background shadow-sm transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      >
        {checked ? (
          <IconCheck className="size-3.5 text-emerald-600" />
        ) : (
          <IconX className="size-3.5 text-muted-foreground" />
        )}
      </span>
    </button>
  );
}

function Stepper({ step }: { step: StepId }) {
  const labels = ["Instructions", "Credentials", "Verify"] as const;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {labels.map((label, index) => {
        const current = index as StepId;
        const active = step === current;
        const done = step > current;

        return (
          <div key={label} className="flex min-w-0 items-center gap-2">
            <div
              className={cn(
                "flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors",
                active
                  ? "border-foreground/20 bg-foreground text-background"
                  : done
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-border bg-muted text-muted-foreground",
              )}
            >
              <span className="flex size-4 items-center justify-center rounded-full bg-background/10 text-[11px]">
                {index + 1}
              </span>
              <span className="truncate">{label}</span>
            </div>
            {index < labels.length - 1 && (
              <IconChevronRight className="size-4 shrink-0 text-muted-foreground" />
            )}
          </div>
        );
      })}
    </div>
  );
}

type StoreIntegrationsTabContentProps = {
  initialIntegrations: IntegrationCatalogItem[];
};

export default function StoreIntegrationsTabContent({
  initialIntegrations,
}: StoreIntegrationsTabContentProps) {
  const dispatch = useAppDispatch();
  const selectedStoreCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const storeList = useAppSelector(
    (state) => state.GetStoresReducer.GetStoresState.GetStoresListData,
  );

  const store = useMemo(
    () => storeList.find((item) => item.code === selectedStoreCode) ?? null,
    [selectedStoreCode, storeList],
  );
  const storeId = store ? Number(store.id) : null;

  const [integrations] = useState<IntegrationCatalogItem[]>(
    () => initialIntegrations,
  );

  const [selectedIntegration, setSelectedIntegration] =
    useState<CoreIntegration | null>(null);
  const [step, setStep] = useState<StepId>(0);
  const [enabledIds, setEnabledIds] = useState<Record<number, boolean>>({});
  const [savedIds, setSavedIds] = useState<Record<number, boolean>>({});
  const [storeIntegrationIds, setStoreIntegrationIds] = useState<
    Record<number, number>
  >({});

  const [attributes, setAttributes] = useState<IntegrationAttribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<
    Record<string, string>
  >({});
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>(
    {},
  );

  const [testState, setTestState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const prefillRequestRef = useRef(0);

  useEffect(() => {
    if (!storeList.length) {
      dispatch(GetStores({}));
    }
  }, [dispatch, storeList.length]);

  useEffect(() => {
    if (storeId == null) {
      queueMicrotask(() => {
        setSavedIds({});
        setEnabledIds({});
        setStoreIntegrationIds({});
      });
      return;
    }

    let active = true;

    void (async () => {
      try {
        const data = (await fetchStoreIntegrations(
          storeId,
        )) as StoreIntegrationRecord[];
        if (!active) return;

        const ids: Record<number, boolean> = {};
        const rowIds: Record<number, number> = {};

        for (const row of data) {
          ids[row.integration] = true;
          rowIds[row.integration] = row.id;
        }

        setSavedIds(ids);
        setEnabledIds(ids);
        setStoreIntegrationIds(rowIds);
      } catch {
        // Ignore hydration errors; toggles still work if the fetch fails.
      }
    })();

    return () => {
      active = false;
    };
  }, [storeId]);

  const closePanel = (keepEnabled: boolean) => {
    prefillRequestRef.current += 1;

    if (
      selectedIntegration &&
      !keepEnabled &&
      !savedIds[selectedIntegration.id]
    ) {
      setEnabledIds((current) => ({
        ...current,
        [selectedIntegration.id]: false,
      }));
    }

    setSelectedIntegration(null);
    setStep(0);
    setAttributes([]);
    setAttributeValues({});
    setVisibleFields({});
    setTestState("idle");
    setTestMessage(null);
    setSaving(false);
  };

  const openPanel = (integration: CoreIntegration) => {
    setEnabledIds((current) => {
      const next = { ...current };
      if (selectedIntegration && selectedIntegration.id !== integration.id) {
        const previousId = selectedIntegration.id;
        if (!savedIds[previousId]) {
          next[previousId] = false;
        }
      }
      next[integration.id] = true;
      return next;
    });

    prefillRequestRef.current += 1;
    const requestId = prefillRequestRef.current;

    setSelectedIntegration(integration);
    setStep(0);
    setAttributes(integration.attributes ?? []);
    setAttributeValues({});
    setVisibleFields({});
    setTestState("idle");
    setTestMessage(null);
    setSaving(false);

    if (
      savedIds[integration.id] &&
      storeIntegrationIds[integration.id] &&
      storeId != null
    ) {
      fetchStoreIntegrationDetail(storeId, storeIntegrationIds[integration.id])
        .then((data) => {
          if (prefillRequestRef.current !== requestId) return;

          const prefilled: Record<string, string> = {};
          for (const attr of data.stored_attributes ?? []) {
            prefilled[attr.code] = attr.value;
          }
          setAttributeValues(prefilled);
        })
        .catch(() => {});
    }
  };

  const handleToggle = async (
    integration: CoreIntegration,
    checked: boolean,
  ) => {
    if (checked) {
      openPanel(integration);
      return;
    }

    if (savedIds[integration.id]) {
      const storeIntegrationId = storeIntegrationIds[integration.id];
      if (storeId == null || storeIntegrationId == null) return;

      try {
        await deleteStoreIntegration(storeId, storeIntegrationId);
        setEnabledIds((current) => ({
          ...current,
          [integration.id]: false,
        }));
        setSavedIds((current) => ({
          ...current,
          [integration.id]: false,
        }));
        setStoreIntegrationIds((current) => {
          const next = { ...current };
          delete next[integration.id];
          return next;
        });
        toast.success("Integration disabled");
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
      return;
    }

    if (selectedIntegration?.id === integration.id) {
      closePanel(false);
      return;
    }

    setEnabledIds((current) => ({
      ...current,
      [integration.id]: false,
    }));
  };

  const handleTestConnection = async () => {
    if (!selectedIntegration || storeId == null) return;

    setTestState("loading");
    setTestMessage(null);

    try {
      const response = await testStoreIntegrationConnection(
        storeId,
        selectedIntegration.id,
        attributeValues,
      );
      const message =
        (response as { message?: string; detail?: string })?.message ||
        (response as { message?: string; detail?: string })?.detail ||
        "Connection verified successfully.";
      setTestState("success");
      setTestMessage(message);
    } catch (error) {
      setTestState("error");
      setTestMessage(getErrorMessage(error));
    }
  };

  const handleSave = async () => {
    if (!selectedIntegration || storeId == null) return;
    if (testState !== "success") return;

    setSaving(true);

    try {
      const response = await connectStoreIntegration(
        storeId,
        selectedIntegration.id,
        attributeValues,
      );
      const created = response as { id: number };
      setEnabledIds((current) => ({
        ...current,
        [selectedIntegration.id]: true,
      }));
      setSavedIds((current) => ({
        ...current,
        [selectedIntegration.id]: true,
      }));
      setStoreIntegrationIds((current) => ({
        ...current,
        [selectedIntegration.id]: created.id,
      }));
      toast.success("Integration enabled");
      closePanel(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const currentSaved = selectedIntegration
    ? Boolean(savedIds[selectedIntegration.id])
    : false;
  const currentStoreIntegrationId = selectedIntegration
    ? (storeIntegrationIds[selectedIntegration.id] ?? null)
    : null;
  void currentStoreIntegrationId;

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-medium">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Browse available integrations and enable one to configure it.
          </p>
        </div>
        {store ? (
          <Badge variant="outline" className="shrink-0">
            {store.name}
          </Badge>
        ) : (
          <Badge variant="outline" className="shrink-0">
            Select a store
          </Badge>
        )}
      </div>

      {!store && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Pick a store from the sidebar before you test or save an integration.
        </div>
      )}

      {integrations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          No integrations were returned by the backend yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {integrations.map((integration) => {
            const checked = Boolean(enabledIds[integration.id]);
            const saved = Boolean(savedIds[integration.id]);

            return (
              <Card
                key={integration.id}
                size="sm"
                role="button"
                tabIndex={0}
                onClick={() => openPanel(integration)}
                onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openPanel(integration);
                  }
                }}
                className="gap-5 border-border/60 bg-card/80 shadow-none transition-transform duration-150 hover:-translate-y-0.5 hover:border-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <CardHeader className="gap-4 pb-0">
                  <div className="flex items-start gap-3">
                    <LogoMark integration={integration} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="truncate text-base">
                          {integration.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={cn(
                            "min-w-24 shrink-0 justify-center px-3 py-1 text-[11px] font-semibold capitalize tracking-wide",
                            categoryStyles(integration.category.category),
                          )}
                          title={integration.category_label}
                        >
                          {integration.category_label || "uncategorized"}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2 text-sm">
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{saved ? "Enabled" : "Not enabled yet"}</span>
                    <span>{integration.is_active ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
                    <div className="uppercase tracking-wide">Scope</div>
                    <div className="mt-1 line-clamp-2 text-foreground">
                      {integration.scope
                        ? Array.isArray(integration.scope)
                          ? integration.scope.join(", ")
                          : integration.scope
                              .split(",")
                              .map((s) => s.trim())
                              .join(", ")
                        : "No scope details provided."}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between gap-3 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      openPanel(integration);
                    }}
                  >
                    Configure
                    <IconArrowRight />
                  </Button>
                  <ToggleSwitch
                    checked={checked}
                    label={`Enable ${integration.name}`}
                    onCheckedChange={(next) =>
                      void handleToggle(integration, next)
                    }
                  />
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={Boolean(selectedIntegration)}
        onOpenChange={(open) => {
          if (!open) closePanel(false);
        }}
      >
        <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <div className="flex max-h-[calc(100vh-2rem)] flex-col">
            <DialogHeader className="border-b border-border/60 px-5 pb-3 pt-5 pr-16">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  {selectedIntegration ? (
                    <LogoMark integration={selectedIntegration} />
                  ) : null}
                  <div className="min-w-0">
                    <DialogTitle className="text-lg font-medium">
                      {selectedIntegration?.name ?? "Integration"}
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground">
                      {selectedIntegration?.description ??
                        "Choose credentials, test the connection, and save it to the store."}
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="border-b border-border/60 px-5 py-3">
              <Stepper step={step} />
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-5 px-5 py-4">
                {selectedIntegration && step === 0 && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3.5">
                      <div
                        className="space-y-3 text-sm leading-6 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:font-medium [&_ul]:list-disc [&_ul]:pl-5"
                        dangerouslySetInnerHTML={{
                          __html: selectedIntegration.steps_for_creds || "",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground">
                        Review the setup instructions before entering
                        credentials.
                      </div>
                      <Button type="button" onClick={() => setStep(1)}>
                        Next
                        <IconArrowRight />
                      </Button>
                    </div>
                  </div>
                )}

                {selectedIntegration && step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      {attributes.map((attribute) => {
                        const fieldType =
                          attribute.type === "url" ? "url" : "text";
                        const secretField = isSecretField(attribute);
                        return (
                          <Field key={attribute.code} className="space-y-2">
                            <FieldLabel htmlFor={attribute.code}>
                              {attribute.display_name}
                              {attribute.is_required ? (
                                <span className="text-destructive">*</span>
                              ) : null}
                            </FieldLabel>
                            <div className="relative">
                              <Input
                                id={attribute.code}
                                type={
                                  secretField && !visibleFields[attribute.code]
                                    ? "password"
                                    : fieldType
                                }
                                className={secretField ? "pr-16" : undefined}
                                value={attributeValues[attribute.code] ?? ""}
                                onChange={(event) => {
                                  setAttributeValues((current) => ({
                                    ...current,
                                    [attribute.code]: event.target.value,
                                  }));
                                  setTestState("idle");
                                  setTestMessage(null);
                                }}
                              />
                              {secretField && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-1 top-1/2 h-7 -translate-y-1/2 px-2 text-xs"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setVisibleFields((current) => ({
                                      ...current,
                                      [attribute.code]:
                                        !current[attribute.code],
                                    }));
                                  }}
                                >
                                  {visibleFields[attribute.code]
                                    ? "Hide"
                                    : "Show"}
                                </Button>
                              )}
                            </div>
                          </Field>
                        );
                      })}

                      {attributes.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                          No attributes were returned for this integration.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(0)}
                      >
                        <IconArrowLeft />
                        Back
                      </Button>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Button
                          type="button"
                          onClick={() => void handleTestConnection()}
                          disabled={
                            selectedIntegration == null ||
                            storeId == null ||
                            testState === "loading"
                          }
                        >
                          {testState === "loading" ? (
                            <>
                              <Spinner className="size-4" />
                              Testing...
                            </>
                          ) : (
                            <>
                              Test Connection
                              <IconChevronRight />
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setStep(2)}
                          disabled={testState !== "success"}
                        >
                          Next
                        </Button>
                      </div>
                    </div>

                    {testMessage && (
                      <div
                        className={cn(
                          "rounded-xl border px-4 py-3 text-sm",
                          testState === "success"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "border-destructive/20 bg-destructive/10 text-destructive",
                        )}
                      >
                        {testMessage}
                      </div>
                    )}
                  </div>
                )}

                {selectedIntegration && step === 2 && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                      {testState === "success"
                        ? "Connection verified successfully. Save the integration to enable it."
                        : "Run the connection test from the Credentials step before saving."}
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-4 text-sm">
                      <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                        Selected integration
                      </div>
                      <div className="font-medium text-foreground">
                        {selectedIntegration.name}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                      >
                        <IconArrowLeft />
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={
                          testState !== "success" || saving || storeId == null
                        }
                      >
                        {saving ? (
                          <>
                            <Spinner className="size-4" />
                            Saving...
                          </>
                        ) : (
                          <>
                            Save
                            <IconCheck />
                          </>
                        )}
                      </Button>
                    </div>

                    {currentSaved && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                        This integration is already enabled for the current
                        store.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            <Separator />

            <div className="border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
              {storeId == null
                ? "Select a store to test and save."
                : `Store ${store?.name ?? storeId} will receive the integration when you save.`}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
