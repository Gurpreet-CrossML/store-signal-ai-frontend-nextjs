import { db } from "@/lib/db";
import { supportTicket, store, storeCredentials } from "@/lib/drizzle/schema";
import { and, desc, eq, sql, SQL } from "drizzle-orm";

/**
 * Port of Django `ThreadSupportTicketsAPIView.get_queryset`:
 *   SupportTicket.objects.filter(thread_id=thread_id)  (Meta.ordering = ["-created_at"])
 *
 * Keys mirror SupportTicketSerializer's output exactly (snake_case, DRF shape;
 * write-only thread_id/store_code and the constant success_message are omitted,
 * `platform`/`status` are not in the serializer's field list).
 */
export async function list_thread_tickets(thread_id: string) {
  const tickets = await db
    .select({
      id: supportTicket.id,
      thread: supportTicket.threadId,
      customer: supportTicket.customerId,
      ticket_id: supportTicket.ticketId,
      subject: supportTicket.subject,
      description: supportTicket.description,
      requester_id: supportTicket.requesterId,
      email_config_id: supportTicket.emailConfigId,
      platform_created_at: supportTicket.platformCreatedAt,
      platform_updated_at: supportTicket.platformUpdatedAt,
      created_at: supportTicket.createdAt,
      updated_at: supportTicket.updatedAt,
    })
    .from(supportTicket)
    .where(eq(supportTicket.threadId, thread_id))
    .orderBy(desc(supportTicket.createdAt));

  return tickets;
}

type TicketListFilters = {
  store_code?: string;
  search?: string;
  status?: string;
  platform?: string;
  priority?: string;
};

export type TicketListItem = {
  id: number;
  ticket_id: number;
  platform: string;
  status: string;
  priority: string;
  subject: string;
  description: string;
  thread: string;
  created_at: string;
  updated_at: string;
  agent_email: string | null;
  agent_name: string | null;
  ticket_url: string | null;
  customer: number | null;
  store: number;
};

export async function list_tickets(
  filters: TicketListFilters,
  page: number,
  pageSize: number,
): Promise<{ count: number; results: TicketListItem[] }> {
  const conditions: SQL[] = [];

  if (filters.store_code) {
    conditions.push(eq(store.code, filters.store_code));
  }

  if (filters.status) {
    conditions.push(
      sql`lower(${supportTicket.status}) = ${filters.status.toLowerCase()}`,
    );
  }

  if (filters.platform) {
    conditions.push(
      sql`lower(${supportTicket.platform}) = ${filters.platform.toLowerCase()}`,
    );
  }

  if (filters.priority) {
    conditions.push(
      sql`lower(${supportTicket.priority}) = ${filters.priority.toLowerCase()}`,
    );
  }

  if (filters.search) {
    const value = `%${filters.search}%`;
    const searchConditions = sql`(
      ${supportTicket.subject} ILIKE ${value}
      OR CAST(${supportTicket.ticketId} AS text) ILIKE ${value}
      OR CAST(${supportTicket.threadId} AS text) ILIKE ${value}
    )`;
    conditions.push(searchConditions);
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const countRows = await db
    .select({ value: sql<number>`count(${supportTicket.id})` })
    .from(supportTicket)
    .leftJoin(store, eq(supportTicket.storeId, store.id))
    .where(whereClause);

  const total = Number(countRows[0]?.value ?? 0);

  if (total === 0) {
    return { count: 0, results: [] };
  }

  const offset = (page - 1) * pageSize;

  const rows: TicketListItem[] = await db
    .select({
      id: supportTicket.id,
      ticket_id: supportTicket.ticketId,
      platform: supportTicket.platform,
      status: supportTicket.status,
      priority: supportTicket.priority,
      subject: supportTicket.subject,
      description: supportTicket.description,
      thread: supportTicket.threadId,
      created_at: supportTicket.createdAt,
      updated_at: supportTicket.updatedAt,
      agent_email: supportTicket.agentEmail,
      agent_name: supportTicket.agentName,
      ticket_url: supportTicket.ticketUrl,
      customer: supportTicket.customerId,
      store: supportTicket.storeId,
    })
    .from(supportTicket)
    .leftJoin(store, eq(supportTicket.storeId, store.id))
    .where(whereClause)
    .orderBy(desc(supportTicket.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { count: total, results: rows };
}

export async function get_support_ticket(ticketId: number) {
  const ticket = await db
    .select({
      id: supportTicket.id,
      ticket_id: supportTicket.ticketId,
      platform: supportTicket.platform,
      status: supportTicket.status,
      priority: supportTicket.priority,
      subject: supportTicket.subject,
      description: supportTicket.description,
      thread: supportTicket.threadId,
      created_at: supportTicket.createdAt,
      updated_at: supportTicket.updatedAt,
      agent_email: supportTicket.agentEmail,
      agent_name: supportTicket.agentName,
      ticket_url: supportTicket.ticketUrl,
      customer: supportTicket.customerId,
      store: supportTicket.storeId,
      support_ticket_api_url: storeCredentials.supportTicketApiUrl,
      support_ticket_api_key: storeCredentials.supportTicketApiKey,
      support_ticket_username: storeCredentials.supportTicketUsername,
      support_ticket_platform: storeCredentials.supportTicketPlatform,
    })
    .from(supportTicket)
    .leftJoin(storeCredentials, eq(supportTicket.storeId, storeCredentials.storeId))
    .where(eq(supportTicket.ticketId, ticketId));

  return ticket[0] ?? null;
}
