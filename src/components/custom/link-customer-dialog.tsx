"use client";

import { useEffect, useState } from "react";
import { IconPlus, IconSearch, IconUserPlus } from "@tabler/icons-react";

import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { LoadingState } from "@/components/custom/loading-state";
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
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import {
  CreateCustomer,
  SearchCustomers,
  type CustomerRecord,
} from "@/redux/api-slice/customer-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/** Cheap sanity check — the server is the authority on what it accepts. */
function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function customerName(customer: CustomerRecord) {
  const full =
    `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();
  return full || customer.email;
}

/**
 * Attach a real customer to something a guest raised.
 *
 * One field does both jobs. An agent types the email they have; matches
 * appear as they type and can be picked, and if the shopper has no record
 * yet the same email creates one. Asking them to decide up front whether
 * they are searching or creating is asking a question they cannot answer
 * until they have already searched.
 *
 * A created record holds only the email. The rest — name, phone, addresses
 * — arrives from the next store sync or gets filled in from CRM, and
 * demanding it here would stall the agent mid-ticket.
 */
export function LinkCustomerDialog({
  open,
  onOpenChange,
  storeCode,
  linking,
  onLink,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeCode: string;
  /** True while the caller is attaching the chosen customer. */
  linking?: boolean;
  onLink: (customer: CustomerRecord) => void;
}) {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  const { SearchCustomersData, SearchCustomersIsLoading } = useAppSelector(
    (state) => state.GetCustomerReducer.SearchCustomersState,
  );
  const { CreateCustomerIsLoading } = useAppSelector(
    (state) => state.GetCustomerReducer.CreateCustomerState,
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open || !storeCode || debounced.length < 2) return;
    dispatch(SearchCustomers({ storeCode, search: debounced }));
  }, [dispatch, open, storeCode, debounced]);

  // Reopening starts clean rather than on the last search. Adjusted during
  // render against a sentinel, the endorsed alternative to setting state
  // from an effect.
  const [lastOpen, setLastOpen] = useState(open);
  if (lastOpen !== open) {
    setLastOpen(open);
    if (!open) {
      setSearch("");
      setDebounced("");
    }
  }

  const results = SearchCustomersData ?? [];
  const canCreate =
    looksLikeEmail(debounced) &&
    !results.some(
      (customer) => customer.email.toLowerCase() === debounced.toLowerCase(),
    );
  const busy = linking || CreateCustomerIsLoading;

  const handleCreate = async () => {
    if (!storeCode) return;
    const created = await dispatch(
      CreateCustomer({ storeCode, email: debounced }),
    );
    if (CreateCustomer.fulfilled.match(created) && created.payload) {
      onLink(created.payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link a Customer</DialogTitle>
          <DialogDescription>
            Search by email to attach an existing customer, or create one from
            an email you have.
          </DialogDescription>
        </DialogHeader>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="name@example.com"
          label="Search customers by email"
        />

        {/* A fixed-height region rather than one that grows with the
            results: the dialog stays the same size whether you have typed
            nothing, one match or ten, so it never jumps under the cursor
            as you type. Empty and loading states centre inside it instead
            of clinging to the top of a tall blank box. */}
        <div className="h-56 overflow-y-auto rounded-lg border border-border">
          {debounced.length < 2 ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center">
              <IconSearch className="mb-1 size-6 text-muted-foreground opacity-40" />
              <Typography variant="small" as="p">
                Search for a customer
              </Typography>
              <Typography variant="muted">
                Start typing an email address.
              </Typography>
            </div>
          ) : SearchCustomersIsLoading ? (
            <div className="flex h-full items-center justify-center">
              <LoadingState label="Searching…" />
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col p-1">
              {results.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  disabled={busy}
                  onClick={() => onLink(customer)}
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted disabled:opacity-60"
                >
                  <CustomerAvatar name={customerName(customer)} size="size-8" />
                  <div className="min-w-0">
                    <Typography variant="small" as="p" className="truncate">
                      {customerName(customer)}
                    </Typography>
                    <Typography variant="muted" className="truncate">
                      {customer.email}
                    </Typography>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center">
              <IconUserPlus className="mb-1 size-6 text-muted-foreground opacity-40" />
              <Typography variant="small" as="p">
                No customer with that email
              </Typography>
              <Typography variant="muted">
                {canCreate
                  ? "Create one now and fill in the rest from CRM later."
                  : "Enter a full email address to create one."}
              </Typography>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          {/* Only offered once the text is an address we could actually
              create, and only when it is not already in the results. */}
          <Button
            type="button"
            disabled={!canCreate || busy}
            onClick={handleCreate}
          >
            {CreateCustomerIsLoading ? (
              <Spinner className="size-4" />
            ) : (
              <IconPlus className="size-4" />
            )}
            Create and Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The button that opens the dialog, for a record with no customer yet. */
export function LinkCustomerButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" className="w-full" onClick={onClick}>
      <IconUserPlus className="size-4" />
      Link a Customer
    </Button>
  );
}
