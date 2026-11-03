"use client";

import { useEffect, useMemo, useState } from "react";
import { IconAlertTriangle, IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import { Formik, Form, type FormikHelpers } from "formik";
import type { OnChangeFn, PaginationState } from "@tanstack/react-table";

import { DataTable } from "@/components/custom/data-table";
import { PAGE_SIZE_OPTIONS } from "@/components/custom/threads-data-table-pagination";
import { MultiSelectCombobox } from "@/components/custom/multi-select-combobox";
import { NumberStepper } from "@/components/custom/number-stepper";
import { SearchInput } from "@/components/custom/search-input";
import { getSlaPolicyColumns } from "@/components/custom/helpdesk/sla-policy-columns";
import { TagBadge } from "@/components/custom/helpdesk/tag-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { serverFieldErrors } from "@/lib/form-errors";
import {
  SLA_MAX_TARGET_MINUTES,
  maxForUnit,
  sanitizeWholeNumber,
  splitMinutes,
  toMinutes,
  type SlaUnit,
} from "@/lib/sla";
import {
  FetchSlaPolicies,
  SlaPolicyCreate,
  SlaPolicyDelete,
  SlaPolicyUpdate,
  fetchSlaPolicyTagOptions,
  type SlaPolicy,
  type SlaPolicyCreatePayload,
  type SlaPolicyPayload,
} from "@/redux/api-slice/sla-policy-slice";
import type { SupportTicketTagData } from "@/redux/api-slice/support-ticket-slice";

// Matches the smallest entry in the shared pagination's PAGE_SIZE_OPTIONS,
// so the rows-per-page dropdown always shows a real option.
const DEFAULT_PER_PAGE = 25;

type PolicyFormValues = {
  /** The ids (as text) of the tags to give the policy; none until chosen. */
  tags: string[];
  firstReply: string;
  firstReplyUnit: SlaUnit;
  everyReply: string;
  everyReplyUnit: SlaUnit;
  resolution: string;
  resolutionUnit: SlaUnit;
  isActive: boolean;
};

// The three targets as the form lays them out: the box holding the number,
// the unit beside it, and the policy field each one becomes.
const TARGET_INPUTS = [
  {
    value: "firstReply",
    unit: "firstReplyUnit",
    field: "first_reply_minutes",
    label: "First reply",
    hint: "From ticket creation to the first agent reply.",
  },
  {
    value: "everyReply",
    unit: "everyReplyUnit",
    field: "every_reply_minutes",
    label: "Every reply",
    hint: "From each customer message to the next agent reply.",
  },
  {
    value: "resolution",
    unit: "resolutionUnit",
    field: "resolution_minutes",
    label: "Resolution",
    hint: "From ticket creation (or reopening) until it is resolved.",
  },
] as const;

// Server field names, mapped to the form fields that show their errors.
const SERVER_FIELD_TO_FORM: Record<string, string> = {
  tags: "tags",
  tag: "tags",
  first_reply_minutes: "firstReply",
  every_reply_minutes: "everyReply",
  resolution_minutes: "resolution",
  targets: "targets",
};

/** The form's starting values for a policy (blank when creating one). */
function initialValues(policy: SlaPolicy | null): PolicyFormValues {
  const first = splitMinutes(policy?.first_reply_minutes);
  const every = splitMinutes(policy?.every_reply_minutes);
  const resolution = splitMinutes(policy?.resolution_minutes);
  return {
    tags: policy ? [String(policy.tag)] : [],
    firstReply: first.value,
    firstReplyUnit: first.unit,
    everyReply: every.value,
    everyReplyUnit: every.unit,
    resolution: resolution.value,
    resolutionUnit: resolution.unit,
    isActive: policy?.is_active ?? true,
  };
}

/** The policy the form describes, in the shape the API takes. */
function buildPayload(values: PolicyFormValues): SlaPolicyPayload {
  const minutes = (value: string, unit: SlaUnit) => {
    const result = toMinutes(value, unit);
    return result === null || Number.isNaN(result) ? null : result;
  };
  return {
    first_reply_minutes: minutes(values.firstReply, values.firstReplyUnit),
    every_reply_minutes: minutes(values.everyReply, values.everyReplyUnit),
    resolution_minutes: minutes(values.resolution, values.resolutionUnit),
    is_active: values.isActive,
  };
}

/** Errors in the form, keyed by field. */
function validate(
  values: PolicyFormValues,
  creating: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (creating && values.tags.length === 0) {
    errors.tags = "Choose at least one tag";
  }

  let targets = 0;
  for (const input of TARGET_INPUTS) {
    const minutes = toMinutes(values[input.value], values[input.unit]);
    if (minutes === null) continue;
    if (Number.isNaN(minutes)) {
      errors[input.value] = "Enter a whole number of 1 or more";
    } else if (minutes > SLA_MAX_TARGET_MINUTES) {
      errors[input.value] = "Must be 30 days or less";
    } else {
      targets += 1;
    }
  }
  if (targets === 0 && !TARGET_INPUTS.some((input) => errors[input.value])) {
    errors.targets = "Set at least one target";
  }
  return errors;
}

/** The asterisk on a required field label. */
function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden>
      *
    </span>
  );
}

export default function SlaPolicies() {
  const dispatch = useAppDispatch();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SlaPolicy | null>(null);
  // The tags a new policy can be created for; loaded when the dialog opens.
  const [tagOptions, setTagOptions] = useState<SupportTicketTagData[]>([]);
  const [tagOptionsLoading, setTagOptionsLoading] = useState(false);
  // The dialog itself, so the tag list can open inside it (a modal dialog
  // would otherwise swallow the wheel events of a list outside it).
  const [dialogEl, setDialogEl] = useState<HTMLElement | null>(null);

  const [policyPendingDelete, setPolicyPendingDelete] =
    useState<SlaPolicy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // An edit waiting for the user's yes. Saving a policy changes the SLA of
  // every ticket with its tag, so an edit is never saved without asking.
  const [pendingSave, setPendingSave] = useState<{
    values: PolicyFormValues;
    helpers: FormikHelpers<PolicyFormValues>;
  } | null>(null);
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(DEFAULT_PER_PAGE);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchSlaPoliciesData, FetchSlaPoliciesIsLoading } = useAppSelector(
    (state) => state.GetSlaPolicyReducer.FetchSlaPoliciesState,
  );

  const policies = FetchSlaPoliciesData?.results ?? [];
  const total = FetchSlaPoliciesData?.count ?? 0;
  const creating = !editingPolicy;

  // Debounce the search box so a request is not fired on every keystroke, and
  // go back to page 1 at the same time.
  useEffect(() => {
    const handle = setTimeout(() => {
      const next = searchInput.trim();
      if (next === debouncedSearch) return;
      setDebouncedSearch(next);
      setPage(1);
    }, 400);

    return () => clearTimeout(handle);
  }, [searchInput, debouncedSearch]);

  const refetch = () => {
    if (!storeCode) return;
    dispatch(
      FetchSlaPolicies({ storeCode, page, limit, search: debouncedSearch }),
    );
  };

  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      FetchSlaPolicies({ storeCode, page, limit, search: debouncedSearch }),
    );
  }, [dispatch, storeCode, page, limit, debouncedSearch]);

  // A new policy needs a tag without one, so look those up when the dialog
  // opens to create. An edited policy keeps its own tag.
  useEffect(() => {
    if (!dialogOpen || !creating || !storeCode) return;

    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for the request started below
    setTagOptionsLoading(true);
    fetchSlaPolicyTagOptions({ storeCode, signal: controller.signal }).then(
      (tags) => {
        if (controller.signal.aborted) return;
        setTagOptions(tags);
        setTagOptionsLoading(false);
      },
    );

    return () => controller.abort();
  }, [dialogOpen, creating, storeCode]);

  const openCreateDialog = () => {
    setEditingPolicy(null);
    setDialogOpen(true);
  };

  const openEditDialog = (policy: SlaPolicy) => {
    setEditingPolicy(policy);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPolicy(null);
  };

  const confirmRemovePolicy = async () => {
    if (!storeCode || !policyPendingDelete) return;

    setIsDeleting(true);
    try {
      // `unwrap` throws on any rejection, so reaching the next line is the
      // success signal.
      await dispatch(
        SlaPolicyDelete({ storeCode, policyId: policyPendingDelete.id }),
      ).unwrap();

      // Deleting the last row of a page beyond the first steps back a page.
      if (policies.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        refetch();
      }

      toast.success("SLA policy deleted", {
        description: `"${policyPendingDelete.tag_name}" no longer has an SLA.`,
      });
    } catch {
      //
    } finally {
      setIsDeleting(false);
      setPolicyPendingDelete(null);
    }
  };

  // Adding a policy saves straight away; editing one waits for a yes first.
  const handleSubmit = async (
    values: PolicyFormValues,
    helpers: FormikHelpers<PolicyFormValues>,
  ) => {
    if (editingPolicy) {
      setPendingSave({ values, helpers });
      return;
    }
    await savePolicy(values, helpers);
  };

  const confirmSave = async () => {
    if (!pendingSave) return;
    setIsConfirmingSave(true);
    try {
      await savePolicy(pendingSave.values, pendingSave.helpers);
    } finally {
      // Closed either way: on success the edit dialog closes too, and on a
      // server error the message is on the form.
      setIsConfirmingSave(false);
      setPendingSave(null);
    }
  };

  // No leaves the form open as it was, so nothing the user typed is lost.
  const cancelSave = () => {
    pendingSave?.helpers.setSubmitting(false);
    setPendingSave(null);
  };

  const savePolicy = async (
    values: PolicyFormValues,
    helpers: FormikHelpers<PolicyFormValues>,
  ) => {
    if (!storeCode) return;

    try {
      const payload = buildPayload(values);

      if (editingPolicy) {
        await dispatch(
          SlaPolicyUpdate({
            storeCode,
            policyId: editingPolicy.id,
            payload,
          }),
        ).unwrap();

        toast.success("SLA policy updated", {
          description: `"${editingPolicy.tag_name}" has been updated.`,
        });
        refetch();
      } else {
        const createPayload: SlaPolicyCreatePayload = {
          ...payload,
          tags: values.tags.map(Number),
        };
        const created = await dispatch(
          SlaPolicyCreate({ storeCode, payload: createPayload }),
        ).unwrap();

        toast.success(
          created.length === 1 ? "SLA policy created" : "SLA policies created",
          {
            description:
              created.length === 1
                ? `"${created[0].tag_name}" now has an SLA.`
                : `${created.length} tags now have this SLA.`,
          },
        );

        // Jump back to page 1 so the new policy is visible; if already
        // there, the page will not change, so fetch explicitly.
        if (page === 1) {
          refetch();
        } else {
          setPage(1);
        }
      }

      closeDialog();
    } catch (error) {
      // The rejected payload names the fields the server refused.
      const errors = serverFieldErrors(error);
      for (const [serverField, message] of Object.entries(errors)) {
        const formField = SERVER_FIELD_TO_FORM[serverField];
        if (formField) helpers.setFieldError(formField, message);
      }
    } finally {
      helpers.setSubmitting(false);
    }
  };

  const columns = useMemo(
    () =>
      getSlaPolicyColumns({
        onEdit: openEditDialog,
        onRemove: setPolicyPendingDelete,
      }),
    [],
  );

  // The shared table is zero-indexed; this screen's API is 1-indexed.
  const pagination: PaginationState = { pageIndex: page - 1, pageSize: limit };
  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    setPage(next.pageIndex + 1);
    setLimit(
      PAGE_SIZE_OPTIONS.includes(next.pageSize)
        ? next.pageSize
        : DEFAULT_PER_PAGE,
    );
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search by tag…"
            label="Search SLA policies by tag"
            className="w-full max-w-xs"
          />
          <Button onClick={openCreateDialog}>
            <IconPlus className="size-4" />
            Add SLA Policy
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={policies}
          totalCount={total}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          isLoading={FetchSlaPoliciesIsLoading}
          noun="policy"
          headerClassName="bg-muted hover:bg-muted"
          emptyTitle={
            debouncedSearch ? "No matching policies" : "No SLA policies yet"
          }
          emptyDescription={
            debouncedSearch
              ? "Try a different tag name."
              : "Add a policy to set reply and resolution targets for a tag."
          }
        />
      </div>

      {/* create / edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
          else setDialogOpen(true);
        }}
      >
        <DialogContent
          ref={setDialogEl}
          className="max-h-[90vh] overflow-y-auto sm:max-w-[460px]"
        >
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? "Edit SLA Policy" : "Add SLA Policy"}
            </DialogTitle>
          </DialogHeader>

          {editingPolicy ? (
            // The policy is shared by every ticket with the tag.
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400"
            >
              <IconAlertTriangle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <p>
                This policy applies to every ticket that carries the tag.
                Changes to its targets apply to all of them straight away.
              </p>
            </div>
          ) : (
            <div
              role="note"
              className="flex items-start gap-2 rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground"
            >
              <IconAlertTriangle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <p>
                Tickets that already carry these tags follow the policy straight
                away. Counted from when each ticket was created, the ones
                already past a target show as overdue.
              </p>
            </div>
          )}

          <Formik<PolicyFormValues>
            enableReinitialize
            initialValues={initialValues(editingPolicy)}
            validate={(values) => validate(values, creating)}
            onSubmit={handleSubmit}
          >
            {({
              isSubmitting,
              values,
              setFieldValue,
              setFieldTouched,
              errors,
              touched,
              submitCount,
              dirty,
            }) => {
              const submitted = submitCount > 0;
              const fieldErrors = errors as Record<string, string | undefined>;
              const touchedFields = touched as Record<
                string,
                boolean | undefined
              >;
              // A field's error shows once the user has left the field, or
              // tried to save — so a fresh form is not red.
              const errorFor = (field: string) =>
                touchedFields[field] || submitted ? fieldErrors[field] : null;

              return (
                <Form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tags">
                      {editingPolicy ? "Tag" : "Tags"} <RequiredMark />
                    </Label>
                    {editingPolicy ? (
                      // A policy keeps its tag for life.
                      <div>
                        <TagBadge
                          tag={{
                            name: editingPolicy.tag_name,
                            color: editingPolicy.tag_color,
                            description: "",
                          }}
                          className="max-w-none"
                        />
                      </div>
                    ) : (
                      <div onBlur={() => setFieldTouched("tags", true)}>
                        <MultiSelectCombobox
                          options={tagOptions.map((tag) => ({
                            value: String(tag.id),
                            label: tag.name,
                          }))}
                          value={values.tags}
                          onValueChange={(next) => setFieldValue("tags", next)}
                          placeholder={
                            tagOptionsLoading
                              ? "Loading tags…"
                              : tagOptions.length === 0
                                ? "Every tag already has a policy"
                                : "Choose one or more tags"
                          }
                          emptyMessage="No tags without a policy."
                          portalContainer={dialogEl}
                        />
                      </div>
                    )}
                    {editingPolicy ? null : (
                      <p className="text-xs text-muted-foreground">
                        Each tag you choose gets this policy. When a ticket has
                        several of them, the one with the shortest target
                        decides its SLA.
                      </p>
                    )}
                    {errorFor("tags") ? (
                      <p className="text-xs text-destructive">
                        {errorFor("tags")}
                      </p>
                    ) : null}
                  </div>

                  {TARGET_INPUTS.map((input) => (
                    <div key={input.value} className="space-y-2">
                      <Label htmlFor={input.value}>{input.label}</Label>
                      <div className="flex items-center gap-2">
                        <NumberStepper
                          id={input.value}
                          label={`${input.label.toLowerCase()} target`}
                          placeholder="—"
                          clearable
                          max={maxForUnit(values[input.unit])}
                          value={values[input.value]}
                          onChange={(value) =>
                            setFieldValue(input.value, value)
                          }
                          onBlur={() => setFieldTouched(input.value, true)}
                          invalid={!!errorFor(input.value)}
                        />
                        <Select
                          value={values[input.unit]}
                          onValueChange={(unit) => {
                            // A value that fits in minutes may not in hours.
                            setFieldValue(
                              input.value,
                              sanitizeWholeNumber(
                                values[input.value],
                                maxForUnit(unit as SlaUnit),
                              ),
                            );
                            setFieldValue(input.unit, unit);
                          }}
                        >
                          <SelectTrigger
                            className="w-28"
                            aria-label={`${input.label} unit`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minutes">Minutes</SelectItem>
                            <SelectItem value="hours">Hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {input.hint} Optional, up to 30 days.
                      </p>
                      {errorFor(input.value) ? (
                        <p className="text-xs text-destructive">
                          {errorFor(input.value)}
                        </p>
                      ) : null}
                    </div>
                  ))}

                  {fieldErrors.targets && submitted ? (
                    <p className="text-xs text-destructive">
                      {fieldErrors.targets}
                    </p>
                  ) : null}

                  <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="isActive">Active</Label>
                      <p className="text-xs text-muted-foreground">
                        Turn off to pause this policy without losing its
                        targets.
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={values.isActive}
                      onCheckedChange={(checked) =>
                        setFieldValue("isActive", checked)
                      }
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeDialog}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      // Editing with nothing changed: there is nothing to save.
                      disabled={isSubmitting || (!!editingPolicy && !dirty)}
                    >
                      {isSubmitting
                        ? editingPolicy
                          ? "Saving..."
                          : "Adding..."
                        : editingPolicy
                          ? "Save Changes"
                          : "Add Policy"}
                    </Button>
                  </DialogFooter>
                </Form>
              );
            }}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* confirmation before saving an edit */}
      <AlertDialog
        open={!!pendingSave}
        onOpenChange={(open) => {
          if (!open && !isConfirmingSave) cancelSave();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update this SLA policy?</AlertDialogTitle>
            <AlertDialogDescription>
              This policy applies to every ticket that carries{" "}
              <span className="font-semibold text-foreground">
                {editingPolicy?.tag_name}
              </span>
              , open tickets included. Their deadlines are recalculated from the
              new targets, so some may become due sooner or already overdue. Do
              you want to continue?
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
        open={!!policyPendingDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPolicyPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SLA policy?</AlertDialogTitle>
            <AlertDialogDescription>
              Tickets with{" "}
              <span className="font-semibold text-foreground">
                {policyPendingDelete?.tag_name}
              </span>{" "}
              will stop following this policy, open tickets included. A ticket
              with another tag that has an SLA policy follows that one;
              otherwise its deadlines are removed and no breach alerts are sent
              for it. The tag itself stays, and you can add a policy for it
              again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // keep dialog open until the async call resolves
                confirmRemovePolicy();
              }}
              disabled={isDeleting}
              className={buttonVariants({ variant: "destructive" })}
            >
              {isDeleting ? "Deleting..." : "Delete Policy"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
