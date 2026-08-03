import { useState, useEffect } from "react";
import {
  IconX,
  IconPencil,
  IconPlus,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Formik, Form, Field, type FieldProps } from "formik";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchSupportTicketTags,
  TicketTagDelete,
  TicketTagCreate,
  TicketTagUpdate,
  type SupportTicketTagData,
} from "@/redux/api-slice/support-ticket-slice";
import { Spinner } from "@/components/ui/spinner";

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
const PER_PAGE_OPTIONS = [15, 25, 50, 100] as const;
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

export function TagsFieldsSection() {
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
      (state) => state.SupportTicketsSliceReducer.FetchSupportTicketTagsState,
    );

  const tags = FetchSupportTicketTagsData?.results ?? [];
  const total = FetchSupportTicketTagsData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

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
    console.log("editingTag>>", editingTag);

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

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white">
        <div className="flex items-center justify-between border-b p-4">
          <div className="relative w-full max-w-xs">
            <IconSearch
              size={16}
              stroke={2}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search tags..."
              className="pl-9"
            />
          </div>
          <Button onClick={openCreateDialog} className="gap-1.5">
            <IconPlus size={16} stroke={2} />
            Add tag
          </Button>
        </div>

        <div className="max-h-[520px] overflow-y-auto">
          <Table>
            <TableHeader>
            <TableRow>
              <TableHead className="w-16">Sno</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-28">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FetchSupportTicketTagsIsLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-slate-400"
                >
                  <div className="text-center">
                    <Spinner className="mx-auto mb-3 size-6" />
                    <p className="text-sm text-slate-500">Loading tags...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : tags.length ? (
              tags.map((tag, index) => (
                <TableRow key={tag.id}>
                  <TableCell className="text-slate-500">
                    {rangeStart + index}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2 font-medium text-slate-900">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="max-w-xs truncate cursor-default">
                          {tag.description || "-"}
                        </p>
                      </TooltipTrigger>

                      {tag.description && (
                        <TooltipContent className="max-w-sm">
                          <p className="whitespace-normal break-words">
                            {tag.description}
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => openEditDialog(tag)}
                        aria-label={`Edit ${tag.name}`}
                      >
                        <IconPencil size={14} stroke={2} />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600"
                        onClick={() => requestRemoveTag(tag)}
                        aria-label={`Remove ${tag.name}`}
                      >
                        <IconX size={14} stroke={2} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center">
                  <p className="text-sm font-medium text-slate-900">
                    {debouncedSearch ? "No matching tags" : "No tags created"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {debouncedSearch
                      ? "Try a different search term."
                      : "Create your first tag to organize support tickets."}
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {total} {total === 1 ? "tag" : "tags"} total
          </div>

          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6">
            {/* Page size selector */}
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium whitespace-nowrap">
                Rows per page
              </p>
              <Select
                value={`${limit}`}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-18">
                  <SelectValue placeholder={limit} />
                </SelectTrigger>
                <SelectContent side="top">
                  {PER_PAGE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page indicator */}
            <div className="flex items-center justify-center text-sm font-medium whitespace-nowrap">
              Page {page} of {totalPages}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="hidden h-8 w-8 lg:flex"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                aria-label="Go to first page"
              >
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Go to previous page"
              >
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Go to next page"
              >
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="hidden h-8 w-8 lg:flex"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                aria-label="Go to last page"
              >
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
                    Tag name <span className="text-red-500">*</span>
                  </Label>
                  <Field name="name">
                    {({ field }: FieldProps) => (
                      <Input id="name" placeholder="e.g. Shipping" {...field} />
                    )}
                  </Field>
                  {errors.name && touched.name && (
                    <p className="text-xs text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">
                    Color <span className="text-red-500">*</span>
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
                            ? "border-slate-900"
                            : "border-transparent",
                        )}
                        style={{ backgroundColor: hex }}
                        aria-label={`Use color ${hex}`}
                      />
                    ))}
                  </div>

                  {errors.color && touched.color && (
                    <p className="text-xs text-red-600">{errors.color}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
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
                    <p className="text-xs text-red-600">{errors.description}</p>
                  )}
                </div>

                <div className="rounded-md border bg-slate-50 p-3">
                  <p className="mb-1 text-xs text-slate-500">Preview</p>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: values.color }}
                    />
                    {values.name || "Tag name"}
                  </span>
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
              <span className="font-semibold text-slate-900">
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
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Removing..." : "Remove tag"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
