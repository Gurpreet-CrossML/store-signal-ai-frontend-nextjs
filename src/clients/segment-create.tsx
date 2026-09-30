"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  IconAlertTriangle,
  IconArrowLeft,
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
import { DataTable } from "@/components/custom/data-table";
import { InfoIcon } from "@/components/custom/info-icon";
import { useDebounce } from "@/hooks/use-debounce";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  createSegment,
  fetchSegmentCategories,
  fetchSegmentDetail,
  previewSegmentCount,
  updateSegment,
  type SegmentCategory,
  type SegmentPreviewCustomer,
  type SegmentWritePayload,
} from "@/redux/api-slice/campaign-slice";

/**
 * Turn a DRF 400 response envelope into a { fieldName: firstMessage }
 * dict the form can render below each input. Mirrors the parsing every
 * other campaign form in this app uses.
 */
function parseFieldErrors(rejected: unknown): Record<string, string> {
  const envelope = rejected as { data?: unknown; message?: string } | undefined;
  const errors: Record<string, string> = {};
  const data = envelope?.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const [field, value] of Object.entries(data)) {
      if (
        Array.isArray(value) &&
        value.length &&
        typeof value[0] === "string"
      ) {
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

const DEFAULT_FORM = {
  name: "",
  category: "" as string,
  time_period: "7",
  min_price: "0",
  is_active: true,
};

function valueColumnLabel(
  categoryById: Map<number, SegmentCategory>,
  categoryId: string,
) {
  const category = categoryById.get(Number(categoryId));
  switch (category?.slug) {
    case "total-spent":
      return "Total Spent";
    case "last-order":
      return "Last Order Value";
    default:
      return "Order Value";
  }
}

function getPreviewColumns(
  valueLabel: string,
): ColumnDef<SegmentPreviewCustomer>[] {
  return [
    {
      accessorKey: "first_name",
      header: "First Name",
      cell: ({ row }) => row.original.first_name || "—",
    },
    {
      accessorKey: "last_name",
      header: "Last Name",
      cell: ({ row }) => row.original.last_name || "—",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.email || "—"}
        </span>
      ),
    },
    {
      accessorKey: "order_value",
      header: valueLabel,
      cell: ({ row }) => {
        const value = row.original.order_value;
        return (
          <span className="tabular-nums">
            {value ? `₹${Number(value).toLocaleString()}` : "—"}
          </span>
        );
      },
    },
  ];
}

export default function SegmentCreate({
  segmentId,
}: {
  segmentId?: string;
} = {}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const isEditMode = Boolean(segmentId);

  // Declared before the effects below — the categories-load effect's
  // .then() callback references setForm to prefill a default category.
  const [form, setForm] = useState(DEFAULT_FORM);

  const [categories, setCategories] = useState<SegmentCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchSegmentCategories())
      .unwrap()
      .then((cats) => {
        setCategories(cats);
        // Edit mode prefills the real category from the loaded segment
        // below — picking a default here would only flash the wrong one.
        if (isEditMode) return;
        setForm((prev) =>
          prev.category
            ? prev
            : { ...prev, category: cats[0] ? String(cats[0].id) : "" },
        );
      })
      .catch(() => {
        // The thunk already surfaces the toast.
      })
      .finally(() => setCategoriesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Edit mode: load the existing segment once the store resolves and
  // prefill every field from it.
  const [loadingSegment, setLoadingSegment] = useState(isEditMode);

  useEffect(() => {
    if (!segmentId || !storeCode) return;
    let cancelled = false;
    dispatch(fetchSegmentDetail({ storeCode, segmentId: Number(segmentId) }))
      .unwrap()
      .then((segment) => {
        if (cancelled) return;
        setForm({
          name: segment.name,
          category: String(segment.category),
          time_period: String(segment.time_period),
          min_price: segment.min_price,
          is_active: segment.is_active,
        });
      })
      .catch(() => {
        // The thunk already surfaced an error toast — nothing to edit.
        if (!cancelled) router.push("/campaign/segments");
      })
      .finally(() => {
        if (!cancelled) setLoadingSegment(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentId, storeCode]);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  // ------------------------------ live "who matches" preview + table
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewResults, setPreviewResults] = useState<
    SegmentPreviewCustomer[]
  >([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const previewKey = `${form.category}|${form.time_period}|${form.min_price}`;
  const debouncedPreviewKey = useDebounce(previewKey, 400);

  // A filter change makes the current page stale — jump back to the
  // first page rather than showing page 3 of a now-different audience.
  useEffect(() => {
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  }, [debouncedPreviewKey]);

  useEffect(() => {
    if (!storeCode) return;
    const categoryId = Number(form.category);
    const timePeriod = Number(form.time_period);
    if (!categoryId || !timePeriod || timePeriod < 1) {
      setPreviewCount(null);
      setPreviewResults([]);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    dispatch(
      previewSegmentCount({
        storeCode,
        category: categoryId,
        time_period: timePeriod,
        min_price: form.min_price ? Number(form.min_price) : 0,
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
      }),
    )
      .unwrap()
      .then((result) => {
        if (cancelled) return;
        setPreviewCount(result.count);
        setPreviewResults(result.results);
      })
      .catch(() => {
        if (cancelled) return;
        setPreviewCount(null);
        setPreviewResults([]);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Re-runs on the debounced key (typing) and on page changes (clicks);
    // the untracked form.* reads inside pick up the latest values via
    // closure, same pattern the segments list's debounced search uses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedPreviewKey,
    pagination.pageIndex,
    pagination.pageSize,
    storeCode,
    dispatch,
  ]);

  const previewColumns = useMemo(
    () => getPreviewColumns(valueColumnLabel(categoryById, form.category)),
    [categoryById, form.category],
  );

  const handleSubmit = async () => {
    if (!storeCode) return;

    const clientErrors: Record<string, string> = {};
    if (!form.name.trim()) clientErrors.name = "Give the segment a name.";
    if (!form.category) clientErrors.category = "Pick a category.";
    if (!form.time_period) clientErrors.time_period = "Set the window in days.";
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
      if (isEditMode && segmentId) {
        await dispatch(
          updateSegment({ storeCode, segmentId: Number(segmentId), payload }),
        ).unwrap();
        toast.success("Segment updated");
      } else {
        await dispatch(createSegment({ storeCode, payload })).unwrap();
        toast.success("Segment created");
      }
      router.push("/campaign/segments");
    } catch (rejected) {
      setFieldErrors(parseFieldErrors(rejected));
    } finally {
      setSubmitting(false);
    }
  };

  if (categoriesLoading || loadingSegment) {
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
            <Link href="/campaign/segments" aria-label="Back to segments">
              <IconArrowLeft />
            </Link>
          </Button>
          <div>
            <Typography variant="h4" as="h1">
              {isEditMode ? "Edit Segment" : "New Segment"}
            </Typography>
            <Typography variant="muted">
              {isEditMode
                ? "Update this segment's rules — the audience it matches updates immediately."
                : "Narrow a category down with a time window and an optional value floor, then save it as a reusable audience."}
            </Typography>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button onClick={handleSubmit} disabled={submitting || !storeCode}>
            {submitting
              ? "Saving…"
              : isEditMode
                ? "Save Changes"
                : "Save Segment"}
          </Button>
        </div>
      </div>

      {isEditMode && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">
              Changing this segment changes who it matches.
            </p>
            <p className="mt-1 text-amber-800 dark:text-amber-300">
              The number of customers below may go up or down the moment you
              save. Any campaign already using this segment picks up the new
              audience automatically — check the live count and matching-
              customers table below before saving.
            </p>
          </div>
        </div>
      )}

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUsersGroup className="size-4" />
            Segment details
            <InfoIcon text="A segment = one category + a time window, optionally floored by value. Only Last Order and Total Spent use the value floor — Abandoned Cart ignores it." />
          </CardTitle>
          <CardDescription>
            Each segment narrows a platform-wide category with a time window and
            an optional value floor.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {fieldErrors.__form__ && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {fieldErrors.__form__}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="segment-name">Segment name</Label>
                <InfoIcon text="Internal label to identify this segment later — customers never see it." />
              </div>
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
              <div className="flex items-center gap-1.5">
                <Label htmlFor="segment-category">Category</Label>
                <InfoIcon text="Which platform-wide segment type this narrows down, e.g. Last Order or Total Spent." />
              </div>
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

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="segment-window">In the last (days)</Label>
                <InfoIcon text="The eligibility window — e.g. 7 means “in the last 7 days.”" />
              </div>
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
              <div className="flex items-center gap-1.5">
                <Label htmlFor="segment-min-price">Min cart value (₹)</Label>
                <InfoIcon text="Only customers whose order or spend reaches this amount are included." />
              </div>
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

          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-[#0E1730] to-[#221949] p-4 text-white">
            <IconUsersGroup className="size-6 shrink-0 text-violet-300" />
            <div className="min-w-0 flex-1">
              <div className="text-2xl font-bold tabular-nums">
                {previewLoading ? (
                  <Spinner className="size-5" />
                ) : previewCount === null ? (
                  "—"
                ) : (
                  previewCount.toLocaleString()
                )}
              </div>
              <div className="text-xs text-violet-200">
                {previewCount === null && !previewLoading
                  ? "Pick a category and window to preview"
                  : "people match right now · updates as you edit"}
              </div>
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
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUsersGroup className="size-4" />
            Matching customers
          </CardTitle>
          <CardDescription>
            Everyone who matches this configuration right now, highest{" "}
            {valueColumnLabel(categoryById, form.category).toLowerCase()} first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={previewColumns}
            data={previewResults}
            totalCount={previewCount ?? 0}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={previewLoading}
            noun="customer"
            emptyTitle={
              previewCount === null
                ? "Pick a category and window to see who matches."
                : "No customers match this configuration yet."
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
