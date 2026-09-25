"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  IconCircleCheck,
  IconCircleOff,
  IconPlus,
  IconUsersGroup,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { DataTable } from "@/components/custom/data-table";
import { SearchInput } from "@/components/custom/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  createSegment,
  fetchSegmentCategories,
  fetchSegments,
  updateSegmentStatus,
  type Segment,
  type SegmentCategory,
  type SegmentWritePayload,
} from "@/redux/api-slice/campaign-slice";

/**
 * Turn a DRF 400 response envelope into a { fieldName: firstMessage }
 * dict the form can render below each input. DRF puts either a per-field
 * error map or a plain string message on the ``data`` key; anything else
 * (e.g. non_field_errors) is bubbled up under ``__form__`` so the form
 * can show it in a general banner.
 */
function parseFieldErrors(
  rejected: unknown,
): Record<string, string> {
  const envelope = rejected as { data?: unknown; message?: string } | undefined;
  const errors: Record<string, string> = {};
  const data = envelope?.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const [field, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length && typeof value[0] === "string") {
        errors[field] = value[0];
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

/**
 * The "In the last N days" pattern in the HTML reference is the only
 * time-window shape the backend's Segment currently stores, so the form
 * keeps it simple and asks for the day count directly.
 */
const DEFAULT_FORM = {
  name: "",
  category: "" as string,
  time_period: "7",
  min_price: "0",
  is_active: true,
};

function getColumns(
  categoryById: Map<number, SegmentCategory>,
  onToggleActive: (segment: Segment, checked: boolean) => void,
  toggling: number | null,
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
  ];
}

export default function Segments() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const [categories, setCategories] = useState<SegmentCategory[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
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

  const columns = useMemo(
    () => getColumns(categoryById, handleToggleActive, togglingId),
    [categoryById, handleToggleActive, togglingId],
  );

  const activeCount = useMemo(
    () => segments.filter((s) => s.is_active).length,
    [segments],
  );

  // ------------------------------ create dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setForm({
      ...DEFAULT_FORM,
      category: categories[0] ? String(categories[0].id) : "",
    });
    setFieldErrors({});
    setDialogOpen(true);
  };

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleSubmit = async () => {
    if (!storeCode) return;

    // Client-side "required" checks — the server enforces the same thing
    // but users get faster feedback if the request never leaves the tab.
    const clientErrors: Record<string, string> = {};
    if (!form.name.trim()) clientErrors.name = "Give the segment a name.";
    if (!form.category) clientErrors.category = "Pick a category.";
    if (!form.time_period)
      clientErrors.time_period = "Set the window in days.";
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      return;
    }

    const payload: SegmentWritePayload = {
      name: form.name.trim(),
      category: Number(form.category),
      time_period: Number(form.time_period),
      min_price: form.min_price ? Number(form.min_price) : 0,
      is_active: form.is_active,
    };
    setSubmitting(true);
    setFieldErrors({});
    try {
      await dispatch(createSegment({ storeCode, payload })).unwrap();
      toast.success("Segment created");
      setDialogOpen(false);
      loadSegments();
    } catch (rejected) {
      setFieldErrors(parseFieldErrors(rejected));
    } finally {
      setSubmitting(false);
    }
  };

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
        <Button onClick={openCreate} disabled={!storeCode}>
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!submitting) setDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>New Segment</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {fieldErrors.__form__ && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {fieldErrors.__form__}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="segment-name">Segment name</Label>
              <Input
                id="segment-name"
                value={form.name}
                onChange={(event) => {
                  setForm({ ...form, name: event.target.value });
                  clearFieldError("name");
                }}
                placeholder="e.g. Abandoned cart · last 7 days"
                aria-invalid={!!fieldErrors.name}
              />
              {fieldErrors.name && (
                <p className="text-xs text-destructive">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment-category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => {
                  setForm({ ...form, category: value });
                  clearFieldError("category");
                }}
              >
                <SelectTrigger
                  id="segment-category"
                  aria-invalid={!!fieldErrors.category}
                >
                  <SelectValue placeholder="Pick a segment type" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.category && (
                <p className="text-xs text-destructive">
                  {fieldErrors.category}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="segment-window">In the last (days)</Label>
                <Input
                  id="segment-window"
                  type="number"
                  min={1}
                  value={form.time_period}
                  onChange={(event) => {
                    setForm({ ...form, time_period: event.target.value });
                    clearFieldError("time_period");
                  }}
                  aria-invalid={!!fieldErrors.time_period}
                />
                {fieldErrors.time_period && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.time_period}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="segment-min-price">Min cart value (₹)</Label>
                <Input
                  id="segment-min-price"
                  type="number"
                  min={0}
                  value={form.min_price}
                  onChange={(event) => {
                    setForm({ ...form, min_price: event.target.value });
                    clearFieldError("min_price");
                  }}
                  aria-invalid={!!fieldErrors.min_price}
                />
                {fieldErrors.min_price && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.min_price}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
              <div>
                <div className="text-sm font-medium">Active</div>
                <div className="text-xs text-muted-foreground">
                  Only active segments can be picked by a new campaign.
                </div>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm({ ...form, is_active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating…" : "Create Segment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
