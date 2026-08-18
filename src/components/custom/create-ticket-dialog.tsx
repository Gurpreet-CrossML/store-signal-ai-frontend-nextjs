"use client";

import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { z } from "zod";
import {
  IconSearch,
  IconSparkles,
  IconTicket,
  IconUserPlus,
  IconX,
} from "@tabler/icons-react";

import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { LoadingState } from "@/components/custom/loading-state";
import { MultiSelectCombobox } from "@/components/custom/multi-select-combobox";
import { SearchInput } from "@/components/custom/search-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { applyServerFieldErrors, formikErrorsFromZod } from "@/lib/form-errors";
import { formatDate, formatPrice } from "@/lib/helpers";
import { SearchCustomers } from "@/redux/api-slice/customer-slice";
import {
  FetchCustomerOrders,
  SyncCustomerOrders,
} from "@/redux/api-slice/order-slice";
import {
  FetchSupportTicketTags,
  type CreateSupportTicketPayload,
  type SupportTicketDraft,
  type SupportTicketPriority,
} from "@/redux/api-slice/support-ticket-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/** Cheap sanity check — the server is the authority on what it accepts. */
function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function displayName(customer: {
  first_name?: string | null;
  last_name?: string | null;
  email: string;
}) {
  const full =
    `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();
  return full || customer.email;
}

const PRIORITIES: { value: SupportTicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

/** No order chosen. A Select cannot hold "" as a value, so absence needs a word. */
const NO_ORDER = "none";

/**
 * Who the ticket is for, in whichever of the two states the agent is in.
 *
 * A shopper the store already knows is a record; one it does not is an
 * email address and nothing more. Both are legitimate — refusing to raise
 * a ticket until a record exists would make an agent stop mid-conversation
 * to create one — so the field carries either, and says plainly which it
 * is holding rather than showing a bare string both times.
 */
export type TicketCustomer =
  // Identity only. The callers that seed this — a live chat, a social DM —
  // hold a name and an email, not a directory record, and requiring the
  // full record would make them fetch one just to open a dialog.
  | { kind: "record"; id: number; name: string; email: string }
  | { kind: "email"; email: string }
  | null;

type FormValues = {
  subject: string;
  description: string;
  priority: SupportTicketPriority;
  orderId: string;
  tagNames: string[];
};

const schema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, "Give the ticket a subject of at least 3 characters.")
    .max(500, "Keep the subject under 500 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Describe the problem in at least 10 characters."),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  orderId: z.string(),
  tagNames: z.array(z.string()),
});

/** The chosen customer, or the search that finds one. */
function CustomerField({
  value,
  onChange,
  storeCode,
  disabled,
}: {
  value: TicketCustomer;
  onChange: (next: TicketCustomer) => void;
  storeCode: string;
  disabled?: boolean;
}) {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  const { SearchCustomersData, SearchCustomersIsLoading } = useAppSelector(
    (state) => state.GetCustomerReducer.SearchCustomersState,
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!storeCode || debounced.length < 2) return;
    dispatch(SearchCustomers({ storeCode, search: debounced }));
  }, [dispatch, storeCode, debounced]);

  // Chosen: show who, not a search box they might edit by accident.
  if (value) {
    const name = value.kind === "record" ? value.name : value.email;

    return (
      <div className="flex items-center gap-3 rounded-lg border border-border p-2.5">
        <CustomerAvatar name={name} size="size-8" />
        <div className="min-w-0 flex-1">
          <Typography variant="small" as="p" className="truncate">
            {name}
          </Typography>
          <Typography variant="muted" className="truncate">
            {/* The distinction matters at submit time — one goes as an id,
                the other as an address to match or create — so it is said
                here rather than left for the agent to infer. */}
            {value.kind === "record"
              ? value.email
              : "New customer — will be created from this email"}
          </Typography>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Clear customer"
          disabled={disabled}
          onClick={() => {
            onChange(null);
            setSearch("");
            setDebounced("");
          }}
        >
          <IconX className="size-4" />
        </Button>
      </div>
    );
  }

  const results = SearchCustomersData ?? [];
  const canUseEmail =
    looksLikeEmail(debounced) &&
    !results.some((c) => c.email.toLowerCase() === debounced.toLowerCase());

  return (
    <div className="flex flex-col gap-2">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="name@example.com"
        label="Search customers by email"
      />
      <div className="h-40 overflow-y-auto rounded-lg border border-border">
        {debounced.length < 2 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center">
            <IconSearch className="mb-1 size-5 text-muted-foreground opacity-40" />
            <Typography variant="muted">
              Start typing an email address.
            </Typography>
          </div>
        ) : SearchCustomersIsLoading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingState label="Searching…" className="py-0" />
          </div>
        ) : results.length > 0 ? (
          <div className="flex flex-col p-1">
            {results.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() =>
                  onChange({
                    kind: "record",
                    id: customer.id,
                    name: displayName(customer),
                    email: customer.email,
                  })
                }
                className="flex items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
              >
                <CustomerAvatar name={displayName(customer)} size="size-8" />
                <div className="min-w-0">
                  <Typography variant="small" as="p" className="truncate">
                    {displayName(customer)}
                  </Typography>
                  <Typography variant="muted" className="truncate">
                    {customer.email}
                  </Typography>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <IconUserPlus className="size-5 text-muted-foreground opacity-40" />
            <Typography variant="muted">
              {canUseEmail
                ? "No record yet — raise the ticket against this address."
                : "Enter a full email address to use it."}
            </Typography>
            {canUseEmail ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange({ kind: "email", email: debounced })}
              >
                Use {debounced}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Raise a support ticket from a conversation the agent is already in.
 *
 * Live chat and social DMs are where a problem surfaces, but the help desk
 * is where it gets worked and tracked — so an agent had to leave, find the
 * shopper again and retype what they had just been told. This closes that
 * gap without leaving the conversation.
 */
export function CreateTicketDialog({
  open,
  onOpenChange,
  storeCode,
  /** Who the conversation is with, so the agent does not search for someone already on screen. */
  initialCustomer = null,
  initialSubject = "",
  onDraft,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeCode: string;
  initialCustomer?: TicketCustomer;
  initialSubject?: string;
  /**
   * Read the conversation and suggest the ticket. Optional — a screen with
   * no conversation behind it simply does not offer the button. Like
   * `onSubmit`, the caller owns the request: the two inboxes draft from
   * different routes.
   */
  onDraft?: () => Promise<SupportTicketDraft | null>;
  /**
   * Send the ticket. The caller owns the request because the two inboxes
   * post to different routes — a DM goes to its social contact's own
   * endpoint, a live chat to the help desk's — and the form is the same
   * either way. Resolve `ok: false` with the rejection payload and the
   * server's field errors land on the right inputs.
   */
  onSubmit: (
    payload: CreateSupportTicketPayload,
  ) => Promise<{ ok: boolean; payload?: unknown }>;
}) {
  const dispatch = useAppDispatch();
  const [customer, setCustomer] = useState<TicketCustomer>(initialCustomer);
  // State, not a ref: the tag dropdown portals into this element, and the
  // portal target is read during render — a ref would still be null on the
  // render that matters.
  const [contentEl, setContentEl] = useState<HTMLElement | null>(null);
  const [drafting, setDrafting] = useState(false);

  const { CreateSupportTicketIsLoading } = useAppSelector(
    (state) => state.GetSupportTicketsReducer.CreateSupportTicketState,
  );
  const { FetchSupportTicketTagsData, FetchSupportTicketTagsIsLoading } =
    useAppSelector(
      (state) => state.GetSupportTicketsReducer.FetchSupportTicketTagsState,
    );
  const { FetchCustomerOrdersData, FetchCustomerOrdersIsLoading } =
    useAppSelector((state) => state.GetOrderReducer.FetchCustomerOrdersState);
  const { SyncCustomerOrdersIsLoading } = useAppSelector(
    (state) => state.GetOrderReducer.SyncCustomerOrdersState,
  );

  const customerId = customer?.kind === "record" ? customer.id : null;

  const formik = useFormik<FormValues>({
    initialValues: {
      subject: initialSubject,
      description: "",
      priority: "normal",
      orderId: NO_ORDER,
      tagNames: [],
    },
    validate: (values) => {
      const result = schema.safeParse(values);
      if (result.success) return {};
      return formikErrorsFromZod(result.error.issues);
    },
    onSubmit: async (values) => {
      if (!storeCode || !customer) return;

      const payload: CreateSupportTicketPayload = {
        // Both cases send an address: a picked shopper contributes theirs,
        // a typed one is the address itself. The server resolves it either
        // way, creating a record when the address is new — so there is no
        // branch here.
        customer: customer.email,
        subject: values.subject.trim(),
        description: values.description.trim(),
        priority: values.priority,
        ...(values.tagNames.length
          ? { tags: values.tagNames.map((name) => ({ name })) }
          : {}),
        ...(values.orderId !== NO_ORDER
          ? { order: Number(values.orderId) }
          : {}),
      };

      const result = await onSubmit(payload);

      if (result.ok) {
        onOpenChange(false);
        return;
      }
      applyServerFieldErrors(formik, result.payload);
    },
  });

  // Reopening starts clean rather than on the last attempt. Adjusted during
  // render against a sentinel, the endorsed alternative to setting state
  // from an effect.
  const [lastOpen, setLastOpen] = useState(open);
  if (lastOpen !== open) {
    setLastOpen(open);
    if (open) {
      formik.resetForm({
        values: {
          subject: initialSubject,
          description: "",
          priority: "normal",
          orderId: NO_ORDER,
          tagNames: [],
        },
      });
      setCustomer(initialCustomer);
    }
  }

  useEffect(() => {
    if (!open || !storeCode) return;
    dispatch(FetchSupportTicketTags({ storeCode, page: 1, limit: 100 }));
  }, [dispatch, open, storeCode]);

  // Refresh from the store first, then list what is held.
  //
  // A ticket is often raised about an order placed minutes ago, and the
  // stored history is only as fresh as the last sync — offering a list
  // that does not contain the order being complained about is worse than
  // waiting a moment for it. The list runs whatever the sync did, so a
  // platform that is down or slow costs freshness, not the dropdown.
  //
  // Re-runs when the chosen shopper changes: an agent who switches
  // customer must not be offered the previous one's orders.
  useEffect(() => {
    if (!open || !storeCode || !customerId) return;

    let cancelled = false;
    const loadOrders = async () => {
      await dispatch(SyncCustomerOrders({ storeCode, customerId }));
      if (cancelled) return;
      dispatch(
        FetchCustomerOrders({
          storeCode,
          customerId,
          page: 1,
          limit: 50,
          filters: { ordering: "-created_at" },
        }),
      );
    };
    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [dispatch, open, storeCode, customerId]);

  const handleDraft = async () => {
    if (!onDraft) return;
    setDrafting(true);
    try {
      const draft = await onDraft();
      // An empty conversation comes back with blank fields rather than a
      // guessed ticket, so there is nothing to write and the agent types.
      if (!draft?.subject && !draft?.description) return;

      formik.setValues({
        ...formik.values,
        subject: draft.subject,
        description: draft.description,
        priority: draft.priority,
        tagNames: draft.tags.map((tag) => tag.name),
      });
    } finally {
      setDrafting(false);
    }
  };

  // Keyed by name, not id: the API resolves a tag by name, reusing one
  // that exists and creating one that does not, so a name is the value
  // that survives the round trip.
  //
  // A drafted tag is merged in even when it is not in the store's list —
  // the AI returns Title Case and tags resolve case-insensitively, so
  // "Wrong Item" is the store's "wrong item" and must still show as a
  // chip the agent can see and remove.
  const tagOptions = [
    ...new Set([
      ...(FetchSupportTicketTagsData?.results ?? []).map((tag) => tag.name),
      ...formik.values.tagNames,
    ]),
  ].map((name) => ({ value: name, label: name }));

  const orders = customerId ? (FetchCustomerOrdersData?.results ?? []) : [];
  // One spinner for the pair: the agent asked for "this shopper's orders",
  // not for two separate requests.
  const ordersLoading =
    SyncCustomerOrdersIsLoading || FetchCustomerOrdersIsLoading;
  const busy = CreateSupportTicketIsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={setContentEl} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Ticket</DialogTitle>
          <DialogDescription>
            Raise a help desk ticket from this conversation. It lands in the
            open queue.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={formik.handleSubmit}
          className="flex max-h-[60vh] flex-col gap-6 overflow-y-auto px-1"
        >
          {/* Above the fields it writes, and separated by a rule rather
              than sitting in a box of its own — it is an action on this
              form, not a section of it. */}
          {onDraft ? (
            <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
              <div className="min-w-0">
                <Typography variant="small" as="p">
                  Draft from Conversation
                </Typography>
                <Typography variant="muted">
                  Reads the recent messages and fills in the subject,
                  description, priority and tags. Everything stays editable.
                </Typography>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={drafting || busy}
                onClick={handleDraft}
              >
                {drafting ? (
                  <Spinner className="size-4" />
                ) : (
                  <IconSparkles className="size-4" />
                )}
                {drafting ? "Drafting…" : "Draft with AI"}
              </Button>
            </div>
          ) : null}

          <Field>
            <FieldLabel>
              Customer
              <span className="-ml-1 text-xs text-destructive">*</span>
            </FieldLabel>
            <FieldDescription>
              Pick an existing shopper, or raise it against an email address.
            </FieldDescription>
            <CustomerField
              value={customer}
              onChange={setCustomer}
              storeCode={storeCode}
              disabled={busy}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-subject">
              Subject
              <span className="-ml-1 text-xs text-destructive">*</span>
            </FieldLabel>
            <Input
              id="ticket-subject"
              name="subject"
              value={formik.values.subject}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Refund not received for order #1042"
            />
            {formik.touched.subject && formik.errors.subject && (
              <Typography variant="caption" as="p" className="text-destructive">
                {formik.errors.subject}
              </Typography>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-description">
              Description
              <span className="-ml-1 text-xs text-destructive">*</span>
            </FieldLabel>
            <Textarea
              id="ticket-description"
              name="description"
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="What the customer asked for, and anything the next agent needs to know."
            />
            {formik.touched.description && formik.errors.description && (
              <Typography variant="caption" as="p" className="text-destructive">
                {formik.errors.description}
              </Typography>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-order">Order</FieldLabel>
            <FieldDescription>
              {customerId
                ? "The order this is about, if it is about one."
                : "Pick a customer first — orders belong to a shopper."}
            </FieldDescription>
            <Select
              value={formik.values.orderId}
              onValueChange={(value) => formik.setFieldValue("orderId", value)}
              disabled={!customerId || ordersLoading || busy}
            >
              <SelectTrigger id="ticket-order" className="w-full">
                <SelectValue
                  placeholder={ordersLoading ? "Loading orders…" : "No order"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ORDER}>No order</SelectItem>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={String(order.id)}>
                    {order.name || `#${order.order_number}`} ·{" "}
                    {formatPrice(
                      Number(order.total_price ?? 0),
                      order.currency,
                    )}{" "}
                    · {formatDate(order.created_at)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-priority">Priority</FieldLabel>
            <Select
              value={formik.values.priority}
              onValueChange={(value) => formik.setFieldValue("priority", value)}
              disabled={busy}
            >
              <SelectTrigger id="ticket-priority" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Tags</FieldLabel>
            <FieldDescription>
              The same labels the help desk sorts by.
            </FieldDescription>
            <MultiSelectCombobox
              options={tagOptions}
              value={formik.values.tagNames}
              onValueChange={(value) => formik.setFieldValue("tagNames", value)}
              placeholder="Add tags…"
              emptyMessage="No matching tags."
              isLoading={FetchSupportTicketTagsIsLoading}
              portalContainer={contentEl}
            />
          </Field>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            // Disabled rather than validated-on-submit: without a customer
            // there is nobody to raise it for, and the message would have
            // to point at a field the form cannot highlight.
            disabled={!customer || busy}
            onClick={() => formik.handleSubmit()}
          >
            {busy ? (
              <Spinner className="size-4" />
            ) : (
              <IconTicket className="size-4" />
            )}
            Create Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
