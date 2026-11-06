"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconPlus } from "@tabler/icons-react";

import { CreateTicketDialog } from "@/components/custom/create-ticket-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateSupportTicket } from "@/redux/api-slice/support-ticket-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useCan } from "@/hooks/use-can";

/**
 * Raise a ticket with no conversation behind it.
 *
 * The other two entry points sit inside a chat; this one sits in the help
 * desk for the problem that reached the agent by phone, email or in person.
 * On success the help desk opens the new ticket — the list picks it up over
 * its socket, so nothing here touches the queue.
 *
 * `variant` is only where it is drawn: the full-width button heading the
 * left panel, the round "+" of the phone layout, or no button at all
 * ("dialog") with `open` driven from outside — for a dropdown menu row,
 * which would take the dialog down with it when the menu closes.
 */
export function CreateTicketAction({
  variant = "panel",
  className,
  open: controlledOpen,
  onOpenChange,
}: {
  variant?: "panel" | "fab" | "dialog";
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const setOpen = onOpenChange ?? setLocalOpen;
  const canCreate = useCanCreateTicket();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  if (!canCreate) return null;

  return (
    <>
      {variant === "dialog" ? null : variant === "fab" ? (
        <Button
          size="icon-lg"
          aria-label="Create ticket"
          className={cn("size-11 rounded-full shadow-md", className)}
          onClick={() => setOpen(true)}
        >
          <IconPlus className="size-5" />
        </Button>
      ) : (
        <Button
          className={cn("h-10 w-full justify-center text-sm", className)}
          onClick={() => setOpen(true)}
        >
          <IconPlus data-icon="inline-start" />
          Create ticket
        </Button>
      )}
      <CreateTicketDialog
        open={open}
        onOpenChange={setOpen}
        storeCode={storeCode}
        onSubmit={async (payload) => {
          const result = await dispatch(
            CreateSupportTicket({ storeCode, payload }),
          );
          if (!CreateSupportTicket.fulfilled.match(result)) {
            return { ok: false, payload: result.payload };
          }
          router.push(`/helpdesk?ticket=${result.payload.id}`);
          return { ok: true };
        }}
      />
    </>
  );
}

/** Whether the user may raise a ticket here: a store is open and they may write. */
export function useCanCreateTicket() {
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const canCreate = useCan("conversations", { write: true });
  return Boolean(storeCode) && canCreate;
}
