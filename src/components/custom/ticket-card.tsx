import { IconUser } from "@tabler/icons-react";

import { formatDate } from "@/lib/helpers";
import type { TicketDetails } from "@/redux/api-slice/thread-slice";

/** Ticket card posted into a chat; mirrors the widget's (vw-ticket-*). */
export default function TicketCard({ ticket }: { ticket: TicketDetails }) {
  return (
    <div className="mt-2 flex flex-col gap-2.5 rounded-xl border border-border bg-background p-3.5">
      <div className="text-sm font-semibold text-foreground">
        Ticket #{ticket.ticket_id}
      </div>

      {(ticket.customer_email || ticket.customer_name) && (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <IconUser className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            {ticket.customer_email && (
              <div className="text-[13px] font-semibold text-foreground">
                {ticket.customer_email}
              </div>
            )}
            {ticket.customer_name && (
              <div className="text-xs text-muted-foreground">
                {ticket.customer_name}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-px bg-border" />

      {ticket.description && (
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
            Your Query
          </div>
          <div className="whitespace-pre-wrap wrap-anywhere text-[13px] leading-[1.55] text-muted-foreground">
            {ticket.description}
          </div>
        </div>
      )}

      <div className="h-px bg-border" />

      <div className="text-xs text-muted-foreground">
        Created {formatDate(ticket.created_at)}
      </div>
    </div>
  );
}
