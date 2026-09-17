"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconPlus } from "@tabler/icons-react";

import { CreateTicketDialog } from "@/components/custom/create-ticket-dialog";
import { Button } from "@/components/ui/button";
import { CreateSupportTicket } from "@/redux/api-slice/support-ticket-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/**
 * Raise a ticket with no conversation behind it.
 *
 * The other two entry points sit inside a chat; this one sits in the help
 * desk sidebar for the problem that reached the agent by phone, email or
 * in person. On success the help desk opens the new ticket — the list
 * picks it up over its socket, so nothing here touches the queue.
 */
export function CreateTicketAction() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  if (!storeCode) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <IconPlus data-icon="inline-start" />
        Create Ticket
      </Button>
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
