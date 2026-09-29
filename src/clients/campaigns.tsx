"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  IconAlertTriangle,
  IconBrandWhatsapp,
  IconChecklist,
  IconCircleCheck,
  IconCircleOff,
  IconDotsVertical,
  IconEye,
  IconMail,
  IconPencil,
  IconPlus,
  IconSend,
  IconSpeakerphone,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { DataTable } from "@/components/custom/data-table";
import { SearchInput } from "@/components/custom/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  deleteCampaign,
  fetchCampaigns,
  fetchSegments,
  runCampaign,
  updateCampaignStatus,
  type Campaign,
  type CampaignRunResult,
  type Segment,
} from "@/redux/api-slice/campaign-slice";

function getColumns(
  segmentById: Map<number, Segment>,
  onView: (campaign: Campaign) => void,
  onToggleActive: (campaign: Campaign, checked: boolean) => void,
  toggling: number | null,
  onEdit: (campaign: Campaign) => void,
  onDelete: (campaign: Campaign) => void,
  onRun: (campaign: Campaign) => void,
): ColumnDef<Campaign>[] {
  return [
    {
      accessorKey: "name",
      header: "Campaign",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5 py-1 font-medium">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconSpeakerphone className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate" title={row.original.name}>
              {row.original.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.continuous_entry
                ? "Continuous entry"
                : "One-time snapshot"}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "segment",
      header: "Segment",
      cell: ({ row }) => {
        const segment = segmentById.get(row.original.segment);
        return (
          <Badge variant="outline">
            {segment?.name ?? `#${row.original.segment}`}
          </Badge>
        );
      },
    },
    {
      id: "steps",
      header: "Steps",
      cell: ({ row }) => (
        <span className="tabular-nums text-sm text-muted-foreground">
          {row.original.sequence_steps.length} step
          {row.original.sequence_steps.length === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      accessorKey: "start_time",
      header: "Start Time",
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">
          {row.original.start_time.slice(0, 5)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const c = row.original;
        if (c.status === "draft")
          return <Badge variant="secondary">Draft</Badge>;
        if (c.is_active)
          return (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              Live
            </Badge>
          );
        return <Badge variant="outline">Paused</Badge>;
      },
    },
    {
      // ``is_active`` only makes sense once a campaign is published — a
      // draft is off by definition, so the switch is disabled there.
      accessorKey: "is_active",
      header: "Active",
      cell: ({ row }) => {
        const campaign = row.original;
        return (
          <Switch
            checked={campaign.is_active}
            disabled={toggling === campaign.id || campaign.status === "draft"}
            onCheckedChange={(checked) => onToggleActive(campaign, checked)}
            aria-label={`Toggle ${campaign.name} active`}
          />
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const campaign = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onView(campaign)}
              aria-label={`View ${campaign.name}`}
            >
              <IconEye className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`More actions for ${campaign.name}`}
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onRun(campaign)}>
                  <IconSend className="size-4" />
                  Run Campaign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(campaign)}>
                  <IconPencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(campaign)}
                >
                  <IconTrash className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

export default function Campaigns() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  // Segments load once — they're just the "Segment" column labels and
  // don't need to churn every time the search string changes.
  useEffect(() => {
    if (!storeCode) return;
    dispatch(fetchSegments({ storeCode }))
      .unwrap()
      .then(setSegments)
      .catch(() => {
        // Thunk already surfaced the toast.
      });
  }, [dispatch, storeCode]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const loadCampaigns = useCallback(async () => {
    if (!storeCode) return;
    setLoading(true);
    try {
      const c = await dispatch(
        fetchCampaigns({ storeCode, search: debouncedSearch }),
      ).unwrap();
      setCampaigns(c);
    } catch {
      // Thunk already surfaced the toast.
    } finally {
      setLoading(false);
    }
  }, [dispatch, storeCode, debouncedSearch]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const segmentById = useMemo(
    () => new Map(segments.map((s) => [s.id, s])),
    [segments],
  );

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  const pageRows = useMemo(
    () =>
      campaigns.slice(
        pagination.pageIndex * pagination.pageSize,
        (pagination.pageIndex + 1) * pagination.pageSize,
      ),
    [campaigns, pagination],
  );

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const handleToggleActive = useCallback(
    async (campaign: Campaign, checked: boolean) => {
      if (!storeCode) return;
      setTogglingId(campaign.id);
      // Optimistic swap; if the PATCH fails ``loadCampaigns`` in the
      // catch snaps the row back to whatever the server reports.
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaign.id ? { ...c, is_active: checked } : c,
        ),
      );
      try {
        await dispatch(
          updateCampaignStatus({
            storeCode,
            campaignId: campaign.id,
            isActive: checked,
          }),
        ).unwrap();
        toast.success(checked ? "Campaign resumed" : "Campaign paused");
      } catch {
        loadCampaigns();
      } finally {
        setTogglingId(null);
      }
    },
    [dispatch, storeCode, loadCampaigns],
  );

  // ------------------------------ delete
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!storeCode || !campaignToDelete) return;
    setDeleting(true);
    try {
      await dispatch(
        deleteCampaign({ storeCode, campaignId: campaignToDelete.id }),
      ).unwrap();
      toast.success("Campaign deleted", {
        description: `${campaignToDelete.name} was removed.`,
      });
      setCampaignToDelete(null);
      loadCampaigns();
    } catch {
      // The thunk already surfaces the error toast.
    } finally {
      setDeleting(false);
    }
  };

  // ------------------------------ run now
  const [campaignToRun, setCampaignToRun] = useState<Campaign | null>(null);
  const [runPreview, setRunPreview] = useState<CampaignRunResult | null>(null);
  const [runPreviewLoading, setRunPreviewLoading] = useState(false);
  const [running, setRunning] = useState(false);

  // Opening the dialog immediately fires a dry run so the confirmation
  // shows real, live counts (per-step ``would_send``, and any template
  // that would be rejected outright) rather than asking the user to
  // trust a blind "Run Campaign" click.
  const handleOpenRun = useCallback(
    async (campaign: Campaign) => {
      setCampaignToRun(campaign);
      if (!storeCode) return;
      setRunPreviewLoading(true);
      try {
        const result = await dispatch(
          runCampaign({ storeCode, campaignId: campaign.id, dryRun: true }),
        ).unwrap();
        setRunPreview(result);
      } catch {
        setRunPreview(null);
      } finally {
        setRunPreviewLoading(false);
      }
    },
    [dispatch, storeCode],
  );

  const closeRunDialog = () => {
    setCampaignToRun(null);
    setRunPreview(null);
  };

  const handleConfirmRun = async () => {
    if (!storeCode || !campaignToRun) return;
    setRunning(true);
    try {
      const result = await dispatch(
        runCampaign({ storeCode, campaignId: campaignToRun.id, dryRun: false }),
      ).unwrap();
      const totalSent = result.steps.reduce((sum, s) => sum + (s.sent ?? 0), 0);
      const totalFailed = result.steps.reduce(
        (sum, s) => sum + (s.failed ?? 0),
        0,
      );
      toast.success("Campaign run completed", {
        description:
          totalFailed > 0
            ? `Sent ${totalSent}, failed ${totalFailed}.`
            : `Sent to ${totalSent} recipient${totalSent === 1 ? "" : "s"}.`,
      });
      closeRunDialog();
    } catch {
      // Thunk already surfaced the toast.
    } finally {
      setRunning(false);
    }
  };

  const columns = useMemo(
    () =>
      getColumns(
        segmentById,
        (campaign) => router.push(`/campaign/campaigns/${campaign.id}`),
        handleToggleActive,
        togglingId,
        (campaign) => router.push(`/campaign/campaigns/${campaign.id}/edit`),
        (campaign) => setCampaignToDelete(campaign),
        handleOpenRun,
      ),
    [segmentById, router, handleToggleActive, togglingId, handleOpenRun],
  );

  const liveCount = useMemo(
    () =>
      campaigns.filter((c) => c.status === "published" && c.is_active).length,
    [campaigns],
  );
  const draftCount = useMemo(
    () => campaigns.filter((c) => c.status === "draft").length,
    [campaigns],
  );

  const stats = [
    {
      label: "Total Campaigns",
      value: campaigns.length,
      note: "All journeys, live and draft",
      icon: IconSpeakerphone,
    },
    {
      label: "Live",
      value: liveCount,
      note: "Currently accepting entries",
      icon: IconCircleCheck,
    },
    {
      label: "Drafts",
      value: draftCount,
      note: "Not yet published",
      icon: IconChecklist,
    },
    {
      label: "Paused",
      value: campaigns.length - liveCount - draftCount,
      note: "Published but off",
      icon: IconCircleOff,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon }) => (
          <Card key={label} size="sm">
            <CardHeader>
              <CardTitle>
                <Typography variant="muted" as="h3">
                  {label}
                </Typography>
              </CardTitle>
              <CardAction>
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Typography variant="h3" as="p" className="tabular-nums">
                {loading ? <Spinner className="my-1 size-5" /> : value}
              </Typography>
            </CardContent>
            <CardFooter>
              <span className="inline-block max-w-full truncate rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                {note}
              </span>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          placeholder="Search campaigns…"
          label="Search campaigns"
          className="w-full sm:w-64"
        />
        <Button
          onClick={() => router.push("/campaign/campaigns/create")}
          disabled={!storeCode}
        >
          <IconPlus className="size-4" />
          New Campaign
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={pageRows}
        totalCount={campaigns.length}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={loading}
        noun="campaign"
        emptyTitle={
          debouncedSearch
            ? `No campaigns matching "${debouncedSearch}".`
            : "No campaigns yet."
        }
      />

      <AlertDialog
        open={!!campaignToDelete}
        onOpenChange={(open) => {
          if (!open) setCampaignToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogCancel
            disabled={deleting}
            variant="ghost"
            size="icon-sm"
            className="absolute top-4 right-4"
            aria-label="Cancel"
          >
            <IconX className="size-4" />
          </AlertDialogCancel>

          <AlertDialogHeader>
            <AlertDialogMedia className="rounded-full bg-destructive/10 text-destructive">
              <IconTrash />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                {campaignToDelete?.name}.
              </span>{" "}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-2 text-sm">
            <p className="font-medium">This action will permanently remove:</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                The campaign{" "}
                <span className="font-medium text-foreground">
                  “{campaignToDelete?.name}”
                </span>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  {campaignToDelete?.sequence_steps.length ?? 0} sequence step
                  {campaignToDelete?.sequence_steps.length === 1 ? "" : "s"}
                </span>{" "}
                in its journey
              </li>
            </ul>
          </div>

          <div className="border-t" />

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleConfirmDelete();
              }}
              disabled={deleting}
              className={buttonVariants({ variant: "destructive" })}
            >
              <IconTrash className="size-4" />
              {deleting ? "Deleting…" : "Delete Campaign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!campaignToRun}
        onOpenChange={(open) => {
          if (!open) closeRunDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-primary/10 text-primary">
              <IconSend />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Run &ldquo;{campaignToRun?.name}&rdquo; now?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Every step below sends immediately to everyone the segment
              currently matches. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {runPreviewLoading ? (
            <div className="flex items-center justify-center py-6">
              <Spinner className="size-5" />
            </div>
          ) : runPreview ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-md border p-3 text-sm">
                <span className="font-medium">
                  {runPreview.recipient_count} recipient
                  {runPreview.recipient_count === 1 ? "" : "s"}
                </span>{" "}
                <span className="text-muted-foreground">
                  currently match this segment.
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {runPreview.steps.map((step) => (
                  <div
                    key={step.step_order}
                    className="flex items-center justify-between rounded-md border p-2.5 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {step.channel === "whatsapp" ? (
                        <IconBrandWhatsapp className="size-4 text-emerald-600" />
                      ) : (
                        <IconMail className="size-4 text-blue-600" />
                      )}
                      <span>Step {step.step_order + 1}</span>
                    </div>
                    {step.error ? (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <IconAlertTriangle className="size-3.5" />
                        {step.error}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        would send to {step.would_send ?? 0}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Couldn&apos;t load a preview. Try again, or check the segment and
              templates.
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={running}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleConfirmRun();
              }}
              disabled={
                running ||
                runPreviewLoading ||
                !runPreview ||
                runPreview.recipient_count === 0
              }
            >
              <IconSend className="size-4" />
              {running ? "Sending…" : "Send Now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
