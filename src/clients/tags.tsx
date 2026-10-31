"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconAlertTriangle, IconPlus, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import {
  Formik,
  Form,
  Field,
  type FieldProps,
  type FormikHelpers,
} from "formik";
import z from "zod";
import type { OnChangeFn, PaginationState } from "@tanstack/react-table";
import { DataTable } from "@/components/custom/data-table";
import { PAGE_SIZE_OPTIONS } from "@/components/custom/threads-data-table-pagination";
import { SearchInput } from "@/components/custom/search-input";
import { getTagColumns } from "@/components/custom/helpdesk/tags-columns";
import { TagBadge } from "@/components/custom/helpdesk/tag-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ACTIVE_FILTER_STYLE } from "@/lib/config";
import { cn } from "@/lib/utils";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { applyServerFieldErrors } from "@/lib/form-errors";
import {
  FetchSupportTicketTags,
  TicketTagDelete,
  TicketTagCreate,
  TicketTagUpdate,
  fetchSimilarTicketTags,
  type SupportTicketTagData,
} from "@/redux/api-slice/support-ticket-slice";

const ALL_TYPES = "all";
type TagTypeFilter = typeof ALL_TYPES | "custom" | "system";
const TAG_TYPE_FILTERS: TagTypeFilter[] = [ALL_TYPES, "custom", "system"];

/** Where a tag is in use, as "3 tickets and 12 analysed threads"; "" when unused. */
function describeTagUsage(tag: SupportTicketTagData | null): string {
  const parts = [
    tag?.ticket_count
      ? `${tag.ticket_count} ticket${tag.ticket_count === 1 ? "" : "s"}`
      : "",
    tag?.thread_count
      ? `${tag.thread_count} analysed thread${tag.thread_count === 1 ? "" : "s"}`
      : "",
  ].filter(Boolean);
  return parts.join(" and ");
}

// preset swatches shown next to the native color picker for quick selection
const COLOR_PRESETS = [
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ef4444", // red
  "#8b5cf6", // violet
  "#6366f1", // indigo
  "#22c55e", // green
  "#eab308", // yellow
  "#ec4899", // pink
  "#14b8a6", // teal
  "#64748b", // slate
] as const;

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

// Matches the smallest entry in the shared pagination's PAGE_SIZE_OPTIONS,
// so the rows-per-page dropdown always shows a real option.
const DEFAULT_PER_PAGE = 25;

// Limits shared by the schema and the inputs, so the fields stop accepting
// text at the same point validation would reject it.
const TAG_NAME_MAX = 30;
const TAG_DESCRIPTION_MAX = 120;

const TAG_MIN = 3;

const NAME_MAX_MESSAGE = `Tag name must be ${TAG_NAME_MAX} characters or fewer`;
const DESCRIPTION_MAX_MESSAGE = `Description must be ${TAG_DESCRIPTION_MAX} characters or fewer`;

// Rules run in order and the first failure is the one shown, so an empty
// field says it is required rather than that it is too short.
const tagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tag name is required")
    .min(TAG_MIN, `Tag name must be at least ${TAG_MIN} characters`)
    .max(TAG_NAME_MAX, NAME_MAX_MESSAGE),
  color: z.string().regex(HEX_REGEX, "Enter a valid hex color"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .min(TAG_MIN, `Description must be at least ${TAG_MIN} characters`)
    .max(TAG_DESCRIPTION_MAX, DESCRIPTION_MAX_MESSAGE),
});

type TagFormValues = z.infer<typeof tagSchema>;

// Converts a Zod validation result into the { fieldName: errorMessage }
// shape Formik expects from its `validate` prop.
const validateWithZod = (values: TagFormValues) => {
  const result = tagSchema.safeParse(values);
  if (result.success) return {};

  return result.error.issues.reduce<Record<string, string>>((acc, issue) => {
    const key = issue.path[0] as string;
    if (!acc[key]) acc[key] = issue.message;
    return acc;
  }, {});
};

/** The asterisk on a required field label. */
function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden>
      *
    </span>
  );
}

export default function Tags() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<SupportTicketTagData | null>(
    null,
  );
  // The name as typed in the dialog; the lookup below follows this.
  const [nameInput, setNameInput] = useState("");
  // The tags the server said `name` is too close to. Kept with the name they
  // answer, so a result for an earlier name is never shown for a later one.
  const [similar, setSimilar] = useState<{
    name: string;
    tags: SupportTicketTagData[];
  }>({ name: "", tags: [] });

  // tag pending delete confirmation (null = confirm dialog closed)
  const [tagPendingDelete, setTagPendingDelete] =
    useState<SupportTicketTagData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // An edit to a tag that is in use, held until the user confirms it. `usage`
  // is kept here because saving clears `editingTag` before the dialog closes.
  const [pendingSave, setPendingSave] = useState<{
    values: TagFormValues;
    helpers: FormikHelpers<TagFormValues>;
    usage: string;
  } | null>(null);
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);

  // Where the tag being edited / deleted is already in use ("" when nowhere).
  const editingTagUsage = describeTagUsage(editingTag);
  const pendingDeleteUsage = describeTagUsage(tagPendingDelete);

  // pagination + search + type state. All four are mirrored in the URL
  // (?page=, ?page_size=, ?search=, ?type=), so a reload or a shared link
  // lands on the same view. Read once on mount; anything unusable falls back
  // to the default.
  const [page, setPage] = useState(() => {
    const value = Number(searchParams?.get("page"));
    return Number.isInteger(value) && value > 1 ? value : 1;
  });
  const [limit, setLimit] = useState<number>(() => {
    const value = Number(searchParams?.get("page_size"));
    return PAGE_SIZE_OPTIONS.includes(value) ? value : DEFAULT_PER_PAGE;
  });
  const [searchInput, setSearchInput] = useState(
    () => searchParams?.get("search")?.trim() ?? "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(
    () => searchParams?.get("search")?.trim() ?? "",
  );
  const [typeFilter, setTypeFilter] = useState<TagTypeFilter>(() => {
    const value = searchParams?.get("type") as TagTypeFilter | null;
    return value && TAG_TYPE_FILTERS.includes(value) ? value : ALL_TYPES;
  });

  const hasActiveFilters = !!searchInput || typeFilter !== ALL_TYPES;
  const clearFilters = () => {
    // Set the debounced value too, so the list updates now instead of after
    // the search box's pause.
    setSearchInput("");
    setDebouncedSearch("");
    setTypeFilter(ALL_TYPES);
    setPage(1);
  };

  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchSupportTicketTagsData, FetchSupportTicketTagsIsLoading } =
    useAppSelector(
      (state) => state.GetSupportTicketsReducer.FetchSupportTicketTagsState,
    );

  const tags = FetchSupportTicketTagsData?.results ?? [];
  const total = FetchSupportTicketTagsData?.count ?? 0;

  // debounce the search input so we don't fire a request on every keystroke,
  // and reset to page 1 at the same time so we don't chain a second effect
  // off of debouncedSearch changing. Only a real change resets the page, so
  // the page read from the URL survives the first run on mount.
  useEffect(() => {
    const handle = setTimeout(() => {
      const next = searchInput.trim();
      if (next === debouncedSearch) return;
      setDebouncedSearch(next);
      setPage(1);
    }, 400);

    return () => clearTimeout(handle);
  }, [searchInput, debouncedSearch]);

  // Keep the URL in step with the view. Defaults are left out, and the write
  // is skipped when nothing changed so it can't loop.
  const queryString = searchParams?.toString() ?? "";
  useEffect(() => {
    const params = new URLSearchParams(queryString);
    const setOrDelete = (key: string, value: string | null) => {
      if (value) params.set(key, value);
      else params.delete(key);
    };
    setOrDelete("page", page > 1 ? String(page) : null);
    setOrDelete("page_size", limit !== DEFAULT_PER_PAGE ? String(limit) : null);
    setOrDelete("search", debouncedSearch || null);
    setOrDelete("type", typeFilter !== ALL_TYPES ? typeFilter : null);

    const query = params.toString();
    if (query === queryString) return;
    const basePath = pathname ?? "/settings/tags";
    router.replace(query ? `${basePath}?${query}` : basePath, {
      scroll: false,
    });
  }, [page, limit, debouncedSearch, typeFilter, queryString, pathname, router]);

  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      FetchSupportTicketTags({
        storeCode,
        page,
        limit,
        search: debouncedSearch,
        type: typeFilter === ALL_TYPES ? undefined : typeFilter,
      }),
    );
  }, [dispatch, storeCode, page, limit, debouncedSearch, typeFilter]);

  // Existing tags the typed name resembles, shown under the name field so the
  // owner can pick one instead of adding a near-duplicate. None when the
  // dialog is closed or an edited tag still has its own name. Only one with
  // the same name (`is_exact`) is a duplicate that blocks saving; a partial
  // match is just a suggestion.
  const typedName = nameInput.trim();
  const isOwnName =
    !!editingTag && typedName.toLowerCase() === editingTag.name.toLowerCase();
  const matchedTags =
    dialogOpen && !isOwnName && similar.name === typedName ? similar.tags : [];
  const isDuplicate = matchedTags.some((tag) => tag.is_exact);

  // Look up matching tags a moment after the owner stops typing.
  useEffect(() => {
    if (!dialogOpen || !storeCode || typedName.length < TAG_MIN || isOwnName) {
      return;
    }

    const controller = new AbortController();
    const handle = setTimeout(async () => {
      const tags = await fetchSimilarTicketTags({
        storeCode,
        name: typedName,
        excludeId: editingTag?.id,
        signal: controller.signal,
      });
      if (!controller.signal.aborted) setSimilar({ name: typedName, tags });
    }, 300);

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [typedName, isOwnName, dialogOpen, storeCode, editingTag?.id]);

  const openCreateDialog = () => {
    setEditingTag(null);
    setNameInput("");
    setDialogOpen(true);
  };

  const openEditDialog = (tag: SupportTicketTagData) => {
    setEditingTag(tag);
    setNameInput(tag.name);
    setDialogOpen(true);
  };

  const requestRemoveTag = (tag: SupportTicketTagData) => {
    setTagPendingDelete(tag);
  };

  const refetchCurrentPage = () => {
    if (!storeCode) return;
    dispatch(
      FetchSupportTicketTags({
        storeCode,
        page,
        limit,
        search: debouncedSearch,
        type: typeFilter === ALL_TYPES ? undefined : typeFilter,
      }),
    );
  };

  const confirmRemoveTag = async () => {
    if (!storeCode || !tagPendingDelete?.id) return;

    setIsDeleting(true);
    try {
      // Reaching the next line is the success signal: `unwrap` throws on
      // any rejection, and the thunk rejects on any non-2xx. This used to
      // compare the response against the deleted tag's id — but a delete
      // answers with `data: {}`, so every successful removal reported a
      // failure while the row vanished from the list behind the toast.
      await dispatch(
        TicketTagDelete({ storeCode, tagId: tagPendingDelete.id }),
      ).unwrap();

      // if we deleted the last row on a page beyond the first, step back a page
      const isLastRowOnPage = tags.length === 1;
      if (isLastRowOnPage && page > 1) {
        setPage((p) => p - 1);
      } else {
        refetchCurrentPage();
      }

      toast.success("Tag removed", {
        description: "The tag has been removed successfully.",
      });
    } catch {
      //
    } finally {
      setIsDeleting(false);
      setTagPendingDelete(null);
    }
  };

  // Saving an edit to a tag that tickets or threads already carry changes it
  // on all of them, so that waits for a yes first. (An edit with nothing
  // changed never gets here: its Save button is disabled.)
  const handleSubmitTag = async (
    values: TagFormValues,
    helpers: FormikHelpers<TagFormValues>,
  ) => {
    if (editingTag && editingTagUsage) {
      setPendingSave({ values, helpers, usage: editingTagUsage });
      return;
    }
    await saveTag(values, helpers);
  };

  const confirmSave = async () => {
    if (!pendingSave) return;
    setIsConfirmingSave(true);
    try {
      await saveTag(pendingSave.values, pendingSave.helpers);
    } finally {
      // Closed either way: on success the edit dialog closes too, and on a
      // server error (a duplicate name, say) the message is on the form.
      setIsConfirmingSave(false);
      setPendingSave(null);
    }
  };

  // Cancel throws the edit away: the tag keeps its name, colour and description.
  const cancelSave = () => {
    pendingSave?.helpers.setSubmitting(false);
    setPendingSave(null);
    setDialogOpen(false);
    setEditingTag(null);
    setNameInput("");
  };

  const saveTag = async (
    values: TagFormValues,
    helpers: FormikHelpers<TagFormValues>,
  ) => {
    const { setSubmitting } = helpers;
    if (!storeCode) return;

    try {
      const payload = {
        name: values.name.trim(),
        color: values.color,
        description: values.description.trim(),
      };

      if (editingTag?.id) {
        await dispatch(
          TicketTagUpdate({
            storeCode,
            tagId: editingTag.id,
            payload,
          }),
        ).unwrap();

        toast.success("Tag updated", {
          description: `"${values.name}" has been updated.`,
        });

        refetchCurrentPage();
      } else {
        await dispatch(
          TicketTagCreate({
            storeCode,
            payload,
          }),
        ).unwrap();

        toast.success("Tag created", {
          description: `"${values.name}" has been added.`,
        });

        // a new tag was added — jump back to page 1 so it's visible.
        // if we're already on page 1, the page state won't change, so
        // explicitly refetch to pick up the new tag.
        if (page === 1) {
          refetchCurrentPage();
        } else {
          setPage(1);
        }
      }

      setDialogOpen(false);
      setEditingTag(null);
    } catch (error) {
      // unwrap() throws the rejected payload, which is where a duplicate
      // name or a bad colour comes back named.
      const body = (error as { data?: Record<string, unknown> } | null)?.data;
      const matches = body?.matched_tags;
      if (Array.isArray(matches) && matches.length > 0) {
        // A name that matches existing tags: list them, and put only the
        // message on the field (the list is not a form field).
        setSimilar({
          name: values.name.trim(),
          tags: matches as SupportTicketTagData[],
        });
        applyServerFieldErrors(helpers, { data: { name: body?.name } });
      } else {
        applyServerFieldErrors(helpers, error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => getTagColumns({ onEdit: openEditDialog, onRemove: requestRemoveTag }),
    [],
  );

  // The shared table is zero-indexed; this screen's API is 1-indexed.
  const pagination: PaginationState = { pageIndex: page - 1, pageSize: limit };
  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    setPage(next.pageIndex + 1);
    setLimit(next.pageSize);
  };

  return (
    <>
      {/* Toolbar sits above the table rather than inside a card — the same
          anatomy as Threads. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search tags…"
              label="Search tags"
              className="w-full max-w-xs"
            />
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as TagTypeFilter);
                setPage(1);
              }}
            >
              <SelectTrigger
                className={cn(
                  "w-[160px]",
                  typeFilter !== ALL_TYPES && ACTIVE_FILTER_STYLE,
                )}
                aria-label="Filter by type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TYPES}>All Types</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button type="button" variant="ghost" onClick={clearFilters}>
                <IconX className="size-4" />
                Clear filters
              </Button>
            )}
          </div>
          <Button onClick={openCreateDialog}>
            <IconPlus className="size-4" />
            Add Tag
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={tags}
          totalCount={total}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          isLoading={FetchSupportTicketTagsIsLoading}
          noun="tag"
          headerClassName="bg-muted hover:bg-muted"
          emptyTitle={
            debouncedSearch || typeFilter !== ALL_TYPES
              ? "No matching tags"
              : "No tags yet"
          }
          emptyDescription={
            debouncedSearch || typeFilter !== ALL_TYPES
              ? "Try a different search term or type."
              : "Create your first tag to start organising tickets."
          }
        />
      </div>

      {/* create / edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingTag(null);
            setNameInput("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit Tag" : "Add Tag"}</DialogTitle>
          </DialogHeader>

          {editingTagUsage ? (
            // The tag is shared: renaming or recolouring it changes it on
            // every ticket and thread listed here, so say so before the save.
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400"
            >
              <IconAlertTriangle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <p>
                This tag is used by {editingTagUsage}. Changes to its name,
                colour or description will show on all of them.
              </p>
            </div>
          ) : null}

          <Formik<TagFormValues>
            enableReinitialize
            initialValues={{
              name: editingTag?.name ?? "",
              color: editingTag?.color ?? COLOR_PRESETS[0],
              description: editingTag?.description ?? "",
            }}
            validate={validateWithZod}
            onSubmit={handleSubmitTag}
          >
            {({ isSubmitting, values, setFieldValue, errors, touched }) => (
              <Form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Tag name <RequiredMark />
                  </Label>
                  <Field name="name">
                    {({ field }: FieldProps) => (
                      <Input
                        id="name"
                        placeholder="e.g. Shipping"
                        maxLength={TAG_NAME_MAX}
                        {...field}
                        onChange={(event) => {
                          field.onChange(event);
                          setNameInput(event.target.value);
                        }}
                      />
                    )}
                  </Field>
                  {/* The input stops accepting text at the limit, so the
                      schema's length error can never fire; say so here. */}
                  {values.name.length >= TAG_NAME_MAX ? (
                    <p className="text-xs text-destructive">
                      {NAME_MAX_MESSAGE}
                    </p>
                  ) : (
                    errors.name &&
                    touched.name && (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )
                  )}
                  {matchedTags.length > 0 && (
                    <div className="space-y-2 rounded-md border bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">
                        {isDuplicate
                          ? "A tag with this name already exists. Use it, or choose a different name."
                          : "Similar tags already exist. You can still add this one."}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedTags.map((tag) => (
                          <TagBadge key={tag.id ?? tag.name} tag={tag} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">
                    Color <RequiredMark />
                  </Label>
                  <div className="flex items-center gap-2">
                    {/* selected color hex value */}
                    <Input
                      id="color"
                      value={values.color}
                      readOnly
                      placeholder="#000000"
                      maxLength={7}
                      className="flex-1 cursor-default font-mono"
                    />
                  </div>

                  {/* quick presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COLOR_PRESETS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setFieldValue("color", hex)}
                        className={cn(
                          "size-5 rounded-full border-2 transition",
                          values.color.toLowerCase() === hex
                            ? "border-foreground"
                            : "border-transparent",
                        )}
                        style={{ backgroundColor: hex }}
                        aria-label={`Use color ${hex}`}
                      />
                    ))}
                  </div>

                  {errors.color && touched.color && (
                    <p className="text-xs text-destructive">{errors.color}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <RequiredMark />
                  </Label>
                  <Field name="description">
                    {({ field }: FieldProps) => (
                      <Textarea
                        id="description"
                        placeholder="When should agents use this tag?"
                        className="resize-none"
                        rows={3}
                        maxLength={TAG_DESCRIPTION_MAX}
                        {...field}
                      />
                    )}
                  </Field>
                  {/* Error and counter share one row, so the message sits
                      right under the field instead of below a gap. */}
                  <div className="flex items-start justify-between gap-3">
                    {values.description.length >= TAG_DESCRIPTION_MAX ? (
                      <p className="text-xs text-destructive">
                        {DESCRIPTION_MAX_MESSAGE}
                      </p>
                    ) : errors.description && touched.description ? (
                      <p className="text-xs text-destructive">
                        {errors.description}
                      </p>
                    ) : (
                      <span />
                    )}
                    <p
                      className={cn(
                        "shrink-0 text-xs text-muted-foreground",
                        values.description.length >= TAG_DESCRIPTION_MAX &&
                          "text-destructive",
                      )}
                    >
                      {values.description.length}/{TAG_DESCRIPTION_MAX}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-3">
                  <Typography variant="muted">Preview</Typography>
                  <TagBadge
                    tag={{
                      name: values.name || "Tag name",
                      color: values.color,
                      description: values.description,
                    }}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      isDuplicate ||
                      // Editing with nothing changed: there is nothing to save.
                      (!!editingTag &&
                        values.name.trim() === editingTag.name &&
                        values.color === editingTag.color &&
                        values.description.trim() === editingTag.description)
                    }
                  >
                    {isSubmitting
                      ? editingTag
                        ? "Saving..."
                        : "Adding..."
                      : editingTag
                        ? "Save Changes"
                        : "Add Tag"}
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* confirmation before saving an edit to a tag that is in use */}
      <AlertDialog
        open={!!pendingSave}
        onOpenChange={(open) => {
          if (!open && !isConfirmingSave) cancelSave();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update this tag everywhere?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing this tag will update it across all tickets and threads
              currently associated with it ({pendingSave?.usage}). Do you want
              to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirmingSave}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // keep dialog open until the save resolves
                confirmSave();
              }}
              disabled={isConfirmingSave}
            >
              {isConfirmingSave ? "Saving..." : "Save Changes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* delete confirmation */}
      <AlertDialog
        open={!!tagPendingDelete}
        onOpenChange={(open) => {
          if (!open) setTagPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDeleteUsage ? "Tag is in use" : "Remove tag?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteUsage ? (
                <>
                  <span className="font-semibold text-foreground">
                    {tagPendingDelete?.name}
                  </span>{" "}
                  is used by {pendingDeleteUsage}, so it can&apos;t be removed.
                  Take it off those first, or edit the tag instead.
                </>
              ) : (
                <>
                  This will permanently remove{" "}
                  <span className="font-semibold text-foreground">
                    {tagPendingDelete?.name}
                  </span>{" "}
                  from your tag list. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {pendingDeleteUsage ? "Close" : "Cancel"}
            </AlertDialogCancel>
            {pendingDeleteUsage ? null : (
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault(); // keep dialog open until the async call resolves
                  confirmRemoveTag();
                }}
                disabled={isDeleting}
                className={buttonVariants({ variant: "destructive" })}
              >
                {isDeleting ? "Removing..." : "Remove Tag"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
