import { useState } from "react";
import { IconX, IconPencil } from "@tabler/icons-react";
import { toast } from "sonner";
import { Formik, Form, Field, type FieldProps } from "formik";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  StatusPill,
  TableShell,
  SettingsCard,
  InfoCallout,
} from "../ticketing-settings";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchSupportTicketTags,
  TicketTagDelete,
  TicketTagCreate,
  TicketTagUpdate,
  type SupportTicketTagsResponse,
} from "@/redux/api-slice/support-ticket-slice";
import { useEffect } from "react";

const customFields = [
  ["Return reason", "Select", "Ticket", "Rules, Views"],
  ["Order value band", "Select", "Ticket", "Routing"],
  ["Customer segment", "Select", "Customer", "VIP routing, SLA"],
  ["Warranty status", "Boolean", "Ticket", "Macros"],
];

// preset swatches shown next to the native color picker for quick selection
const COLOR_PRESETS = [
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ef4444", // red
  "#8b5cf6", // violet
  "#6366f1", // indigo
  "#22c55e", // green
] as const;

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

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
  const [editingTag, setEditingTag] =
    useState<SupportTicketTagsResponse | null>(null);

  // tag pending delete confirmation (null = confirm dialog closed)
  const [tagPendingDelete, setTagPendingDelete] =
    useState<SupportTicketTagsResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchSupportTicketTagsData, FetchSupportTicketTagsIsLoading } =
    useAppSelector(
      (state) => state.SupportTicketsSliceReducer.FetchSupportTicketTagsState,
    );

  useEffect(() => {
    if (!storeCode) return;
    dispatch(FetchSupportTicketTags(storeCode));
  }, [dispatch, storeCode]);

  const openCreateDialog = () => {
    setEditingTag(null);
    setDialogOpen(true);
  };

  const openEditDialog = (tag: SupportTicketTagsResponse) => {
    setEditingTag(tag);
    setDialogOpen(true);
  };

  const requestRemoveTag = (tag: SupportTicketTagsResponse) => {
    setTagPendingDelete(tag);
  };

  const confirmRemoveTag = async () => {
    if (!storeCode || !tagPendingDelete?.id) return;

    setIsDeleting(true);
    try {
      const deletedTag = await dispatch(
        TicketTagDelete({ storeCode, tagId: tagPendingDelete.id }),
      ).unwrap();

      if (deletedTag?.id === tagPendingDelete.id) {
        dispatch(FetchSupportTicketTags(storeCode));

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
      }

      dispatch(FetchSupportTicketTags(storeCode));
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
      <InfoCallout tone="amber" icon="warning">
        <b>Governance on by default.</b> Agents apply tags from this list but
        cannot invent new ones - the #1 cause of messy analytics in Georgias.
        Admins manage the taxonomy here.
      </InfoCallout>
      <SettingsCard
        title="Ticket tags (governed)"
        action={<StatusPill>Locked taxonomy</StatusPill>}
      >
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            {FetchSupportTicketTagsData.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="group cursor-default gap-1 hover:bg-accent"
                style={{ color: tag.color }}
              >
                <span
                  className="cursor-pointer"
                  onClick={() => openEditDialog(tag)}
                >
                  {tag.name}
                </span>
                <IconPencil
                  className="!pointer-events-auto cursor-pointer opacity-0 group-hover:opacity-100"
                  onClick={() => openEditDialog(tag)}
                  size={13}
                  stroke={2}
                />
                <IconX
                  className="!pointer-events-auto cursor-pointer"
                  onClick={() => requestRemoveTag(tag)}
                  size={15}
                  stroke={2}
                />
              </Badge>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-white"
            onClick={openCreateDialog}
          >
            + Add tag
          </Button>
        </div>
      </SettingsCard>
      <SettingsCard title="Custom fields">
        <TableShell
          columns={["Field", "Type", "Applies to", "Used in"]}
          rows={customFields.map(([field, type, appliesTo, usedIn]) => [
            <span key="field" className="font-bold text-slate-950">
              {field}
            </span>,
            type,
            appliesTo,
            usedIn,
          ])}
        />
      </SettingsCard>

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
                    {/* native color picker swatch */}
                    <input
                      id="color"
                      type="color"
                      value={
                        HEX_REGEX.test(values.color) ? values.color : "#000000"
                      }
                      onChange={(e) => setFieldValue("color", e.target.value)}
                      className="size-9 shrink-0 cursor-pointer rounded-md border p-0.5"
                    />
                    {/* editable hex value */}
                    <Input
                      value={values.color}
                      onChange={(e) => setFieldValue("color", e.target.value)}
                      placeholder="#000000"
                      maxLength={7}
                      className="flex-1 font-mono"
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
                  <Badge variant="outline" style={{ color: values.color }}>
                    {values.name || "Tag name"}
                  </Badge>
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
