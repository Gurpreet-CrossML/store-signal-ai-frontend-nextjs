"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleOff,
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconTrash,
  IconUsersGroup,
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
  deleteSegment,
  fetchCampaigns,
  fetchSegmentCategories,
  fetchSegments,
  updateSegmentStatus,
  type Campaign,
  type Segment,
  type SegmentCategory,
} from "@/redux/api-slice/campaign-slice";

function getColumns(
  categoryById: Map<number, SegmentCategory>,
  onToggleActive: (segment: Segment, checked: boolean) => void,
  toggling: number | null,
  onEdit: (segment: Segment) => void,
  onDelete: (segment: Segment) => void,
): ColumnDef<Segment>[] {
  return [
    {
      accessorKey: "name",
      header: "Segment",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5 py-1 font-medium">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconUsersGroup className="size-4" />
          </div>
          <span className="truncate" title={row.original.name}>
            {row.original.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = categoryById.get(row.original.category);
        return (
          <Badge variant="outline">
            {category?.name ?? `#${row.original.category}`}
          </Badge>
        );
      },
    },
    {
      accessorKey: "time_period",
      header: "Window",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          Last {row.original.time_period} days
        </span>
      ),
    },
    {
      accessorKey: "min_price",
      header: "Min Value",
      cell: ({ row }) => {
        const value = Number(row.original.min_price);
        return (
          <span className="tabular-nums text-sm">
            {value > 0 ? `₹${value.toLocaleString()}` : "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Active",
      cell: ({ row }) => {
        const segment = row.original;
        return (
          <Switch
            checked={segment.is_active}
            onCheckedChange={(checked) => onToggleActive(segment, checked)}
            disabled={toggling === segment.id}
            aria-label={`Toggle ${segment.name} active`}
          />
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const segment = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`More actions for ${segment.name}`}
              >
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(segment)}>
                <IconPencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(segment)}
              >
                <IconTrash className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

export default function Segments() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const [categories, setCategories] = useState<SegmentCategory[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Categories are platform-wide and change rarely, so load once on mount.
  useEffect(() => {
    dispatch(fetchSegmentCategories())
      .unwrap()
      .then(setCategories)
      .catch(() => {
        // The thunk already surfaces the toast.
      });
  }, [dispatch]);

  // Loaded once so the delete-confirm dialog can name which campaigns a
  // segment's cascade delete would take down with it — the existing
  // campaigns list endpoint, no extra API surface.
  useEffect(() => {
    if (!storeCode) return;
    dispatch(fetchCampaigns({ storeCode }))
      .unwrap()
      .then(setCampaigns)
      .catch(() => {
        // The thunk already surfaces the toast.
      });
  }, [dispatch, storeCode]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const loadSegments = useCallback(async () => {
    if (!storeCode) return;
    setLoading(true);
    try {
      const segs = await dispatch(
        fetchSegments({ storeCode, search: debouncedSearch }),
      ).unwrap();
      setSegments(segs);
    } catch {
      // Thunk already surfaced the toast.
    } finally {
      setLoading(false);
    }
  }, [dispatch, storeCode, debouncedSearch]);

  useEffect(() => {
    loadSegments();
  }, [loadSegments]);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  const pageRows = useMemo(
    () =>
      segments.slice(
        pagination.pageIndex * pagination.pageSize,
        (pagination.pageIndex + 1) * pagination.pageSize,
      ),
    [segments, pagination],
  );

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const handleToggleActive = useCallback(
    async (segment: Segment, checked: boolean) => {
      if (!storeCode) return;
      setTogglingId(segment.id);
      // Optimistic swap so the switch feels responsive; if the PATCH
      // fails the loadSegments below in ``finally`` snaps it back.
      setSegments((prev) =>
        prev.map((s) =>
          s.id === segment.id ? { ...s, is_active: checked } : s,
        ),
      );
      try {
        await dispatch(
          updateSegmentStatus({
            storeCode,
            segmentId: segment.id,
            isActive: checked,
          }),
        ).unwrap();
        toast.success(checked ? "Segment activated" : "Segment paused");
      } catch {
        loadSegments();
      } finally {
        setTogglingId(null);
      }
    },
    [dispatch, storeCode, loadSegments],
  );

  // ------------------------------ delete
  const [segmentToDelete, setSegmentToDelete] = useState<Segment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Campaign.segment is on_delete=CASCADE, so deleting a segment that's
  // still someone's audience takes those campaigns down with it — named
  // here so the confirm dialog can warn specifically rather than vaguely.
  const affectedCampaigns = useMemo(
    () =>
      segmentToDelete
        ? campaigns.filter((c) => c.segment === segmentToDelete.id)
        : [],
    [campaigns, segmentToDelete],
  );

  const handleConfirmDelete = async () => {
    if (!storeCode || !segmentToDelete) return;
    setDeleting(true);
    try {
      await dispatch(
        deleteSegment({ storeCode, segmentId: segmentToDelete.id }),
      ).unwrap();
      toast.success("Segment deleted", {
        description: `${segmentToDelete.name} was removed.`,
      });
      setSegmentToDelete(null);
      loadSegments();
      dispatch(fetchCampaigns({ storeCode })).unwrap().then(setCampaigns);
    } catch {
      // The thunk already surfaces the error toast.
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () =>
      getColumns(
        categoryById,
        handleToggleActive,
        togglingId,
        (segment) => router.push(`/campaign/segments/${segment.id}/edit`),
        (segment) => setSegmentToDelete(segment),
      ),
    [categoryById, handleToggleActive, togglingId, router],
  );

  const activeCount = useMemo(
    () => segments.filter((s) => s.is_active).length,
    [segments],
  );

  const stats = [
    {
      label: "Total Segments",
      value: segments.length,
      note: "All saved audiences",
      icon: IconUsersGroup,
    },
    {
      label: "Live",
      value: activeCount,
      note: segments.length
        ? `${Math.round((activeCount / segments.length) * 100)}% of total`
        : "—",
      icon: IconCircleCheck,
    },
    {
      label: "Paused",
      value: segments.length - activeCount,
      note: "Excluded from new campaigns",
      icon: IconCircleOff,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          placeholder="Search segments…"
          label="Search segments"
          className="w-full sm:w-64"
        />
        <Button
          onClick={() => router.push("/campaign/segments/create")}
          disabled={!storeCode}
        >
          <IconPlus className="size-4" />
          New Segment
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={pageRows}
        totalCount={segments.length}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={loading}
        noun="segment"
        emptyTitle={
          debouncedSearch
            ? `No segments matching "${debouncedSearch}".`
            : "No segments yet."
        }
      />

      <AlertDialog
        open={!!segmentToDelete}
        onOpenChange={(open) => {
          if (!open) setSegmentToDelete(null);
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
            <AlertDialogTitle>Delete segment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                {segmentToDelete?.name}.
              </span>{" "}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {affectedCampaigns.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <IconAlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div className="text-sm">
                <p className="font-semibold text-destructive">
                  This segment is used by {affectedCampaigns.length} campaign
                  {affectedCampaigns.length === 1 ? "" : "s"}, which will also
                  be deleted.
                </p>
                <p className="mt-1 text-destructive/80">
                  Both the segment and the linked campaign
                  {affectedCampaigns.length === 1 ? "" : "s"} (
                  {affectedCampaigns.map((c) => c.name).join(", ")}) will be
                  permanently removed.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 text-sm">
            <p className="font-medium">This action will permanently remove:</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                The segment{" "}
                <span className="font-medium text-foreground">
                  “{segmentToDelete?.name}”
                </span>
              </li>
              {affectedCampaigns.length > 0 && (
                <li>
                  <span className="font-medium text-foreground">
                    {affectedCampaigns.length} campaign
                    {affectedCampaigns.length === 1 ? "" : "s"}
                  </span>{" "}
                  linked to this segment
                </li>
              )}
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
              {deleting ? "Deleting…" : "Delete Segment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
