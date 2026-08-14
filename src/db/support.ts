import { getDb } from "@/lib/tenant-context";
import { scopedThreadFilter } from "@/db/access";
import { supportTicket } from "@/lib/drizzle/schema";
import { desc } from "drizzle-orm";

/**
 * Port of Django `ThreadSupportTicketsAPIView.get_queryset`:
 *   SupportTicket.objects.filter(thread_id=thread_id)  (Meta.ordering = ["-created_at"])
 *
 * Keys mirror SupportTicketSerializer's output exactly (snake_case, DRF shape;
 * write-only thread_id/store_code and the constant success_message are omitted,
 * `platform` is not in the serializer's field list.
 */
export async function list_thread_tickets(thread_id: string) {
  const db = getDb();
  const tickets = await db
    .select({
      id: supportTicket.id,
      thread: supportTicket.threadId,
      customer: supportTicket.customerId,
      ticket_id: supportTicket.id,
      subject: supportTicket.subject,
      description: supportTicket.description,
      created_at: supportTicket.createdAt,
      updated_at: supportTicket.updatedAt,
    })
    .from(supportTicket)
    .where(scopedThreadFilter(supportTicket.threadId, thread_id))
    .orderBy(desc(supportTicket.createdAt));

  return tickets;
}
