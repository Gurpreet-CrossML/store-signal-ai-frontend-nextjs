import { getDb } from "@/lib/tenant-context";
import { storeIdScope, scopedThreadFilter } from "@/db/access";
import { FEEDBACK_RATING_VALUES } from "@/lib/config";
import {
  chatThread,
  chatCustomer,
  store,
  chatHistory,
  aiInsights,
  chatbotFeedback,
  supportTicket,
  userMetadata,
  sessionResolutionVerdict,
  chatCustomerorder,
} from "@/lib/drizzle/schema";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  isNotNull,
  max,
  or,
  sql,
  SQL,
} from "drizzle-orm";
import {
  OrderData,
  OrderItemData,
  OrderShippingAddress,
} from "@/redux/api-slice/thread-slice";

/**
 * Filters accepted by the thread list endpoint, mirroring
 * ThreadListAPIView.get_queryset (analytics/views.py).
 */
export type ListThreadsFilters = {
  store_code?: string;
  from?: string; // YYYY-MM-DD or ISO 8601 datetime
  to?: string; // YYYY-MM-DD or ISO 8601 datetime
  is_active?: string;
  search?: string;
  user_type?: string;
  has_ticket?: string;
  has_feedback?: string;
  feedback_rating?: string; // very_bad | bad | neutral | good | excellent
  tags?: string[]; // matches threads tagged with ANY of the given tags
  handled_by?: string; // ai | human
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Format a Date as YYYY-MM-DD (UTC), matching Django's date() handling. */
function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateTimeFilter(
  value: string,
  edge: "start" | "end",
): Date | undefined {
  if (DATE_ONLY_RE.test(value)) {
    return new Date(
      `${value}T${edge === "start" ? "00:00:00.000Z" : "23:59:59.999Z"}`,
    );
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

type ThreadListRow = {
  id: string;
  name: string | null;
  followup_level: number;
  is_active: boolean;
  total_messages: number;
  created_at: string;
  ended_at: string | null;
  customer_id: number | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  customer_email: string | null;
};

export type ThreadListItem = {
  id: string;
  name: string | null;
  customer: { id: number | null; name: string | null; email: string | null };
  followup_level: number;
  is_active: boolean;
  total_messages: number;
  created_at: string;
  ended_at: string | null;
  tags: string[];
  last_message: string;
};

/**
 * Port of ThreadListAPIView.get_queryset + ThreadListSerializer
 * (analytics/views.py / analytics/serializers.py).
 *
 * Applies the same filters and ordering ("-created_at") as the Django view,
 * annotates total_messages (Count("messages")), and returns the rows for the
 * requested page along with the total count (pre-pagination) so the caller can
 * build the DRF paginated envelope.
 *
 * Serializer fidelity:
 *   - customer: { id | null, name: "first last".strip() | null, email | null }
 *   - tags: AiInsights.tags for the thread (first row) or []
 *   - last_message: latest role="assistant" message text, or "" when none.
 *   - followup_level / is_active / total_messages / created_at / ended_at as-is.
 */
export async function list_threads(
  filters: ListThreadsFilters,
  page: number,
  pageSize: number,
): Promise<{ count: number; results: ThreadListItem[] }> {
  const db = getDb();
  const conditions: SQL[] = [];

  const storeScope = storeIdScope(chatThread.storeId, filters.store_code);
  if (storeScope) conditions.push(storeScope);

  if (filters.is_active) {
    conditions.push(
      eq(chatThread.isActive, filters.is_active.toLowerCase() === "true"),
    );
  }

  // Date/time range on created_at, defaulting to the last 30 days (inclusive).
  const now = new Date();
  const todayUtc = new Date(`${toDateString(now)}T00:00:00Z`);
  const defaultEnd = new Date(`${toDateString(now)}T23:59:59.999Z`);

  const parsedFrom = filters.from
    ? parseDateTimeFilter(filters.from, "start")
    : undefined;
  const parsedTo = filters.to
    ? parseDateTimeFilter(filters.to, "end")
    : undefined;

  const endDate = parsedTo ?? defaultEnd;
  let startDate: Date;

  if (parsedFrom) {
    startDate = parsedFrom;
  } else if (parsedTo) {
    if (DATE_ONLY_RE.test(filters.to!)) {
      const toDate = new Date(`${filters.to}T00:00:00Z`);
      startDate = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  } else {
    startDate = new Date(todayUtc.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  conditions.push(
    sql`${chatThread.createdAt} BETWEEN ${startDate} AND ${endDate}`,
  );

  if (filters.search) {
    const search = filters.search;
    const searchConditions: SQL[] = [
      ilike(chatCustomer.email, `%${search}%`),
      ilike(chatThread.name, `%${search}%`),
      sql`EXISTS (SELECT 1 FROM ${chatHistory} WHERE ${chatHistory.threadId} = ${chatThread.id} AND ${chatHistory.message} ILIKE ${`%${search}%`})`,
      // The customer's own name, which is stored split across two columns
      // and so isn't covered by the thread name above.
      sql`concat_ws(' ', ${chatCustomer.firstName}, ${chatCustomer.lastName}) ILIKE ${`%${search}%`}`,
      // Orders hang off the customer, not the thread, so match with an
      // EXISTS rather than joining and multiplying the thread rows.
      sql`EXISTS (
        SELECT 1 FROM ${chatCustomerorder} o
        WHERE o.customer_id = ${chatThread.customerId}
          AND (o.order_number ILIKE ${`%${search}%`} OR o.order_id ILIKE ${`%${search}%`})
      )`,
    ];
    if (isValidUuid(search)) {
      searchConditions.push(eq(chatThread.id, search));
    }
    const combined = or(...searchConditions);
    if (combined) conditions.push(combined);
  }

  if (filters.user_type === "guest") {
    conditions.push(isNull(chatThread.customerId));
  } else if (filters.user_type === "logged_in") {
    conditions.push(isNotNull(chatThread.customerId));
  }

  if (filters.handled_by === "ai" || filters.handled_by === "human") {
    conditions.push(eq(chatThread.chatHandler, filters.handled_by));
  }

  // has_ticket / has_feedback are correlated EXISTS subqueries (Django uses
  // support_tickets__isnull / feedbacks__isnull with .distinct()).
  if (filters.has_ticket === "true") {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM ${supportTicket} WHERE ${supportTicket.threadId} = ${chatThread.id})`,
    );
  } else if (filters.has_ticket === "false") {
    conditions.push(
      sql`NOT EXISTS (SELECT 1 FROM ${supportTicket} WHERE ${supportTicket.threadId} = ${chatThread.id})`,
    );
  }

  // A rating narrows has_feedback to a specific rating; otherwise has_feedback
  // is the plain existence check.
  if (
    filters.feedback_rating &&
    (FEEDBACK_RATING_VALUES as readonly string[]).includes(
      filters.feedback_rating,
    )
  ) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM ${chatbotFeedback} WHERE ${chatbotFeedback.threadId} = ${chatThread.id} AND ${chatbotFeedback.rating} = ${filters.feedback_rating})`,
    );
  } else if (filters.has_feedback === "true") {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM ${chatbotFeedback} WHERE ${chatbotFeedback.threadId} = ${chatThread.id})`,
    );
  } else if (filters.has_feedback === "false") {
    conditions.push(
      sql`NOT EXISTS (SELECT 1 FROM ${chatbotFeedback} WHERE ${chatbotFeedback.threadId} = ${chatThread.id})`,
    );
  }

  // Any-match: a thread qualifies if its AiInsights.tags contains at least
  // one of the selected tags.
  if (filters.tags && filters.tags.length) {
    const tagConditions = filters.tags.map(
      (tag) => sql`${aiInsights.tags} @> ${JSON.stringify([tag])}::jsonb`,
    );
    conditions.push(
      sql`EXISTS (SELECT 1 FROM ${aiInsights} WHERE ${aiInsights.threadId} = ${chatThread.id} AND (${sql.join(tagConditions, sql` OR `)}))`,
    );
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  // Total count (pre-pagination), distinct threads.
  const countRows = await db
    .select({ value: sql<number>`count(DISTINCT ${chatThread.id})` })
    .from(chatThread)
    .leftJoin(chatCustomer, eq(chatThread.customerId, chatCustomer.id))
    .innerJoin(store, eq(chatThread.storeId, store.id))
    .where(whereClause);

  const total = Number(countRows[0]?.value ?? 0);

  if (total === 0) {
    return { count: 0, results: [] };
  }

  const offset = (page - 1) * pageSize;

  const rows: ThreadListRow[] = await db
    .select({
      id: chatThread.id,
      name: chatThread.name,
      followup_level: chatThread.followupLevel,
      is_active: chatThread.isActive,
      total_messages: count(chatHistory.id),
      created_at: chatThread.createdAt,
      ended_at: chatThread.endedAt,
      customer_id: chatCustomer.id,
      customer_first_name: chatCustomer.firstName,
      customer_last_name: chatCustomer.lastName,
      customer_email: chatCustomer.email,
    })
    .from(chatThread)
    .leftJoin(chatCustomer, eq(chatThread.customerId, chatCustomer.id))
    .innerJoin(store, eq(chatThread.storeId, store.id))
    .leftJoin(chatHistory, eq(chatHistory.threadId, chatThread.id))
    .where(whereClause)
    .groupBy(
      chatThread.id,
      chatCustomer.id,
      chatCustomer.firstName,
      chatCustomer.lastName,
      chatCustomer.email,
    )
    .orderBy(desc(chatThread.createdAt))
    .limit(pageSize)
    .offset(offset);

  const threadIds = rows.map((r) => r.id);

  // tags: AiInsights.tags per thread (OneToOne -> at most one row).
  const tagRows = threadIds.length
    ? await db
        .select({ threadId: aiInsights.threadId, tags: aiInsights.tags })
        .from(aiInsights)
        .where(
          sql`${aiInsights.threadId} IN (${sql.join(
            threadIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        )
    : [];
  const tagsByThread = new Map<string, string[]>();
  for (const t of tagRows) {
    tagsByThread.set(t.threadId, (t.tags as string[]) ?? []);
  }

  // last_message: latest assistant message text per thread.
  const lastMessageByThread = new Map<string, string>();
  if (threadIds.length) {
    const lastRows = await db
      .select({
        threadId: chatHistory.threadId,
        message: chatHistory.message,
        createdAt: chatHistory.createdAt,
        id: chatHistory.id,
      })
      .from(chatHistory)
      .where(
        and(
          eq(chatHistory.role, "assistant"),
          sql`${chatHistory.threadId} IN (${sql.join(
            threadIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        ),
      )
      .orderBy(desc(chatHistory.createdAt), desc(chatHistory.id));
    for (const m of lastRows) {
      if (!lastMessageByThread.has(m.threadId)) {
        lastMessageByThread.set(m.threadId, m.message || "");
      }
    }
  }

  const results: ThreadListItem[] = rows.map((row) => {
    const hasCustomer =
      row.customer_email !== null || row.customer_first_name !== null;
    const customerName = hasCustomer
      ? `${row.customer_first_name ?? ""} ${row.customer_last_name ?? ""}`.trim()
      : null;
    return {
      id: row.id,
      name: row.name,
      customer: {
        // Null for a guest — the UI keys its tickets lookup off this.
        id: row.customer_id ?? null,
        name: hasCustomer ? customerName : null,
        email: row.customer_email,
      },
      followup_level: row.followup_level,
      is_active: row.is_active,
      total_messages: Number(row.total_messages),
      created_at: row.created_at,
      ended_at: row.ended_at,
      tags: tagsByThread.get(row.id) ?? [],
      last_message: lastMessageByThread.get(row.id) ?? "",
    };
  });

  return { count: total, results };
}

/**
 * Distinct AiInsights.tags values across a store's threads — powers the
 * Threads page's tags filter option list.
 */
export async function list_thread_tags(storeCode?: string): Promise<string[]> {
  const db = getDb();
  const conditions: SQL[] = [];

  const storeScope = storeIdScope(chatThread.storeId, storeCode);
  if (storeScope) conditions.push(storeScope);

  const rows = await db
    .selectDistinct({
      tag: sql<string>`jsonb_array_elements_text(${aiInsights.tags})`,
    })
    .from(aiInsights)
    .innerJoin(chatThread, eq(aiInsights.threadId, chatThread.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`1`);

  return rows.map((row) => row.tag).filter(Boolean);
}

type ThreadMessage = {
  id: string | number;
  role: string;
  message: string;
  json_content: unknown;
  image_url: unknown;
  created_at: string;
};

export type ThreadDetail =
  | {
      id: string;
      store: number;
      name: string | null;
      is_active: boolean;
      followup_level: number;
      total_messages: number;
      last_message_at: string | null;
      customer_name: string | null;
      customer_email: string | null;
      /** Identity only — enough to link the thread to its Catalog record. */
      customer: { id: number } | null;
      verdict: {
        verdict: string;
        reason: string | null;
        confidence: number;
        total_queries: number;
        resolved_count: number;
        unresolved_count: number;
        query_summaries: unknown;
        created_at: string;
      } | null;
      created_at: string;
      ended_at: string | null;
      messages: ThreadMessage[];
    }
  | Record<string, never>;

/**
 * Port of ThreadChatsAPIView.get_queryset + ThreadDetailSerializer.
 *
 * Field order mirrors ThreadDetailSerializer.Meta.fields:
 *   id, store, name, is_active, followup_level, total_messages,
 *   last_message_at, customer_name, customer_email, verdict,
 *   created_at, ended_at, messages.
 *
 * `limit` (optional query param): when provided, messages are the latest
 * `limit` ordered by -created_at; otherwise all messages ordered by created_at.
 *
 * Django returns the serializer's representation of a None instance when the
 * thread is missing, which yields an object with all-null fields. We replicate
 * that with an empty object since the original behavior depends on DRF
 * ModelSerializer null handling; see FIDELITY-GAP note in the route.
 */
export async function get_thread_details(
  thread_id: string,
  limit: number | null,
): Promise<ThreadDetail> {
  const db = getDb();
  const threadRows = await db
    .select({
      id: chatThread.id,
      storeId: chatThread.storeId,
      name: chatThread.name,
      is_active: chatThread.isActive,
      followup_level: chatThread.followupLevel,
      created_at: chatThread.createdAt,
      ended_at: chatThread.endedAt,
      customer_id: chatCustomer.id,
      customer_first_name: chatCustomer.firstName,
      customer_last_name: chatCustomer.lastName,
      customer_email: chatCustomer.email,
    })
    .from(chatThread)
    .leftJoin(chatCustomer, eq(chatThread.customerId, chatCustomer.id))
    .where(scopedThreadFilter(chatThread.id, thread_id))
    .limit(1);

  if (threadRows.length === 0) {
    return {};
  }

  const t = threadRows[0];

  const aggRows = await db
    .select({
      total_messages: count(chatHistory.id),
      last_message_at: max(chatHistory.createdAt),
    })
    .from(chatHistory)
    .where(eq(chatHistory.threadId, thread_id));

  const total_messages = Number(aggRows[0]?.total_messages ?? 0);
  const last_message_at = aggRows[0]?.last_message_at ?? null;

  const messageRows = await db
    .select({
      id: chatHistory.id,
      role: chatHistory.role,
      message: chatHistory.message,
      json_content: chatHistory.jsonContent,
      image_url: chatHistory.imageUrl,
      created_at: chatHistory.createdAt,
      messaged_by: chatHistory.messagedById,
    })
    .from(chatHistory)
    .where(eq(chatHistory.threadId, thread_id))
    .orderBy(
      limit != null ? desc(chatHistory.createdAt) : asc(chatHistory.createdAt),
    )
    .limit(limit != null ? limit : Number.MAX_SAFE_INTEGER);

  const messages: ThreadMessage[] = messageRows.map((m) => ({
    id: m.id,
    role: m.role,
    message: m.message,
    json_content: m.json_content,
    image_url: m.image_url,
    created_at: m.created_at,
    messaged_by: m.messaged_by,
  }));

  const verdictRows = await db
    .select({
      verdict: sessionResolutionVerdict.verdict,
      reason: sessionResolutionVerdict.reason,
      confidence: sessionResolutionVerdict.confidence,
      total_queries: sessionResolutionVerdict.totalQueries,
      resolved_count: sessionResolutionVerdict.resolvedCount,
      unresolved_count: sessionResolutionVerdict.unresolvedCount,
      query_summaries: sessionResolutionVerdict.querySummaries,
      created_at: sessionResolutionVerdict.createdAt,
    })
    .from(sessionResolutionVerdict)
    .where(eq(sessionResolutionVerdict.threadId, thread_id))
    .limit(1);

  const verdict = verdictRows.length
    ? {
        verdict: verdictRows[0].verdict,
        reason: verdictRows[0].reason,
        confidence: verdictRows[0].confidence,
        total_queries: verdictRows[0].total_queries,
        resolved_count: verdictRows[0].resolved_count,
        unresolved_count: verdictRows[0].unresolved_count,
        query_summaries: verdictRows[0].query_summaries,
        created_at: verdictRows[0].created_at,
      }
    : null;

  const hasCustomer =
    t.customer_email !== null || t.customer_first_name !== null;
  const customer_name = hasCustomer
    ? `${t.customer_first_name ?? ""} ${t.customer_last_name ?? ""}`.trim()
    : null;

  return {
    id: t.id,
    store: Number(t.storeId),
    name: t.name,
    is_active: t.is_active,
    followup_level: t.followup_level,
    total_messages,
    last_message_at,
    customer_name,
    customer_email: t.customer_email,
    // The id was always selected by the join but never returned, so the
    // client's `customer?.id` reads were silently undefined.
    customer: t.customer_id != null ? { id: Number(t.customer_id) } : null,
    verdict,
    created_at: t.created_at,
    ended_at: t.ended_at,
    messages,
  };
}

export type AiInsightsData = {
  underperforming_cases: unknown;
  overperforming_cases: unknown;
  resolution_success_rate: string;
  reason_for_score: string;
  tags: unknown;
  ai_insight_required: boolean;
  next_actionable_items: unknown;
};

/**
 * Port of AiInsightsAPIView.get_queryset + AiInsightsSerializer.
 * Returns the first AiInsights row for the thread, or null when none exists.
 * resolution_success_rate is a DecimalField -> serialized as a string by DRF.
 */
export async function get_ai_insights(
  thread_id: string,
): Promise<AiInsightsData | null> {
  const db = getDb();
  const rows = await db
    .select({
      underperforming_cases: aiInsights.underperformingCases,
      overperforming_cases: aiInsights.overperformingCases,
      resolution_success_rate: aiInsights.resolutionSuccessRate,
      reason_for_score: aiInsights.reasonForScore,
      tags: aiInsights.tags,
      ai_insight_required: aiInsights.aiInsightRequired,
      next_actionable_items: aiInsights.nextActionableItems,
    })
    .from(aiInsights)
    .where(scopedThreadFilter(aiInsights.threadId, thread_id))
    .limit(1);

  if (rows.length === 0) return null;
  return rows[0];
}

export type CartData = {
  thread_id: string;
  initial_cart_data: unknown;
  updated_cart_data: unknown;
};

/**
 * Port of CartDataAPIView.get_object + CartDataSerializer (read).
 * Reads the first UserMetadata row for the thread. The serializer exposes
 * thread_id, initial_cart_data, updated_cart_data on read.
 * Returns null when no UserMetadata exists (-> 404 in the route).
 */
export async function get_cart_data(
  thread_id: string,
): Promise<CartData | null> {
  const db = getDb();
  const rows = await db
    .select({
      thread_id: userMetadata.threadId,
      initial_cart_data: userMetadata.initialCartData,
      updated_cart_data: userMetadata.updatedCartData,
    })
    .from(userMetadata)
    .where(scopedThreadFilter(userMetadata.threadId, thread_id))
    .limit(1);

  if (rows.length === 0) return null;
  return rows[0];
}

/**
 * Port of ConversationSummaryByThreadSerializer.
 * Returns the latest ChatbotFeedback.conversation_summary for the thread,
 * or the constant fallback string. Mirrors the Thread-existence check.
 */
export async function get_conversation_summary(
  thread_id: string,
): Promise<{ conversation_summary: string }> {
  const db = getDb();
  const FALLBACK = "No summary available for this conversation.";

  const threadRows = await db
    .select({ id: chatThread.id })
    .from(chatThread)
    .where(scopedThreadFilter(chatThread.id, thread_id))
    .limit(1);

  if (threadRows.length === 0) {
    return { conversation_summary: FALLBACK };
  }

  const rows = await db
    .select({ conversation_summary: aiInsights.conversationSummary })
    .from(aiInsights)
    .where(scopedThreadFilter(aiInsights.threadId, thread_id))
    .orderBy(desc(aiInsights.createdAt))
    .limit(1);

  const summary =
    rows.length && rows[0].conversation_summary
      ? rows[0].conversation_summary
      : FALLBACK;

  return { conversation_summary: summary };
}

export type FeedbackEntry = {
  id: number;
  rating: string;
  feedback_message: string | null;
  created_at: string;
};

/**
 * Port of FeedbackSequenceSerializer.
 *
 * The Django serializer originally exposed ChatbotFeedback.feedback_sequence,
 * but that column was DROPPED from chatbot_feedback in chat migration 0004
 * (RemoveField feedback_sequence). A thread has a single feedback entry, so we
 * return that entry's details for the UI (rating, message, timestamp), or null
 * when no feedback was submitted.
 */
export async function get_feedback_sequence(
  thread_id: string,
): Promise<{ feedback: FeedbackEntry | null }> {
  const db = getDb();
  const rows = await db
    .select({
      id: chatbotFeedback.id,
      rating: chatbotFeedback.rating,
      feedback_message: chatbotFeedback.feedbackMessage,
      created_at: chatbotFeedback.createdAt,
    })
    .from(chatbotFeedback)
    .where(scopedThreadFilter(chatbotFeedback.threadId, thread_id))
    .orderBy(desc(chatbotFeedback.createdAt))
    .limit(1);

  return { feedback: rows[0] ?? null };
}

/**
 * Port of TagsSerializer.
 * Returns AiInsights.tags for the thread (first row) or [].
 */
export async function get_thread_tags(
  thread_id: string,
): Promise<{ tags: string[] }> {
  const db = getDb();
  const rows = await db
    .select({ tags: aiInsights.tags })
    .from(aiInsights)
    .where(scopedThreadFilter(aiInsights.threadId, thread_id))
    .limit(1);

  const tags =
    rows.length && rows[0].tags != null ? (rows[0].tags as string[]) : [];
  return { tags };
}

export type UserMetadataData = {
  id: number;
  customer_name: string | null;
  geo_location: string | null;
  ip_address: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
};

/**
 * Port of UserMetadataRetrieveAPIView.get_queryset + UserMetadataSerializer (read).
 * Returns the latest UserMetadata row (order_by -created_at) for the thread.
 * thread_id is write_only on the serializer, so it is NOT in the read output;
 * read fields are: id, customer_name, geo_location, ip_address, device_type,
 * browser, os.
 * Returns null when none -> route serializes a None instance (empty object).
 */
export async function get_user_metadata(
  thread_id: string,
): Promise<UserMetadataData | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: userMetadata.id,
      customer_name: userMetadata.customerName,
      geo_location: userMetadata.geoLocation,
      ip_address: userMetadata.ipAddress,
      device_type: userMetadata.deviceType,
      browser: userMetadata.browser,
      os: userMetadata.os,
    })
    .from(userMetadata)
    .where(scopedThreadFilter(userMetadata.threadId, thread_id))
    .orderBy(desc(userMetadata.createdAt))
    .limit(1);

  if (rows.length === 0) return null;
  return { ...rows[0], id: Number(rows[0].id) };
}

export async function get_order_data(thread_id: string): Promise<OrderData[]> {
  const db = getDb();

  const thread = await db
    .select({ customerId: chatThread.customerId })
    .from(chatThread)
    .where(eq(chatThread.id, thread_id))
    .then((rows) => rows[0]);

  if (!thread?.customerId) {
    return [];
  }

  const orderRows = await db
    .select({
      id: chatCustomerorder.id,
      order_id: chatCustomerorder.orderId,
      order_number: chatCustomerorder.orderNumber,
      created_at: chatCustomerorder.createdAt,
      total_price: chatCustomerorder.totalPrice,
      financial_status: chatCustomerorder.financialStatus,
      fulfillment_status: chatCustomerorder.fulfillmentStatus,
      gateway: chatCustomerorder.gateway,
      shipping_address: chatCustomerorder.shippingAddress,
      currency: chatCustomerorder.currency,
      items: chatCustomerorder.items,
      subtotal_price: chatCustomerorder.subtotalPrice,
      total_tax: chatCustomerorder.totalTax,
      total_shipping: chatCustomerorder.totalShipping,
      total_discounts: chatCustomerorder.totalDiscounts,
      shipping_method: chatCustomerorder.shippingMethod,
    })
    .from(chatCustomerorder)
    .where(eq(chatCustomerorder.customerId, thread.customerId))
    .orderBy(desc(chatCustomerorder.createdAt));

  if (orderRows.length === 0) {
    return [];
  }

  return orderRows.map((row) => ({
    ...row,
    shipping_address: row.shipping_address as OrderShippingAddress,
    items: row.items as OrderItemData[],
  }));
}
