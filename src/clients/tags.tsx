"use client";

import { useState, useEffect, useMemo } from "react";
import { IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import { Formik, Form, Field, type FieldProps } from "formik";
import z from "zod";
import type { OnChangeFn, PaginationState } from "@tanstack/react-table";
import { PageHeading } from "@/components/custom/page-heading";
import { DataTable } from "@/components/custom/data-table";
import { SearchInput } from "@/components/custom/search-input";
import { getTagColumns } from "@/components/custom/helpdesk/tags-columns";
import { TagBadge } from "@/components/custom/helpdesk/tag-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchSupportTicketTags,
  TicketTagDelete,
  TicketTagCreate,
  TicketTagUpdate,
  type SupportTicketTagData,
} from "@/redux/api-slice/support-ticket-slice";

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

// keep in sync with the thunk's default `limit`
const PER_PAGE_OPTIONS = [10, 15, 20, 25, 50] as const;
const DEFAULT_PER_PAGE = PER_PAGE_OPTIONS[0];

const tagSchema = z.object({
  name: z.string().trim().min(3, "Too short").max(30, "Too long"),
  color: z.string().regex(HEX_REGEX, "Enter a valid hex color"),
  description: z.string().trim().min(3, "Too short").max(120, "Too long"),
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<SupportTicketTagData | null>(
    null,
  );

  // tag pending delete confirmation (null = confirm dialog closed)
  const [tagPendingDelete, setTagPendingDelete] =
    useState<SupportTicketTagData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // pagination + search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(DEFAULT_PER_PAGE);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
  // off of debouncedSearch changing
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      FetchSupportTicketTags({
        storeCode,
        page,
        limit,
        search: debouncedSearch,
      }),
    );
  }, [dispatch, storeCode, page, limit, debouncedSearch]);

  const openCreateDialog = () => {
    setEditingTag(null);
    setDialogOpen(true);
  };

  const openEditDialog = (tag: SupportTicketTagData) => {
    setEditingTag(tag);
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
      }),
    );
  };

  const confirmRemoveTag = async () => {
    if (!storeCode || !tagPendingDelete?.id) return;

    setIsDeleting(true);
    try {
      const deletedTag = await dispatch(
        TicketTagDelete({ storeCode, tagId: tagPendingDelete.id }),
      ).unwrap();

      if (deletedTag?.id === tagPendingDelete.id) {
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
      } else {
        toast.error("Couldn't remove tag", {
          description: "The tag could not be removed. Please try again.",
        });
      }
    } catch {
      //
    } finally {
      setIsDeleting(false);
      setTagPendingDelete(null);
    }
  };

  const handleSubmitTag = async (
    values: TagFormValues,
    { setSubmitting }: { setSubmitting: (v: boolean) => void },
  ) => {
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
    } catch {
      //
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
    <div className="flex flex-col gap-6 p-4">
      <PageHeading
        title="Tags"
        description="Label support tickets so they can be grouped, filtered and found quickly."
      />

      {/* Toolbar sits above the table rather than inside a card — the same
          anatomy as Threads. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search tags…"
            label="Search tags"
            className="w-full max-w-xs"
          />
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
          emptyTitle={debouncedSearch ? "No matching tags" : "No tags yet"}
          emptyDescription={
            debouncedSearch
              ? "Try a different search term."
              : "Create your first tag to start organising tickets."
          }
        />
      </div>

      {/* create / edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTag(null);
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit tag" : "Add tag"}</DialogTitle>
          </DialogHeader>

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
                      <Input id="name" placeholder="e.g. Shipping" {...field} />
                    )}
                  </Field>
                  {errors.name && touched.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
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
                        {...field}
                      />
                    )}
                  </Field>
                  {errors.description && touched.description && (
                    <p className="text-xs text-destructive">
                      {errors.description}
                    </p>
                  )}
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
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? editingTag
                        ? "Saving..."
                        : "Adding..."
                      : editingTag
                        ? "Save changes"
                        : "Add tag"}
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* delete confirmation */}
      <AlertDialog
        open={!!tagPendingDelete}
        onOpenChange={(open) => {
          if (!open) setTagPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove tag?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-semibold text-foreground">
                {tagPendingDelete?.name}
              </span>{" "}
              from your tag list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // keep dialog open until the async call resolves
                confirmRemoveTag();
              }}
              disabled={isDeleting}
              className={buttonVariants({ variant: "destructive" })}
            >
              {isDeleting ? "Removing..." : "Remove tag"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
