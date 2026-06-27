"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { isAxiosError } from "axios";
import {
  IconCheck,
  IconDotsVertical,
  IconHeadset,
  IconMessageChatbot,
  IconPencil,
  IconSearch,
  IconSettingsCog,
  IconTrash,
  IconBrandSlack,
  IconBrandWhatsapp,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "@/redux/axios-config";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { GetStores } from "@/redux/api-slice/stores-slice";

type PlatformCategory = "support" | "chat";
type FilterState = "all" | "available" | "connected";
type VerificationState = "idle" | "loading" | "success" | "error";

type PlatformKey =
  | "freshdesk"
  | "zendesk"
  | "gorgias"
  | "intercom"
  | "zoho_desk"
  | "whatsapp"
  | "slack";

type PlatformMeta = {
  key: PlatformKey;
  category: PlatformCategory;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
};

type IntegrationRecord = {
  id: number;
  platform: PlatformKey;
  category: PlatformCategory;
  is_active: boolean;
  api_url?: string | null;
  api_key?: string | null;
  username?: string | null;
  access_token?: string | null;
  client_id?: string | null;
  client_secret?: string | null;
};

type ConfirmAction =
  | {
      type: "delete";
      integration: IntegrationRecord;
    }
  | {
      type: "activate";
      integration: IntegrationRecord;
      nextActive: boolean;
      currentActivePlatform?: string;
    };

const PLATFORMS: PlatformMeta[] = [
  {
    key: "freshdesk",
    category: "support",
    label: "Freshdesk",
    description: "Connect Freshdesk tickets to your store support workflow.",
    icon: IconHeadset,
    accent: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  },
  {
    key: "zendesk",
    category: "support",
    label: "Zendesk",
    description: "Sync Zendesk support activity with this store.",
    icon: IconHeadset,
    accent: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  },
  {
    key: "gorgias",
    category: "support",
    label: "Gorgias",
    description: "Keep Gorgias conversations in step with store support.",
    icon: IconHeadset,
    accent: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  },
  {
    key: "intercom",
    category: "support",
    label: "Intercom",
    description: "Link Intercom so support agents stay in one place.",
    icon: IconMessageChatbot,
    accent: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  {
    key: "zoho_desk",
    category: "support",
    label: "Zoho Desk",
    description: "Bring Zoho Desk into the store support loop.",
    icon: IconHeadset,
    accent: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  },
  {
    key: "whatsapp",
    category: "chat",
    label: "WhatsApp",
    description: "Route WhatsApp conversations to the selected store.",
    icon: IconBrandWhatsapp,
    accent: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  {
    key: "slack",
    category: "chat",
    label: "Slack",
    description: "Push store notifications and updates into Slack.",
    icon: IconBrandSlack,
    accent: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  },
];

const REQUIRED_FIELDS = {
  freshdesk: ["api_url", "api_key"],
  zendesk: ["api_url", "api_key", "username"],
  gorgias: ["api_url", "api_key", "username"],
  intercom: ["api_url", "access_token"],
  zoho_desk: [
    "api_url",
    "username",
    "access_token",
    "client_id",
    "client_secret",
  ],
} as const;

const FIELD_LABELS: Record<string, string> = {
  api_url: "API URL",
  api_key: "API Key",
  username: "Username",
  access_token: "Access Token",
  client_id: "Client ID",
  client_secret: "Client Secret",
};

function platformFields(platform: PlatformKey): string[] {
  return [...(REQUIRED_FIELDS[platform as keyof typeof REQUIRED_FIELDS] ?? [])];
}

function getFieldLabel(field: string) {
  return (
    FIELD_LABELS[field] ??
    field.replaceAll("_", " ").replace(/\b\w/g, (v) => v.toUpperCase())
  );
}

function normalizeIntegration(raw: unknown): IntegrationRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const platform = record.platform;
  const category = record.category;

  if (typeof platform !== "string" || typeof category !== "string") {
    return null;
  }

  return {
    id: Number(record.id),
    platform: platform as PlatformKey,
    category: category as PlatformCategory,
    is_active: Boolean(record.is_active),
    api_url: typeof record.api_url === "string" ? record.api_url : null,
    api_key: typeof record.api_key === "string" ? record.api_key : null,
    username: typeof record.username === "string" ? record.username : null,
    access_token:
      typeof record.access_token === "string" ? record.access_token : null,
    client_id: typeof record.client_id === "string" ? record.client_id : null,
    client_secret:
      typeof record.client_secret === "string" ? record.client_secret : null,
  };
}

function extractMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; detail?: string; error?: string }
      | undefined;
    return (
      data?.message ||
      data?.detail ||
      data?.error ||
      error.message ||
      "Something went wrong."
    );
  }
  if (error instanceof Error) {
    return error.message || "Something went wrong.";
  }
  return "Something went wrong.";
}

function buildPayload(
  platform: PlatformMeta,
  values: Record<string, string>,
  isActive: boolean,
) {
  const payload: Record<string, string | boolean> = {
    platform: platform.key,
    category: platform.category,
    is_active: isActive,
  };
  for (const field of platformFields(platform.key)) {
    payload[field] = values[field] ?? "";
  }
  return payload;
}

function PlatformIcon({ meta }: { meta: PlatformMeta }) {
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg",
        meta.accent,
      )}
    >
      <Icon className="size-5" />
    </div>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  onCheckedChange,
  label,
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
        onCheckedChange(!checked);
      }}
      className={cn(
        "relative inline-flex h-8 w-14 items-center rounded-full border transition-colors duration-200",
        checked
          ? "border-emerald-500/30 bg-emerald-500/15"
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

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card
          key={index}
          size="sm"
          className="gap-5 border-border/60 bg-card/70 shadow-none"
        >
          <CardHeader className="gap-4 pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="min-w-0 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
              <Skeleton className="size-8 rounded-md" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-3 pt-1">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-8 w-14 rounded-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function StoreIntegrationsTabContent() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const storeList = useAppSelector(
    (state) => state.GetStoresReducer.GetStoresState.GetStoresListData,
  );

  const store = useMemo(
    () => storeList.find((item) => item.code === storeCode) ?? null,
    [storeCode, storeList],
  );
  const storeId = store ? Number(store.id) : null;

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterState>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformMeta | null>(
    null,
  );
  const [selectedIntegration, setSelectedIntegration] =
    useState<IntegrationRecord | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [verificationState, setVerificationState] =
    useState<VerificationState>("idle");
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null,
  );
  const [verifiedSignature, setVerifiedSignature] = useState<string | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [mutatingId, setMutatingId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  useEffect(() => {
    if (!storeList.length) {
      dispatch(GetStores({}));
    }
  }, [dispatch, storeList.length]);

  const loadIntegrations = useCallback(async () => {
    await Promise.resolve();

    if (!storeId) {
      setIntegrations([]);
      setLoadError(null);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const response = await axiosInstance.get(
        ENDPOINTS.fetchStoreIntegrations(storeId),
        { useBackend: true },
      );
      const raw = response.data?.data;
      const list = Array.isArray(raw)
        ? raw
            .map((item) => normalizeIntegration(item))
            .filter((item): item is IntegrationRecord => Boolean(item))
        : [];
      setIntegrations(list);
    } catch (error) {
      setLoadError(extractMessage(error));
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadIntegrations();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadIntegrations]);

  const integrationsByPlatform = useMemo(() => {
    return new Map(integrations.map((item) => [item.platform, item]));
  }, [integrations]);

  const activeIntegrationByCategory = useMemo(() => {
    const map = new Map<PlatformCategory, IntegrationRecord>();
    for (const integration of integrations) {
      if (integration.is_active) {
        map.set(integration.category, integration);
      }
    }
    return map;
  }, [integrations]);

  const cards = useMemo(
    () =>
      PLATFORMS.map((platform) => {
        const integration = integrationsByPlatform.get(platform.key) ?? null;
        return {
          platform,
          integration,
          state: integration ? "connected" : "available",
        } as const;
      }),
    [integrationsByPlatform],
  );

  const filteredCards = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cards.filter((card) => {
      const matchesSearch =
        !term || card.platform.label.toLowerCase().includes(term);
      const matchesFilter =
        filter === "all" ||
        (filter === "available" && !card.integration) ||
        (filter === "connected" && Boolean(card.integration));
      return matchesSearch && matchesFilter;
    });
  }, [cards, filter, search]);

  const resetModal = () => {
    setModalOpen(false);
    setSelectedPlatform(null);
    setSelectedIntegration(null);
    setFormValues({});
    setVerificationState("idle");
    setVerificationMessage(null);
    setVerifiedSignature(null);
    setSaving(false);
  };

  const openModal = (
    platform: PlatformMeta,
    integration: IntegrationRecord | null,
  ) => {
    const values: Record<string, string> = {};
    for (const field of platformFields(platform.key)) {
      values[field] =
        (integration?.[field as keyof IntegrationRecord] as
          | string
          | null
          | undefined) ?? "";
    }
    setSelectedPlatform(platform);
    setSelectedIntegration(integration);
    setFormValues(values);
    setVerificationState("idle");
    setVerificationMessage(null);
    setVerifiedSignature(null);
    setModalOpen(true);
  };

  const updateField = (field: string, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setVerificationState("idle");
    setVerificationMessage(null);
    setVerifiedSignature(null);
  };

  const currentPayload = useMemo(() => {
    if (!selectedPlatform) return null;
    return buildPayload(
      selectedPlatform,
      formValues,
      selectedIntegration?.is_active ?? false,
    );
  }, [formValues, selectedIntegration?.is_active, selectedPlatform]);

  const currentSignature = useMemo(() => {
    return currentPayload ? JSON.stringify(currentPayload) : null;
  }, [currentPayload]);

  const handleVerifyConnection = async () => {
    if (!storeId || !selectedPlatform || !currentPayload) return;

    const signature = JSON.stringify(currentPayload);
    setVerificationState("loading");
    setVerificationMessage(null);

    try {
      const response = await axiosInstance.post(
        ENDPOINTS.testStoreIntegrationConnection(storeId),
        currentPayload,
      );
      const message =
        response.data?.message || "Connection verified successfully.";
      setVerificationState("success");
      setVerifiedSignature(signature);
      setVerificationMessage(message);
    } catch (error) {
      setVerificationState("error");
      setVerifiedSignature(null);
      setVerificationMessage(extractMessage(error));
    }
  };

  const handleSave = async () => {
    if (!storeId || !selectedPlatform || !currentPayload) return;
    if (
      verificationState !== "success" ||
      verifiedSignature !== currentSignature
    ) {
      return;
    }

    setSaving(true);

    try {
      const basePayload = {
        ...currentPayload,
        is_active: selectedIntegration?.is_active ?? false,
      };

      if (selectedIntegration) {
        await axiosInstance.patch(
          ENDPOINTS.updateStoreIntegration(storeId, selectedIntegration.id),
          basePayload,
        );
      } else {
        await axiosInstance.post(
          ENDPOINTS.createStoreIntegration(storeId),
          basePayload,
        );
      }

      toast.success("Integration saved.");
      resetModal();
      await loadIntegrations();
    } catch (error) {
      toast.error(extractMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!storeId || !confirmAction || confirmAction.type !== "delete") return;

    setMutatingId(confirmAction.integration.id);

    try {
      await axiosInstance.delete(
        ENDPOINTS.deleteStoreIntegration(storeId, confirmAction.integration.id),
      );
      toast.success("Integration deleted.");
      setConfirmAction(null);
      if (
        selectedIntegration?.id === confirmAction.integration.id &&
        modalOpen
      ) {
        resetModal();
      }
      await loadIntegrations();
    } catch (error) {
      toast.error(extractMessage(error));
    } finally {
      setMutatingId(null);
    }
  };

  const handleToggle = async (
    integration: IntegrationRecord,
    nextActive: boolean,
  ) => {
    if (!storeId) return;

    setMutatingId(integration.id);

    try {
      await axiosInstance.patch(
        ENDPOINTS.updateStoreIntegration(storeId, integration.id),
        { is_active: nextActive },
      );
      toast.success(
        nextActive ? "Integration activated." : "Integration deactivated.",
      );
      await loadIntegrations();
    } catch (error) {
      toast.error(extractMessage(error));
    } finally {
      setMutatingId(null);
    }
  };

  const onToggleChange = (integration: IntegrationRecord, checked: boolean) => {
    if (mutatingId === integration.id) return;

    if (checked) {
      const currentActivePlatform = activeIntegrationByCategory.get(
        integration.category,
      )?.platform;

      setConfirmAction({
        type: "activate",
        integration,
        nextActive: true,
        currentActivePlatform,
      });
      return;
    }

    void handleToggle(integration, false);
  };

  const modalCanSave =
    verificationState === "success" &&
    verifiedSignature !== null &&
    verifiedSignature === currentSignature &&
    !saving;

  if (loading && !integrations.length) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <div className="space-y-2">
          <h2 className="font-heading text-xl font-medium">All Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Connect your store to support and chat platforms.
          </p>
        </div>
        <LoadingGrid />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <div className="space-y-2">
          <h2 className="font-heading text-xl font-medium">All Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Pick a store from the sidebar to manage integrations.
          </p>
        </div>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No store selected</EmptyTitle>
            <EmptyDescription>
              Use the store selector in the sidebar before configuring
              integrations.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 py-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-heading text-xl font-medium">
              All Integrations
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage store connections for support and chat platforms.
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {store.name}
          </Badge>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search integrations"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["available", "Available"],
                ["connected", "Connected"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant={filter === value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {loadError && (
        <div className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-3 h-auto px-0 text-destructive hover:bg-transparent hover:text-destructive"
            onClick={() => void loadIntegrations()}
          >
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <LoadingGrid />
      ) : filteredCards.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No integrations match</EmptyTitle>
            <EmptyDescription>
              Adjust the search or filter to see more platforms.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCards.map(({ platform, integration, state }) => {
            const isConnected = Boolean(integration);
            const isActive = Boolean(integration?.is_active);
            const currentActive = activeIntegrationByCategory.get(
              platform.category,
            );
            const isBusy = mutatingId === integration?.id;
            const badgeVariant = isConnected ? "default" : "outline";
            const statusText = isConnected
              ? isActive
                ? "Active"
                : "Inactive"
              : "Available";

            return (
              <Card
                key={platform.key}
                size="sm"
                role="button"
                tabIndex={0}
                aria-label={`Open ${platform.label} integration details`}
                onClick={() => openModal(platform, integration)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openModal(platform, integration);
                  }
                }}
                className="gap-5 border-border/60 bg-card/80 shadow-none transition-transform duration-150 hover:-translate-y-0.5 hover:border-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <CardHeader className="gap-4 pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <PlatformIcon meta={platform} />
                      <div className="min-w-0 space-y-1">
                        <CardTitle className="truncate text-base">
                          {platform.label}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-sm">
                          {platform.description}
                        </CardDescription>
                      </div>
                    </div>

                    <CardAction className="self-start">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Open actions for ${platform.label}`}
                            onClickCapture={(event) => event.stopPropagation()}
                          >
                            <IconDotsVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={(event) => {
                              event.preventDefault();
                              openModal(platform, integration);
                            }}
                          >
                            <IconPencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={!integration}
                            onSelect={(event) => {
                              event.preventDefault();
                              if (integration) {
                                setConfirmAction({
                                  type: "delete",
                                  integration,
                                });
                              }
                            }}
                          >
                            <IconTrash />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardAction>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={badgeVariant} className="capitalize">
                      {state}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {statusText}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                      <div className="text-[11px] uppercase tracking-wide">
                        Category
                      </div>
                      <div className="mt-1 font-medium text-foreground">
                        {platform.category}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                      <div className="text-[11px] uppercase tracking-wide">
                        Connection
                      </div>
                      <div className="mt-1 font-medium text-foreground">
                        {integration ? "Saved" : "Not saved"}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      openModal(platform, integration);
                    }}
                  >
                    <IconSettingsCog />
                    Details
                  </Button>
                  <ToggleSwitch
                    checked={isActive}
                    disabled={!integration || isBusy}
                    label={`${platform.label} integration toggle`}
                    onCheckedChange={(checked) =>
                      onToggleChange(integration as IntegrationRecord, checked)
                    }
                  />
                </CardFooter>

                {isBusy && (
                  <div className="px-6 pb-4 text-xs text-muted-foreground">
                    <Spinner className="mr-2 inline size-3.5" />
                    Saving changes...
                  </div>
                )}
                {!isConnected && (
                  <div className="px-6 pb-4 text-xs text-muted-foreground">
                    Available until credentials are saved and verified.
                  </div>
                )}
                {isConnected && currentActive?.platform === platform.key && (
                  <div className="px-6 pb-4 text-xs text-emerald-700 dark:text-emerald-300">
                    Currently active in this category.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) resetModal();
          else setModalOpen(open);
        }}
      >
        <DialogContent className="overflow-hidden p-0 sm:max-w-3xl">
          <div className="relative flex max-h-[85vh] flex-col">
            <DialogHeader className="gap-2 border-b border-border/60 px-6 pb-4 pt-6 pr-14">
              <DialogTitle className="flex items-center gap-3">
                {selectedPlatform && <PlatformIcon meta={selectedPlatform} />}
                <span>{selectedPlatform?.label ?? "Integration details"}</span>
              </DialogTitle>
              <DialogDescription>
                {selectedPlatform?.description ??
                  "Review credentials, verify the connection, and save the integration."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                {verificationState === "success" && verificationMessage && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                    <div className="flex items-start justify-between gap-3">
                      <span>{verificationMessage}</span>
                      <IconCheck className="mt-0.5 size-4 shrink-0" />
                    </div>
                  </div>
                )}

                {verificationState === "error" && verificationMessage && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <div className="flex items-start justify-between gap-3">
                      <span className="pr-2">{verificationMessage}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleVerifyConnection()}
                        disabled={saving}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {selectedPlatform &&
                  platformFields(selectedPlatform.key).length > 0 ? (
                    platformFields(selectedPlatform.key).map((field) => (
                      <Field key={field} className="space-y-2">
                        <FieldLabel htmlFor={field}>
                          {getFieldLabel(field)}
                        </FieldLabel>
                        <Input
                          id={field}
                          name={field}
                          type="text"
                          autoComplete="off"
                          value={formValues[field] ?? ""}
                          onChange={(event) =>
                            updateField(field, event.target.value)
                          }
                        />
                      </Field>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                      No credential fields are configured for this platform yet.
                    </div>
                  )}

                  {selectedIntegration && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs">
                        <div className="uppercase tracking-wide text-muted-foreground">
                          Platform
                        </div>
                        <div className="mt-1 font-medium text-foreground">
                          {selectedIntegration.platform}
                        </div>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs">
                        <div className="uppercase tracking-wide text-muted-foreground">
                          Current State
                        </div>
                        <div className="mt-1 font-medium text-foreground">
                          {selectedIntegration.is_active
                            ? "Active"
                            : "Inactive"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border/60 bg-background px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleVerifyConnection()}
                  disabled={
                    verificationState === "loading" ||
                    !selectedPlatform ||
                    !storeId
                  }
                >
                  {verificationState === "loading" ? (
                    <>
                      <Spinner data-icon="inline-start" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <IconSettingsCog />
                      {verificationState === "error"
                        ? "Retry"
                        : "Verify Connection"}
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" onClick={resetModal}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={!modalCanSave}
                  >
                    {saving ? (
                      <>
                        <Spinner data-icon="inline-start" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <IconCheck />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Save stays disabled until the current credentials are verified.
              </p>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "delete"
                ? "Delete integration?"
                : "Activate integration?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "delete" ? (
                <>
                  This will permanently remove the{" "}
                  {confirmAction.integration.platform} integration.
                </>
              ) : (
                <>
                  This will deactivate the currently active{" "}
                  {confirmAction?.integration.category} integration
                  {confirmAction?.currentActivePlatform
                    ? ` (${confirmAction.currentActivePlatform})`
                    : ""}{" "}
                  and activate {confirmAction?.integration.platform}. Continue?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutatingId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={
                confirmAction?.type === "delete"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : undefined
              }
              disabled={mutatingId !== null}
              onClick={(event) => {
                event.preventDefault();
                if (!confirmAction) return;

                if (confirmAction.type === "delete") {
                  void handleDelete();
                } else {
                  void handleToggle(confirmAction.integration, true).then(() =>
                    setConfirmAction(null),
                  );
                }
              }}
            >
              {mutatingId ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Working...
                </>
              ) : confirmAction?.type === "delete" ? (
                "Delete"
              ) : (
                "Continue"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
