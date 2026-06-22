import {
  getDb,
  runSequentially,
  currentCompany,
  resolveStoreScope,
} from "@/lib/tenant-context";
import { storeIdScope, threadIdScope } from "@/db/access";
import { getCached, setCached } from "@/lib/dashboard-cache";
import {
  chatThread,
  chatHistory,
  chatbotFeedback,
  chatBotevent,
  sentimentAnalysis,
  supportTicket,
} from "@/lib/drizzle/schema";
import {
  and,
  eq,
  gt,
  gte,
  lte,
  inArray,
  notInArray,
  isNotNull,
  sql,
} from "drizzle-orm";

/**
 * Port of the Django analytics "dashboard" serializers (analytics/serializers.py)
 * to Drizzle. Each function mirrors one serializer's `to_representation`.
 *
 * IMPORTANT — timezone fidelity:
 * Django settings: TIME_ZONE = "Asia/Kolkata", USE_TZ = True. So Django's
 *   created_at__date__range=[start, end]
 * compares the *local (IST)* calendar date of created_at against the date
 * literals, and `now().date()` is "today" in IST. We replicate that with
 *   (created_at AT TIME ZONE 'Asia/Kolkata')::date  BETWEEN start AND end
 * and compute default dates from IST "now".  TruncHour / ExtractHour /
 * created_at__hour also use the current TZ (Asia/Kolkata) in Django.
 */
const APP_TZ = "Asia/Kolkata";
// Inlined SQL-literal form of APP_TZ. A *bound param* for the timezone makes
// Postgres treat the same `AT TIME ZONE` expression in SELECT vs GROUP BY/ORDER
// BY as different expressions (different $N placeholders) → error 42803
// ("must appear in the GROUP BY clause"). Inlining as a literal keeps the
// expressions byte-identical so the planner recognises them as the same.
const APP_TZ_SQL = sql.raw(`'${APP_TZ}'`);

// ---------------------------------------------------------------------------
// Date helpers — replicate Django's _parse_query_date / now().date() in IST.
// ---------------------------------------------------------------------------

/** Today's date (YYYY-MM-DD) in Asia/Kolkata, matching Django now().date(). */
function istToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/** Add (or subtract) whole days to a YYYY-MM-DD date string (UTC-noon safe). */
function addDays(dateStr: string, days: number): string {
  const dt = new Date(`${dateStr}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string): number {
  const a = new Date(`${start}T00:00:00Z`).getTime();
  const b = new Date(`${end}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86400000);
}

/**
 * Django _parse_query_date: returns the provided YYYY-MM-DD or the default.
 * (parse_date returns None for invalid; Django then raises. We accept valid
 * ISO dates and fall back to default otherwise to stay non-throwing.)
 */
function parseQueryDate(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

/** SQL predicate: (created_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN start AND end. */
function localDateRange(
  column: ReturnType<typeof sql>,
  start: string,
  end: string,
) {
  return sql`(${column} AT TIME ZONE ${APP_TZ_SQL})::date BETWEEN ${start}::date AND ${end}::date`;
}

/** Python round() — banker's rounding (round half to even), to `digits` places. */
function pyRound(value: number, digits = 0): number {
  const factor = Math.pow(10, digits);
  const x = value * factor;
  const floor = Math.floor(x);
  const diff = x - floor;
  let rounded: number;
  if (diff > 0.5) rounded = floor + 1;
  else if (diff < 0.5) rounded = floor;
  else rounded = floor % 2 === 0 ? floor : floor + 1;
  return rounded / factor;
}

const round2 = (v: number) => pyRound(v, 2);

// ===========================================================================
// 1. ConversionAnalyticsSerializer  →  /analytics/conversion/
// ===========================================================================

export async function get_conversion_analytics(params: {
  store_code?: string;
  from?: string;
  to?: string;
}) {
  const db = getDb();
  const endDate = parseQueryDate(params.to, istToday());
  const startDate = parseQueryDate(params.from, addDays(endDate, -30));

  const threadFilters = [
    localDateRange(sql`${chatThread.createdAt}`, startDate, endDate),
  ];
  const storeScope = storeIdScope(chatThread.storeId, params.store_code);
  if (storeScope) threadFilters.push(storeScope);
  const threadWhere = and(...threadFilters)!;

  // total_threads
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(chatThread)
    .where(threadWhere);
  const totalThreads = Number(total);

  // Distinct threads that have a given event type, restricted to in-range threads
  // and (for cart/checkout) to threads from the prior funnel stage.
  const distinctThreadsWith = async (
    eventType: string,
    restrictTo?: string[],
  ) => {
    const conds = [
      eq(chatBotevent.eventType, eventType),
      sql`${chatBotevent.threadId} IN (SELECT id FROM chat_thread WHERE ${threadWhere})`,
    ];
    if (restrictTo) {
      if (restrictTo.length === 0) return [];
      conds.push(inArray(chatBotevent.threadId, restrictTo));
    }
    const rows = await db
      .selectDistinct({ threadId: chatBotevent.threadId })
      .from(chatBotevent)
      .where(and(...conds));
    return rows.map((r) => r.threadId);
  };

  const viewedIds = await distinctThreadsWith("view_product");
  const cartIds = await distinctThreadsWith("add_to_cart", viewedIds);
  const checkoutIds = await distinctThreadsWith("checkout_link", cartIds);

  const viewedCount = viewedIds.length;
  const cartCount = cartIds.length;
  const checkoutCount = checkoutIds.length;

  const metric = (count: number) => ({
    count,
    percentage: totalThreads ? round2((count / totalThreads) * 100) : 0,
  });

  const funnel = {
    viewed_products: metric(viewedCount),
    added_to_cart: metric(cartCount),
    checkout_reached: metric(checkoutCount),
  };

  // ---------- CATEGORY DISTRIBUTION ----------
  // BotEvent view_product, category not null, distinct thread count per category,
  // ordered by count desc. Top 4 + Others. Percentage is over viewedCount.
  const catRows = await db
    .select({
      category: chatBotevent.category,
      threadCount: sql<number>`count(distinct ${chatBotevent.threadId})::int`,
    })
    .from(chatBotevent)
    .where(
      and(
        eq(chatBotevent.eventType, "view_product"),
        isNotNull(chatBotevent.category),
        sql`${chatBotevent.threadId} IN (SELECT id FROM chat_thread WHERE ${threadWhere})`,
      ),
    )
    .groupBy(chatBotevent.category)
    .orderBy(sql`count(distinct ${chatBotevent.threadId}) desc`);

  const topFour = catRows.slice(0, 4);
  const othersCount = catRows
    .slice(4)
    .reduce((s, r) => s + Number(r.threadCount), 0);

  const categoryDistribution: Array<{
    category: string;
    threads: number;
    percentage: number;
  }> = topFour.map((item) => ({
    category: item.category as string,
    threads: Number(item.threadCount),
    percentage: viewedCount
      ? round2((Number(item.threadCount) / viewedCount) * 100)
      : 0,
  }));

  if (othersCount) {
    categoryDistribution.push({
      category: "Others",
      threads: othersCount,
      percentage: viewedCount ? round2((othersCount / viewedCount) * 100) : 0,
    });
  }

  // ---------- TOP PRODUCTS ADDED TO CART ----------
  const prodRows = await db
    .select({
      productId: chatBotevent.productId,
      productName: chatBotevent.productName,
      threadCount: sql<number>`count(distinct ${chatBotevent.threadId})::int`,
    })
    .from(chatBotevent)
    .where(
      and(
        eq(chatBotevent.eventType, "add_to_cart"),
        isNotNull(chatBotevent.productName),
        sql`${chatBotevent.threadId} IN (SELECT id FROM chat_thread WHERE ${threadWhere})`,
      ),
    )
    .groupBy(chatBotevent.productId, chatBotevent.productName)
    .orderBy(sql`count(distinct ${chatBotevent.threadId}) desc`)
    .limit(5);

  const topProducts = prodRows.map((item) => ({
    product_id: item.productId,
    product_name: item.productName,
    threads: Number(item.threadCount),
    percentage: cartCount
      ? round2((Number(item.threadCount) / cartCount) * 100)
      : 0,
  }));

  return {
    total_threads: totalThreads,
    funnel,
    category_distribution: categoryDistribution,
    top_products_added_to_cart: topProducts,
  };
}

// ===========================================================================
// 2. FeedbackInsightsSerializer  →  /analytics/feedback-insights/
// ===========================================================================

export async function get_feedback_insights(params: {
  store_code?: string;
  from?: string;
  to?: string;
}) {
  const db = getDb();
  const endDate = parseQueryDate(params.to, istToday());
  const startDate = parseQueryDate(params.from, addDays(endDate, -30));

  const threadFilters = [
    localDateRange(sql`${chatThread.createdAt}`, startDate, endDate),
  ];
  const storeScope = storeIdScope(chatThread.storeId, params.store_code);
  if (storeScope) threadFilters.push(storeScope);
  const threadWhere = and(...threadFilters)!;
  const threadSubquery = sql`(SELECT id FROM chat_thread WHERE ${threadWhere})`;

  const fbWhere = sql`${chatbotFeedback.threadId} IN ${threadSubquery}`;

  // All aggregates here are independent of one another, so run them
  // concurrently (one round-trip instead of ~8 sequential ones). The 3 rating
  // counts collapse into a single GROUP BY, and the per-thread support-ticket
  // lookup (previously an N+1 loop) becomes one set-membership query.
  const [
    totalRows,
    totalFbRows,
    ratingRows,
    fcrRows,
    ahtRows,
    analyses,
    ticketThreadRows,
  ] = await runSequentially([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(chatThread)
      .where(threadWhere),
    db
      .select({ totalFb: sql<number>`count(*)::int` })
      .from(chatbotFeedback)
      .where(fbWhere),
    db
      .select({ rating: chatbotFeedback.rating, c: sql<number>`count(*)::int` })
      .from(chatbotFeedback)
      .where(fbWhere)
      .groupBy(chatbotFeedback.rating),
    db
      .select({ fcr: sql<number>`count(*)::int` })
      .from(sentimentAnalysis)
      .where(
        and(
          sql`${sentimentAnalysis.threadId} IN ${threadSubquery}`,
          gt(sentimentAnalysis.totalQueries, 0),
          sql`${sentimentAnalysis.totalQueries} = ${sentimentAnalysis.resolvedQueries}`,
        ),
      ),
    db
      .select({
        seconds: sql<number>`EXTRACT(EPOCH FROM (MAX(${chatHistory.createdAt}) - MIN(${chatHistory.createdAt})))`,
      })
      .from(chatHistory)
      .where(sql`${chatHistory.threadId} IN ${threadSubquery}`)
      .groupBy(chatHistory.threadId),
    db
      .select({
        threadId: sentimentAnalysis.threadId,
        totalQueries: sentimentAnalysis.totalQueries,
        unresolvedQueries: sentimentAnalysis.unresolvedQueries,
      })
      .from(sentimentAnalysis)
      .where(sql`${sentimentAnalysis.threadId} IN ${threadSubquery}`),
    db
      .selectDistinct({ threadId: supportTicket.threadId })
      .from(supportTicket)
      .where(sql`${supportTicket.threadId} IN ${threadSubquery}`),
  ]);

  const totalThreads = Number(totalRows[0].total);
  const totalFeedbacks = Number(totalFbRows[0].totalFb);

  const ratingMap: Record<string, number> = {};
  for (const r of ratingRows) ratingMap[r.rating] = Number(r.c);
  const positiveCount = ratingMap["excellent"] ?? 0;
  const neutralCount = ratingMap["good"] ?? 0;
  const negativeCount = ratingMap["bad"] ?? 0;

  const percent = (part: number, whole: number) =>
    whole > 0 ? round2((part / whole) * 100) : 0.0;

  const feedbackRate = {
    value: totalFeedbacks,
    percentage: percent(totalFeedbacks, totalThreads),
  };
  const positiveFeedback = {
    value: positiveCount,
    percentage: percent(positiveCount, totalFeedbacks),
  };
  const neutralFeedback = {
    value: neutralCount,
    percentage: percent(neutralCount, totalFeedbacks),
  };
  const negativeFeedback = {
    value: negativeCount,
    percentage: percent(negativeCount, totalFeedbacks),
  };
  const feedbackDistribution = {
    positive: positiveFeedback,
    neutral: neutralFeedback,
    negative: negativeFeedback,
  };

  // CSAT
  const RATING_WEIGHTS = { bad: 1, good: 3, excellent: 5 };
  const totalRatingScore =
    negativeCount * RATING_WEIGHTS.bad +
    neutralCount * RATING_WEIGHTS.good +
    positiveCount * RATING_WEIGHTS.excellent;
  const avgRating =
    totalFeedbacks > 0 ? round2(totalRatingScore / totalFeedbacks) : 0.0;
  const csatValue = positiveCount + neutralCount;
  const csatScore = {
    value: csatValue,
    percentage: percent(csatValue, totalFeedbacks),
    avg_rating: avgRating,
  };

  // NPS
  const npsScore =
    totalFeedbacks > 0
      ? round2(((positiveCount - negativeCount) / totalFeedbacks) * 100)
      : 0.0;
  const nps = {
    score: Math.trunc(npsScore),
    promoters: positiveCount,
    passives: neutralCount,
    detractors: negativeCount,
  };

  // First Contact Resolution: threads whose SentimentAnalysis total_queries > 0
  // and total_queries == resolved_queries.
  const fcrThreads = Number(fcrRows[0].fcr);
  const firstContactResolution = {
    resolved_threads: fcrThreads,
    percentage: percent(fcrThreads, totalThreads),
  };

  // Average Handle Time: per-thread (max(created_at) - min(created_at)) in seconds,
  // averaged over the number of threads that have messages, converted to minutes.
  // Django groups ChatHistory by thread for threads in range. len(durations) is the
  // number of such groups (threads with >=1 message).
  const durationsLen = ahtRows.length;
  const totalSeconds = ahtRows.reduce((s, r) => s + Number(r.seconds ?? 0), 0);
  const avgHandleTimeValue = durationsLen
    ? round2(totalSeconds / durationsLen / 60)
    : 0.0;
  const avgHandleTime = { value: avgHandleTimeValue, unit: "minutes" };

  // Customer Effort Score: per SentimentAnalysis row for threads in range.
  const normalizeEffort = (effort: number) => {
    if (effort <= 1) return 1;
    if (effort <= 3) return 2;
    if (effort <= 5) return 3;
    if (effort <= 8) return 4;
    return 5;
  };

  // Threads (in range) that have >= 1 support ticket — single query, replacing
  // the previous per-thread count(*) (effort += 3 when the thread has a ticket).
  const ticketThreadSet = new Set(ticketThreadRows.map((r) => r.threadId));
  const cesValues = analyses.map((a) => {
    let effort = Number(a.totalQueries) + Number(a.unresolvedQueries) * 2;
    if (ticketThreadSet.has(a.threadId)) effort += 3;
    return normalizeEffort(effort);
  });
  const avgCes = cesValues.length
    ? round2(cesValues.reduce((s, v) => s + v, 0) / cesValues.length)
    : 0.0;
  const customerEffortScore = {
    score: avgCes,
    scale: "1 (very easy) to 5 (very hard)",
    logic: "Based on number of queries, unresolved queries & escalations",
  };

  // Performance overview
  const responseTimeScore = (minutes: number) => {
    if (minutes <= 1) return 100;
    if (minutes >= 10) return 0;
    return round2(100 - ((minutes - 1) / 9) * 100);
  };
  const effortScoreFromCes = (ces: number) => {
    if (ces <= 1) return 100;
    if (ces >= 5) return 0;
    return round2(((5 - ces) / 4) * 100);
  };

  const responseTime = responseTimeScore(avgHandleTime.value);
  const resolutionRate = firstContactResolution.percentage;
  const firstContact = firstContactResolution.percentage;
  const satisfaction = csatScore.percentage;
  const effortScore = effortScoreFromCes(customerEffortScore.score);

  const performanceOverview = [
    { metric: "Response Time", value: Math.trunc(responseTime) },
    { metric: "Resolution Rate", value: Math.trunc(resolutionRate) },
    { metric: "First Contact", value: Math.trunc(firstContact) },
    { metric: "Satisfaction", value: Math.trunc(satisfaction) },
    { metric: "Effort Score", value: Math.trunc(effortScore) },
  ];

  return {
    total_threads: totalThreads,
    total_feedbacks: totalFeedbacks,
    feedback_rate: feedbackRate,
    positive_feedback: positiveFeedback,
    neutral_feedback: neutralFeedback,
    negative_feedback: negativeFeedback,
    feedback_distribution: feedbackDistribution,
    csat_score: csatScore,
    nps,
    first_contact_resolution: firstContactResolution,
    avg_handle_time: avgHandleTime,
    customer_effort_score: customerEffortScore,
    performance_overview: performanceOverview,
    total_revenue: 0.0,
  };
}

// ===========================================================================
// 5. AnalyticsUserSerializer  →  /analytics/user-matrix/
// ===========================================================================

export async function get_user_matrix(params: {
  store_code?: string;
  from?: string;
  to?: string;
}) {
  const db = getDb();
  const endDate = parseQueryDate(params.to, istToday());
  const startDate = parseQueryDate(params.from, addDays(endDate, -30));

  const filters = [
    localDateRange(sql`${chatThread.createdAt}`, startDate, endDate),
  ];
  const storeScope = storeIdScope(chatThread.storeId, params.store_code);
  if (storeScope) filters.push(storeScope);

  const [row] = await db
    .select({
      guest_user: sql<number>`count(distinct ${chatThread.id}) filter (where ${chatThread.customerId} is null)::int`,
      signed_user: sql<number>`count(distinct ${chatThread.id}) filter (where ${chatThread.customerId} is not null)::int`,
    })
    .from(chatThread)
    .where(and(...filters));

  return {
    guest_user: Number(row.guest_user),
    signed_user: Number(row.signed_user),
  };
}

// ===========================================================================
// 6. ConversionRateSerializer  →  /analytics/conversion-rate/
// ===========================================================================

export async function get_conversion_rate(params: {
  store_code?: string;
  from?: string;
  to?: string;
}) {
  const db = getDb();
  const endDate = parseQueryDate(params.to, istToday());
  const startDate = parseQueryDate(params.from, addDays(endDate, -30));

  const filters = [
    localDateRange(sql`${chatThread.createdAt}`, startDate, endDate),
  ];
  const storeScope = storeIdScope(chatThread.storeId, params.store_code);
  if (storeScope) filters.push(storeScope);
  const threadWhere = and(...filters)!;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(chatThread)
    .where(threadWhere);
  const totalCount = Number(total);

  const [{ converted }] = await db
    .select({
      converted: sql<number>`count(distinct ${chatThread.id})::int`,
    })
    .from(chatThread)
    .innerJoin(chatBotevent, eq(chatBotevent.threadId, chatThread.id))
    .where(and(threadWhere, eq(chatBotevent.eventType, "checkout_link")));
  const convertedCount = Number(converted);

  return {
    converted_count: convertedCount,
    total_count: totalCount,
    not_converted_count: totalCount - convertedCount,
    percentage: totalCount ? round2((convertedCount / totalCount) * 100) : 0,
  };
}

// ===========================================================================
// 7. QueryCategoryInsightsSerializer  →  /analytics/query-category-insights/
// ===========================================================================

const INTENT_TO_CATEGORY_LABEL: Record<string, string> = {
  product_search: "Product Inquiry",
  product_info: "Product Inquiry",
  order_tracking: "Order Issues",
  return_policy: "Return & Refund",
  payment_help: "Payment/Billing",
  shipping_delivery: "Shipping & Delivery",
  general_conversation: "General Conversation",
  other: "Request for Help",
};

export async function get_query_category_insights(params: {
  store_code?: string;
  from?: string;
  to?: string;
}) {
  const db = getDb();
  const endDate = parseQueryDate(params.to, istToday());
  const startDate = parseQueryDate(params.from, addDays(endDate, -30));

  // NOTE: threads are filtered with is_active = False (closed threads only).
  const filters = [
    localDateRange(sql`${chatThread.createdAt}`, startDate, endDate),
    eq(chatThread.isActive, false),
  ];
  const storeScope = storeIdScope(chatThread.storeId, params.store_code);
  if (storeScope) filters.push(storeScope);
  const threadWhere = and(...filters)!;

  const analyses = await db
    .select({
      topIntent: sentimentAnalysis.topIntent,
      resolvedQueriesList: sentimentAnalysis.resolvedQueriesList,
      unresolvedQueriesList: sentimentAnalysis.unresolvedQueriesList,
    })
    .from(sentimentAnalysis)
    .where(
      sql`${sentimentAnalysis.threadId} IN (SELECT id FROM chat_thread WHERE ${threadWhere})`,
    );

  const stats: Record<string, { answered: number; unanswered: number }> = {};
  for (const a of analyses) {
    const label =
      INTENT_TO_CATEGORY_LABEL[a.topIntent] ?? "General Conversation";
    if (!(label in stats)) stats[label] = { answered: 0, unanswered: 0 };
    const resolved = Array.isArray(a.resolvedQueriesList)
      ? a.resolvedQueriesList
      : [];
    const unresolved = Array.isArray(a.unresolvedQueriesList)
      ? a.unresolvedQueriesList
      : [];
    stats[label].answered += resolved.length;
    stats[label].unanswered += unresolved.length;
  }

  // Build list (insertion order of dict keys preserved, like Python 3.7+),
  // filter out empty, then stable-sort by total desc.
  const categoryBreakdown = Object.entries(stats)
    .map(([label, counts]) => ({
      category_label: label,
      answered: counts.answered,
      unanswered: counts.unanswered,
      total: counts.answered + counts.unanswered,
    }))
    .filter((c) => c.answered + c.unanswered > 0);

  // Python list.sort is stable; sort by total desc preserving original order on ties.
  categoryBreakdown.sort((a, b) => b.total - a.total);

  const totalAnswered = categoryBreakdown.reduce((s, c) => s + c.answered, 0);
  const totalUnanswered = categoryBreakdown.reduce(
    (s, c) => s + c.unanswered,
    0,
  );
  const totalQueries = totalAnswered + totalUnanswered;
  const mostAsked = categoryBreakdown.length ? categoryBreakdown[0] : {};

  return {
    category_breakdown: categoryBreakdown,
    most_asked_category: mostAsked,
    total_queries: totalQueries,
    total_answered: totalAnswered,
    total_unanswered: totalUnanswered,
  };
}

// ===========================================================================
// Helpers for engagement & operational efficiency (hour/period formatting)
// ===========================================================================

/** Format hour-of-day (0-23) like Python %I %p → "03 PM". */
function formatHourIp(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ap = hour < 12 ? "AM" : "PM";
  return `${String(h12).padStart(2, "0")} ${ap}`;
}

/** Format hour-of-day like Python %I:%M %p → "03:00 PM". */
function formatHourIMp(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ap = hour < 12 ? "AM" : "PM";
  return `${String(h12).padStart(2, "0")}:00 ${ap}`;
}

// ===========================================================================
// 3. BotEngagementSerializer  →  /analytics/engagements/
// ===========================================================================

export async function get_engagements(params: {
  store_code?: string;
  from?: string;
  to?: string;
}) {
  const db = getDb();
  const endDate = parseQueryDate(params.to, istToday());
  const startDate = parseQueryDate(params.from, addDays(endDate, -30));

  const threadFilters = [
    localDateRange(sql`${chatThread.createdAt}`, startDate, endDate),
  ];
  const storeScope = storeIdScope(chatThread.storeId, params.store_code);
  if (storeScope) threadFilters.push(storeScope);
  const threadWhere = and(...threadFilters)!;
  const threadSubquery = sql`(SELECT id FROM chat_thread WHERE ${threadWhere})`;

  // Every aggregate below is independent of the others, so run them in a single
  // Promise.all (one round-trip instead of ~12 sequential ones). All the JS
  // post-processing follows after the batch.
  const [
    totalRows,
    depthRows,
    rtRows,
    returnRows,
    peakRows,
    resolvedRows,
    abandonedRows,
    hourlyMsgRows,
    afterHoursRows,
    botHourRows,
    humanHourRows,
    trendRows,
  ] = await runSequentially([
    // total threads
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(chatThread)
      .where(threadWhere),
    // avg interaction depth: per-thread message counts (averaged in JS)
    db
      .select({ msgCount: sql<number>`count(${chatHistory.id})::int` })
      .from(chatHistory)
      .where(sql`${chatHistory.threadId} IN ${threadSubquery}`)
      .groupBy(chatHistory.threadId),
    // avg bot response time: per-thread avg over assistant replies
    db
      .select({ avgRt: sql<number | null>`avg(${chatHistory.responseTime})` })
      .from(chatThread)
      .leftJoin(
        chatHistory,
        and(
          eq(chatHistory.threadId, chatThread.id),
          eq(chatHistory.messageType, "reply"),
          eq(chatHistory.role, "assistant"),
        ),
      )
      .where(threadWhere)
      .groupBy(chatThread.id),
    // returning threads — NOTE (FIDELITY): Django does NOT filter this by store_code.
    db
      .select({ ret: sql<number>`count(*)::int` })
      .from(chatThread)
      .where(
        sql`(${chatThread.createdAt} AT TIME ZONE ${APP_TZ_SQL})::date < ${startDate}::date`,
      ),
    // peak usage hours: ExtractHour (current tz), count threads, top 8
    db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM (${chatThread.createdAt} AT TIME ZONE ${APP_TZ_SQL}))::int`,
        threads: sql<number>`count(${chatThread.id})::int`,
      })
      .from(chatThread)
      .where(threadWhere)
      .groupBy(
        sql`EXTRACT(HOUR FROM (${chatThread.createdAt} AT TIME ZONE ${APP_TZ_SQL}))`,
      )
      .orderBy(sql`count(${chatThread.id}) desc`)
      .limit(8),
    // sessions resolved
    db
      .select({ resolved: sql<number>`count(*)::int` })
      .from(chatThread)
      .where(and(threadWhere, eq(chatThread.isActive, true))),
    // sessions abandoned
    db
      .select({ abandoned: sql<number>`count(*)::int` })
      .from(chatThread)
      .where(and(threadWhere, eq(chatThread.isActive, false))),
    // peak usage time (message-based ExtractHour, sliding 4-hr window in JS)
    db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM (${chatHistory.createdAt} AT TIME ZONE ${APP_TZ_SQL}))::int`,
        count: sql<number>`count(${chatHistory.id})::int`,
      })
      .from(chatHistory)
      .where(sql`${chatHistory.threadId} IN ${threadSubquery}`)
      .groupBy(
        sql`EXTRACT(HOUR FROM (${chatHistory.createdAt} AT TIME ZONE ${APP_TZ_SQL}))`,
      ),
    // after-hours queries (role=user, ExtractHour < 9 or >= 18, current tz)
    db
      .select({ afterHours: sql<number>`count(*)::int` })
      .from(chatHistory)
      .where(
        and(
          sql`${chatHistory.threadId} IN ${threadSubquery}`,
          eq(chatHistory.role, "user"),
          sql`(EXTRACT(HOUR FROM (${chatHistory.createdAt} AT TIME ZONE ${APP_TZ_SQL}))::int < 9 OR EXTRACT(HOUR FROM (${chatHistory.createdAt} AT TIME ZONE ${APP_TZ_SQL}))::int >= 18)`,
        ),
      ),
    // 24-hour load distribution — chatbot (ChatHistory) by hour (current tz)
    db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM (${chatHistory.createdAt} AT TIME ZONE ${APP_TZ_SQL}))::int`,
        count: sql<number>`count(${chatHistory.id})::int`,
      })
      .from(chatHistory)
      .where(sql`${chatHistory.threadId} IN ${threadSubquery}`)
      .groupBy(
        sql`EXTRACT(HOUR FROM (${chatHistory.createdAt} AT TIME ZONE ${APP_TZ_SQL}))`,
      ),
    // 24-hour load distribution — human (SupportTicket) by hour (current tz)
    db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM (${supportTicket.createdAt} AT TIME ZONE ${APP_TZ_SQL}))::int`,
        count: sql<number>`count(${supportTicket.id})::int`,
      })
      .from(supportTicket)
      .where(
        localDateRange(sql`${supportTicket.createdAt}`, startDate, endDate),
      )
      .groupBy(
        sql`EXTRACT(HOUR FROM (${supportTicket.createdAt} AT TIME ZONE ${APP_TZ_SQL}))`,
      ),
    // conversation trend: user messages joined to SentimentAnalysis, bucketed
    // by weekday in JS. ExtractWeekDay: 1=Sun..7=Sat (Postgres dow+1).
    db
      .select({
        weekday: sql<number>`(EXTRACT(DOW FROM (${chatHistory.createdAt} AT TIME ZONE ${APP_TZ_SQL}))::int + 1)`,
        threadId: chatHistory.threadId,
        resolvedQueries: sentimentAnalysis.resolvedQueries,
      })
      .from(chatHistory)
      .leftJoin(
        sentimentAnalysis,
        eq(sentimentAnalysis.threadId, chatHistory.threadId),
      )
      .where(
        and(
          sql`${chatHistory.threadId} IN ${threadSubquery}`,
          eq(chatHistory.role, "user"),
        ),
      ),
  ]);

  const totalThreads = Number(totalRows[0].total);

  // Avg interaction depth (average of per-thread message counts).
  const avgInteractionDepthRaw = depthRows.length
    ? depthRows.reduce((s, r) => s + Number(r.msgCount), 0) / depthRows.length
    : 0;
  const avgInteractionDepth = round2(avgInteractionDepthRaw);

  // Avg bot response time across threads with at least one assistant reply.
  let totalAvgRt = 0;
  let validThreads = 0;
  for (const r of rtRows) {
    if (r.avgRt) {
      totalAvgRt += Number(r.avgRt);
      validThreads += 1;
    }
  }
  const avgResponseTimeSeconds = validThreads ? totalAvgRt / validThreads : 0.0;

  // New vs Returning
  const newThreads = totalThreads;
  const returningThreads = Number(returnRows[0].ret);
  const totalNewReturning = newThreads + returningThreads;
  const newPercentage = totalNewReturning
    ? round2((newThreads / totalNewReturning) * 100)
    : 0;
  const returningPercentage = totalNewReturning
    ? round2((returningThreads / totalNewReturning) * 100)
    : 0;

  const peakUsageHours = peakRows.map((p) => ({
    hour: formatHourIp(Number(p.hour)),
    threads: Number(p.threads),
  }));

  const resolvedSessions = Number(resolvedRows[0].resolved);
  const abandonedSessions = Number(abandonedRows[0].abandoned);

  // Peak usage time (sliding 4-hr window over per-hour message counts).
  const hourMap: Record<number, number> = {};
  for (const h of hourlyMsgRows) hourMap[Number(h.hour)] = Number(h.count);

  const WINDOW_SIZE = 4;
  let bestWindow: number[] | null = null;
  let bestCount = 0;
  for (let startHour = 0; startHour < 24; startHour++) {
    const windowHours = Array.from(
      { length: WINDOW_SIZE },
      (_, i) => (startHour + i) % 24,
    );
    const windowCount = windowHours.reduce((s, h) => s + (hourMap[h] ?? 0), 0);
    if (windowCount > bestCount) {
      bestCount = windowCount;
      bestWindow = windowHours;
    }
  }
  const totalMessages = Object.values(hourMap).reduce((s, v) => s + v, 0);
  let peakUsageTime: {
    time_range: string | null;
    messages: number;
    percentage: number;
  };
  if (bestWindow && totalMessages > 0) {
    const peakStart = formatHourIMp(bestWindow[0]);
    const peakEnd = formatHourIMp((bestWindow[bestWindow.length - 1] + 1) % 24);
    peakUsageTime = {
      time_range: `${peakStart} - ${peakEnd}`,
      messages: bestCount,
      percentage: round2((bestCount / totalMessages) * 100),
    };
  } else {
    peakUsageTime = { time_range: null, messages: 0, percentage: 0.0 };
  }

  const afterHoursQueries = Number(afterHoursRows[0].afterHours);

  // 24-hour load distribution (current tz): chatbot = ChatHistory by hour,
  // human = SupportTicket by hour.
  const botHourMap: Record<number, number> = {};
  for (const r of botHourRows) botHourMap[Number(r.hour)] = Number(r.count);

  const humanHourMap: Record<number, number> = {};
  for (const r of humanHourRows) humanHourMap[Number(r.hour)] = Number(r.count);

  const loadDistribution = [];
  for (let hour = 0; hour < 24; hour++) {
    loadDistribution.push({
      hour: formatHourIp(hour),
      chatbot: botHourMap[hour] ?? 0,
      human: humanHourMap[hour] ?? 0,
    });
  }

  // Conversation trend (weekly): bucket the batched user messages by weekday.
  // conversations = count of user messages; resolved = those whose thread's
  // SentimentAnalysis has resolved_queries truthy. WEEKDAY_MAP: 1=Sun..7=Sat.
  const WEEKDAY_MAP: Record<number, string> = {
    2: "Mon",
    3: "Tue",
    4: "Wed",
    5: "Thu",
    6: "Fri",
    7: "Sat",
    1: "Sun",
  };
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const trendMap: Record<string, { conversations: number; resolved: number }> =
    {};
  for (const d of dayOrder) trendMap[d] = { conversations: 0, resolved: 0 };

  for (const row of trendRows) {
    const dayLabel = WEEKDAY_MAP[Number(row.weekday)];
    if (!dayLabel) continue;
    trendMap[dayLabel].conversations += 1;
    // Django: SentimentAnalysis.objects.filter(thread=thread_id).first();
    // if analysis and analysis.resolved_queries: append. len() at the end.
    if (row.resolvedQueries && Number(row.resolvedQueries)) {
      trendMap[dayLabel].resolved += 1;
    }
  }
  const conversationTrend = dayOrder.map((day) => ({
    day,
    conversations: trendMap[day].conversations,
    resolved: trendMap[day].resolved,
  }));

  return {
    total_threads: totalThreads,
    avg_interaction_depth: avgInteractionDepth,
    avg_response_time_seconds: avgResponseTimeSeconds,
    new_vs_returning: {
      new: { count: newThreads, percentage: newPercentage },
      returning: { count: returningThreads, percentage: returningPercentage },
    },
    peak_usage_hours: peakUsageHours,
    sessions_resolved: resolvedSessions,
    sessions_abandoned: abandonedSessions,
    peak_usage_time: peakUsageTime,
    after_hours_queries: afterHoursQueries,
    twenty_4_hour_load_distribution: loadDistribution,
    conversation_trend: conversationTrend,
  };
}

// ===========================================================================
// 4. OperationalEfficiencySerializer  →  /analytics/operational-efficiency/
// ===========================================================================

export async function get_operational_efficiency(params: {
  store_code?: string;
  from?: string;
  to?: string;
}) {
  const db = getDb();
  const endDate = parseQueryDate(params.to, istToday());
  const startDate = parseQueryDate(params.from, addDays(endDate, -30));

  const baseFilters = (start: string, end: string) => {
    const f = [
      localDateRange(sql`${chatThread.createdAt}`, start, end),
      eq(chatThread.isActive, false),
    ];
    const storeScope = storeIdScope(chatThread.storeId, params.store_code);
    if (storeScope) f.push(storeScope);
    return and(...f)!;
  };

  const threadWhere = baseFilters(startDate, endDate);
  const threadSubquery = sql`(SELECT id FROM chat_thread WHERE ${threadWhere})`;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(chatThread)
    .where(threadWhere);
  const totalThreads = Number(total);

  // Escalated thread ids (distinct) from SupportTicket for in-range threads.
  const escalatedRows = await db
    .selectDistinct({ threadId: supportTicket.threadId })
    .from(supportTicket)
    .where(sql`${supportTicket.threadId} IN ${threadSubquery}`);
  const escalatedCount = escalatedRows.length;
  const escalatedThreadIds = escalatedRows.map((r) => r.threadId);

  // Bot-resolved: SentimentAnalysis for in-range threads, excluding escalated,
  // resolved_queries > 0.
  const botResolvedConds = [
    sql`${sentimentAnalysis.threadId} IN ${threadSubquery}`,
    gt(sentimentAnalysis.resolvedQueries, 0),
  ];
  if (escalatedThreadIds.length > 0) {
    botResolvedConds.push(
      notInArray(sentimentAnalysis.threadId, escalatedThreadIds),
    );
  }
  const [{ botResolved }] = await db
    .select({ botResolved: sql<number>`count(*)::int` })
    .from(sentimentAnalysis)
    .where(and(...botResolvedConds));
  const botResolvedCount = Number(botResolved);

  const botResolutionPercentage = totalThreads
    ? round2((botResolvedCount / totalThreads) * 100)
    : 0;
  const escalationPercentage = totalThreads
    ? round2((escalatedCount / totalThreads) * 100)
    : 0;

  let selfServiceSuccess: string;
  if (botResolutionPercentage >= 70) selfServiceSuccess = "High";
  else if (botResolutionPercentage >= 40) selfServiceSuccess = "Medium";
  else selfServiceSuccess = "Low";

  // Improvement trend (previous period)
  const rangeDays = daysBetween(startDate, endDate);
  const prevPeriodStart = addDays(startDate, -rangeDays);
  const prevPeriodEnd = addDays(startDate, -1);

  const prevWhere = baseFilters(prevPeriodStart, prevPeriodEnd);
  const prevSubquery = sql`(SELECT id FROM chat_thread WHERE ${prevWhere})`;

  const [{ prevTotal }] = await db
    .select({ prevTotal: sql<number>`count(*)::int` })
    .from(chatThread)
    .where(prevWhere);

  // prev_bot_resolved: SentimentAnalysis for prev threads, exclude any thread that
  // has a support ticket (thread__support_tickets__isnull=False), resolved>0.
  const [{ prevBotResolved }] = await db
    .select({ prevBotResolved: sql<number>`count(*)::int` })
    .from(sentimentAnalysis)
    .where(
      and(
        sql`${sentimentAnalysis.threadId} IN ${prevSubquery}`,
        gt(sentimentAnalysis.resolvedQueries, 0),
        sql`${sentimentAnalysis.threadId} NOT IN (SELECT thread_id FROM support_ticket)`,
      ),
    );
  const prevPercentage = Number(prevTotal)
    ? round2((Number(prevBotResolved) / Number(prevTotal)) * 100)
    : 0;

  const improvement = round2(botResolutionPercentage - prevPercentage);

  const deltaDays = daysBetween(startDate, endDate);
  let comparisonPeriod: string;
  if (deltaDays > 365) comparisonPeriod = "previous year";
  else if (deltaDays > 30) comparisonPeriod = "previous month";
  else if (deltaDays > 7) comparisonPeriod = "previous week";
  else comparisonPeriod = "previous day";

  const resolutionDistribution = [
    {
      type: "Bot Resolved",
      count: botResolvedCount,
      percentage: botResolutionPercentage,
    },
    {
      type: "Escalated",
      count: escalatedCount,
      percentage: escalationPercentage,
    },
  ];

  // ---------- Resolution trend over time ----------
  // Choose truncation granularity by range.
  let truncUnit: "year" | "month" | "week" | "day";
  if (deltaDays > 365) truncUnit = "year";
  else if (deltaDays > 30) truncUnit = "month";
  else if (deltaDays > 7) truncUnit = "week";
  else truncUnit = "day";
  // Inline the unit as an SQL literal (same reason as APP_TZ_SQL: a bound param
  // would break GROUP BY/ORDER BY expression matching). Safe — truncUnit is a
  // fixed internal enum, never user input.
  const truncUnitSql = sql.raw(`'${truncUnit}'`);

  // Django TruncWeek truncates to Monday. Postgres date_trunc('week') also → Monday.
  // Truncation is done in the current timezone (USE_TZ).
  const periodRows = await db
    .select({
      period: sql<string>`date_trunc(${truncUnitSql}, ${chatThread.createdAt} AT TIME ZONE ${APP_TZ_SQL})`,
    })
    .from(chatThread)
    .where(threadWhere)
    .groupBy(
      sql`date_trunc(${truncUnitSql}, ${chatThread.createdAt} AT TIME ZONE ${APP_TZ_SQL})`,
    )
    .orderBy(
      sql`date_trunc(${truncUnitSql}, ${chatThread.createdAt} AT TIME ZONE ${APP_TZ_SQL})`,
    );

  const monthAbbr = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  // Local-date components from the truncated period (period is naive local time).
  const periodParts = (p: string) => {
    // p like "2026-06-01 00:00:00" (no tz) — parse components directly.
    const m = p.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const y = m ? parseInt(m[1], 10) : 0;
    const mo = m ? parseInt(m[2], 10) : 1;
    const d = m ? parseInt(m[3], 10) : 1;
    return { y, mo, d };
  };
  const ymd = (y: number, mo: number, d: number) =>
    `${String(y).padStart(4, "0")}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const resolutionTrend = [];
  for (const row of periodRows) {
    const { y, mo, d } = periodParts(row.period);
    let periodStartDate: string;
    let periodEndDate: string;
    let periodLabel: string;

    if (truncUnit === "year") {
      periodStartDate = ymd(y, 1, 1);
      periodEndDate = ymd(y + 1, 1, 1);
      periodLabel = String(y);
    } else if (truncUnit === "month") {
      periodStartDate = ymd(y, mo, 1);
      const nextMo = mo === 12 ? 1 : mo + 1;
      const nextY = mo === 12 ? y + 1 : y;
      periodEndDate = ymd(nextY, nextMo, 1);
      periodLabel = `${monthAbbr[mo - 1]} ${y}`;
    } else if (truncUnit === "week") {
      periodStartDate = ymd(y, mo, d);
      periodEndDate = addDays(periodStartDate, 7);
      const endLabelDate = addDays(periodEndDate, -1);
      const sp = periodParts(periodStartDate);
      const ep = periodParts(endLabelDate);
      periodLabel =
        `${monthAbbr[sp.mo - 1]} ${String(sp.d).padStart(2, "0")} – ` +
        `${monthAbbr[ep.mo - 1]} ${String(ep.d).padStart(2, "0")}`;
    } else {
      periodStartDate = ymd(y, mo, d);
      periodEndDate = addDays(periodStartDate, 1);
      periodLabel = `${String(d).padStart(2, "0")} ${monthAbbr[mo - 1]}`;
    }

    // period_threads: in-range threads with created_at in [periodStart, periodEnd)
    // compared in current tz local time.
    const periodThreadWhere = and(
      threadWhere,
      sql`(${chatThread.createdAt} AT TIME ZONE ${APP_TZ_SQL}) >= ${periodStartDate}::timestamp`,
      sql`(${chatThread.createdAt} AT TIME ZONE ${APP_TZ_SQL}) < ${periodEndDate}::timestamp`,
    )!;
    const periodThreadSubquery = sql`(SELECT id FROM chat_thread WHERE ${periodThreadWhere})`;

    const [{ totPeriod }] = await db
      .select({ totPeriod: sql<number>`count(*)::int` })
      .from(chatThread)
      .where(periodThreadWhere);
    const totalPeriodThreads = Number(totPeriod);

    const [{ esc }] = await db
      .select({
        esc: sql<number>`count(distinct ${supportTicket.threadId})::int`,
      })
      .from(supportTicket)
      .where(sql`${supportTicket.threadId} IN ${periodThreadSubquery}`);
    const periodEscalated = Number(esc);

    const [{ botRes }] = await db
      .select({ botRes: sql<number>`count(*)::int` })
      .from(sentimentAnalysis)
      .where(
        and(
          sql`${sentimentAnalysis.threadId} IN ${periodThreadSubquery}`,
          gt(sentimentAnalysis.resolvedQueries, 0),
          sql`${sentimentAnalysis.threadId} NOT IN (SELECT thread_id FROM support_ticket)`,
        ),
      );
    const periodBotResolved = Number(botRes);

    const botResolvedPercentage = totalPeriodThreads
      ? round2((periodBotResolved / totalPeriodThreads) * 100)
      : 0;
    const escalatedPercentage = totalPeriodThreads
      ? round2((periodEscalated / totalPeriodThreads) * 100)
      : 0;

    resolutionTrend.push({
      period: periodLabel,
      bot_resolved: {
        count: periodBotResolved,
        percentage: botResolvedPercentage,
      },
      escalated: { count: periodEscalated, percentage: escalatedPercentage },
    });
  }

  // NOTE: Django reuses the loop variables `escalated_count` / `bot_resolved_count`
  // inside the trend loop, so the top-level escalation_rate/bot_resolution_rate
  // `count` reflect the LAST trend period's values (a Django quirk we replicate).
  let finalBotResolvedCount = botResolvedCount;
  let finalEscalatedCount = escalatedCount;
  if (resolutionTrend.length > 0) {
    const last = resolutionTrend[resolutionTrend.length - 1];
    finalBotResolvedCount = last.bot_resolved.count;
    finalEscalatedCount = last.escalated.count;
  }

  return {
    bot_resolution_rate: {
      count: finalBotResolvedCount,
      percentage: botResolutionPercentage,
    },
    escalation_rate: {
      count: finalEscalatedCount,
      percentage: escalationPercentage,
    },
    self_service_success: selfServiceSuccess,
    improvement_trend: {
      change_percentage: improvement,
      direction: improvement > 0 ? "up" : "down",
      comparison_period: comparisonPeriod,
    },
    resolution_distribution: resolutionDistribution,
    resolution_trend: resolutionTrend,
  };
}

// ===========================================================================
// 8. ChatHistory  →  /analytics/chat-history/
//    Two modes:
//      - aggregated=true  → ChatLoadAnalyticsSerializer
//      - otherwise (raw)  → ChatHistorySerializer (many)
// ===========================================================================

function hourLabel(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = ((h + 11) % 12) + 1;
  return `${String(hour).padStart(2, "0")} ${suffix}`;
}

/**
 * Port of analytics.helpers.parse_and_validate_daterange for the from/to + granularity
 * path used by chat-history. Returns ISO datetimes (with offset) like Python isoformat.
 * Min 1 hour, max 2 years enforced (throws Error on violation, mirroring ValueError).
 *
 * FIDELITY-GAP: Python uses dateutil.parser (very lenient) + make_aware in IST. Here we
 * support ISO-ish date / datetime strings. Plain dates get pushed to end-of-day for `to`.
 */
function parseAndValidateDaterange(
  fromStr?: string,
  toStr?: string,
  granularity?: string,
): { start: Date; end: Date } {
  const MIN_DELTA_MS = 3600 * 1000;
  const MAX_DELTA_MS = 365 * 2 * 86400 * 1000;
  const now = new Date();

  let start: Date;
  let end: Date;

  if (!fromStr && !toStr) {
    if (granularity === "weekly") {
      start = new Date(now.getTime() - 4 * 7 * 86400 * 1000);
      end = now;
    } else if (granularity === "monthly") {
      // start of current year in IST
      const istNow = istToday();
      const year = istNow.slice(0, 4);
      // 00:00 IST on Jan 1 → subtract offset to get UTC instant.
      start = new Date(`${year}-01-01T00:00:00+05:30`);
      end = now;
    } else {
      start = new Date(now.getTime() - 7 * 86400 * 1000);
      end = now;
    }
  } else {
    start = fromStr
      ? new Date(fromStr)
      : new Date(now.getTime() - 7 * 86400 * 1000);
    if (toStr) {
      end = new Date(toStr);
      // plain date (no time) → push to end of day
      if (/^\d{4}-\d{2}-\d{2}$/.test(toStr)) {
        end = new Date(`${toStr}T23:59:59.999+05:30`);
      }
    } else {
      end = now;
    }
    // plain from date with no time is treated as midnight IST
    if (fromStr && /^\d{4}-\d{2}-\d{2}$/.test(fromStr)) {
      start = new Date(`${fromStr}T00:00:00+05:30`);
    }
  }

  if (start > end)
    throw new Error("Start date must be before or equal to end date");
  const delta = end.getTime() - start.getTime();
  if (delta < MIN_DELTA_MS) throw new Error("Range must be at least 1 hour");
  if (delta > MAX_DELTA_MS) throw new Error("Range cannot exceed 2 years");

  return { start, end };
}

/** Format a Date as Python .isoformat() in IST (e.g. 2026-01-01T00:00:00+05:30). */
function isoformatIst(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  let hour = get("hour");
  if (hour === "24") hour = "00";
  const micro = "";
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}:${get("second")}${micro}+05:30`;
}

/** IST local hour-of-day (0-23) of a Date. */
function istHour(d: Date): number {
  const h = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    hour: "2-digit",
    hour12: false,
  }).format(d);
  const n = parseInt(h, 10);
  return n === 24 ? 0 : n;
}

export async function get_chat_history_aggregated(params: {
  store_code?: string;
  from?: string;
  to?: string;
  granularity?: string;
  query?: string;
}): Promise<{
  granularity: string;
  from_dt: string;
  to_dt: string;
  points: Array<{ label: string; value: number }>;
}> {
  const db = getDb();
  const granularity = params.granularity ?? "hourly";
  if (!["hourly", "weekly", "monthly"].includes(granularity)) {
    throw new Error("granularity must be 'hourly', 'weekly', or 'monthly'");
  }

  const { start, end } = parseAndValidateDaterange(
    params.from,
    params.to,
    granularity,
  );

  const conds = [
    gte(chatHistory.createdAt, start.toISOString()),
    lte(chatHistory.createdAt, end.toISOString()),
    eq(chatHistory.role, "user"),
  ];
  const storeScope = threadIdScope(chatHistory.threadId, params.store_code);
  if (storeScope) conds.push(storeScope);
  if (params.query) {
    conds.push(sql`${chatHistory.message} ILIKE ${"%" + params.query + "%"}`);
  }

  const rows = await db
    .select({ createdAt: chatHistory.createdAt })
    .from(chatHistory)
    .where(and(...conds));

  const points = aggregateChatMessages(
    rows.map((r) => new Date(r.createdAt)),
    granularity,
    start,
    end,
  );

  return {
    granularity,
    from_dt: isoformatIst(start),
    to_dt: isoformatIst(end),
    points,
  };
}

/** Port of analytics.helpers.aggregate_chat_messages (timestamps in IST local). */
function aggregateChatMessages(
  timestamps: Date[],
  granularity: string,
  startDt: Date,
  endDt: Date,
): Array<{ label: string; value: number }> {
  const monthAbbr = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (granularity === "hourly") {
    const buckets = new Map<string, number>();
    for (let h = 0; h < 24; h++) buckets.set(hourLabel(h), 0);
    for (const ts of timestamps) {
      const label = hourLabel(istHour(ts));
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    }
    return Array.from(buckets.entries()).map(([label, value]) => ({
      label,
      value,
    }));
  }

  // IST local date parts of a Date
  const istParts = (d: Date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const get = (t: string) =>
      parseInt(parts.find((p) => p.type === t)!.value, 10);
    return { y: get("year"), mo: get("month"), d: get("day") };
  };
  // day-of-week (Mon=0..Sun=6) for an IST date
  const istWeekday = (y: number, mo: number, d: number) => {
    // Use UTC date to avoid local tz drift; weekday of calendar date is tz-independent.
    const dow = new Date(Date.UTC(y, mo - 1, d)).getUTCDay(); // 0=Sun..6=Sat
    return (dow + 6) % 7; // Mon=0..Sun=6
  };
  const fmtDdMmm = (y: number, mo: number, d: number) =>
    `${String(d).padStart(2, "0")} ${monthAbbr[mo - 1]}`;

  if (granularity === "weekly") {
    const buckets = new Map<string, number>();
    const sp = istParts(startDt);
    // cursor = start.date(); rewind to Monday
    const cursor = new Date(Date.UTC(sp.y, sp.mo - 1, sp.d));
    const wd = istWeekday(sp.y, sp.mo - 1 + 1, sp.d);
    cursor.setUTCDate(cursor.getUTCDate() - wd);
    const ep = istParts(endDt);
    const endDate = new Date(Date.UTC(ep.y, ep.mo - 1, ep.d));
    while (cursor.getTime() <= endDate.getTime()) {
      const cy = cursor.getUTCFullYear();
      const cmo = cursor.getUTCMonth() + 1;
      const cd = cursor.getUTCDate();
      buckets.set(`W ${fmtDdMmm(cy, cmo, cd)}`, 0);
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }
    for (const ts of timestamps) {
      const p = istParts(ts);
      const w = istWeekday(p.y, p.mo, p.d);
      const ws = new Date(Date.UTC(p.y, p.mo - 1, p.d));
      ws.setUTCDate(ws.getUTCDate() - w);
      const label = `W ${fmtDdMmm(ws.getUTCFullYear(), ws.getUTCMonth() + 1, ws.getUTCDate())}`;
      if (buckets.has(label)) buckets.set(label, (buckets.get(label) ?? 0) + 1);
    }
    return Array.from(buckets.entries()).map(([label, value]) => ({
      label,
      value,
    }));
  }

  // monthly
  const buckets = new Map<string, number>();
  const sp = istParts(startDt);
  const ep = istParts(endDt);
  let y = sp.y;
  let m = sp.mo;
  while (y < ep.y || (y === ep.y && m <= ep.mo)) {
    buckets.set(`${monthAbbr[m - 1]} ${y}`, 0);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  for (const ts of timestamps) {
    const p = istParts(ts);
    const label = `${monthAbbr[p.mo - 1]} ${p.y}`;
    if (buckets.has(label)) buckets.set(label, (buckets.get(label) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([label, value]) => ({
    label,
    value,
  }));
}

export async function get_chat_history_raw(params: {
  store_code?: string;
  daterange?: string;
  query?: string;
}) {
  const db = getDb();
  // Raw mode uses parse_and_validate_daterange(daterange) — the legacy single-string
  // path with smart hourly default (1 week) when none provided.
  let start: Date;
  let end: Date;
  if (!params.daterange) {
    const now = new Date();
    start = new Date(now.getTime() - 7 * 86400 * 1000);
    end = now;
  } else {
    const r = parseLegacyDaterange(params.daterange);
    start = r.start;
    end = r.end;
  }

  const conds = [
    gte(chatHistory.createdAt, start.toISOString()),
    lte(chatHistory.createdAt, end.toISOString()),
  ];
  const storeScope = threadIdScope(chatHistory.threadId, params.store_code);
  if (storeScope) conds.push(storeScope);
  if (params.query) {
    conds.push(sql`${chatHistory.message} ILIKE ${"%" + params.query + "%"}`);
  }

  const rows = await db
    .select({
      id: chatHistory.id,
      role: chatHistory.role,
      message: chatHistory.message,
      json_content: chatHistory.jsonContent,
      created_at: chatHistory.createdAt,
    })
    .from(chatHistory)
    .where(and(...conds))
    .orderBy(chatHistory.createdAt);

  return rows;
}

/**
 * Minimal port of the legacy-string branch of parse_and_validate_daterange.
 * FIDELITY-GAP: Python uses dateutil + regex for several formats. This handles the
 * common ISO "YYYY-MM-DD-YYYY-MM-DD" and slash "M/D/YYYY-M/D/YYYY" patterns and a
 * generic split-on-first-'-' fallback. End date with no time → end of day (IST).
 */
function parseLegacyDaterange(raw: string): { start: Date; end: Date } {
  const trimmed = raw.trim();
  const isoMatch = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})[^\d](\d{4}-\d{2}-\d{2})$/,
  );
  const slashMatch = trimmed.match(
    /^(\d{1,2}\/\d{1,2}\/\d{4})-(\d{1,2}\/\d{1,2}\/\d{4})$/,
  );

  let startStr: string;
  let endStr: string | null;
  if (isoMatch) {
    startStr = isoMatch[1];
    endStr = isoMatch[2];
  } else if (slashMatch) {
    startStr = slashMatch[1];
    endStr = slashMatch[2];
  } else {
    const idx = trimmed.indexOf("-");
    if (idx === -1) {
      startStr = trimmed;
      endStr = null;
    } else {
      startStr = trimmed.slice(0, idx).trim();
      endStr = trimmed.slice(idx + 1).trim();
    }
  }

  const toIst = (s: string, endOfDay: boolean) => {
    const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(s);
    const slashDate = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (isoDate) {
      return new Date(`${s}T${endOfDay ? "23:59:59.999" : "00:00:00"}+05:30`);
    }
    if (slashDate) {
      const mm = slashDate[1].padStart(2, "0");
      const dd = slashDate[2].padStart(2, "0");
      const yyyy = slashDate[3];
      return new Date(
        `${yyyy}-${mm}-${dd}T${endOfDay ? "23:59:59.999" : "00:00:00"}+05:30`,
      );
    }
    return new Date(s);
  };

  const start = toIst(startStr, false);
  const end = endStr
    ? toIst(endStr, true)
    : new Date(start.getTime() + 7 * 86400 * 1000);
  return { start, end };
}

// ===========================================================================
// Consolidated dashboard summary  →  /analytics/dashboard
// Runs the 5 summary serializers in ONE request/transaction instead of 5
// separate API calls, behind a short TTL cache keyed by tenant + store + range.
// Cuts the dashboard from ~6 requests (each its own tx + verify-token + many
// queries) to 1, and to ~0 DB reads on cached repeat views.
// ===========================================================================

export type DashboardSummary = {
  feedback_insights: Awaited<ReturnType<typeof get_feedback_insights>> | null;
  engagements: Awaited<ReturnType<typeof get_engagements>> | null;
  operational_efficiency: Awaited<
    ReturnType<typeof get_operational_efficiency>
  > | null;
  user_matrix: Awaited<ReturnType<typeof get_user_matrix>> | null;
  conversion_rate: Awaited<ReturnType<typeof get_conversion_rate>> | null;
};

const EMPTY_DASHBOARD: DashboardSummary = {
  feedback_insights: null,
  engagements: null,
  operational_efficiency: null,
  user_matrix: null,
  conversion_rate: null,
};

export async function get_dashboard_summary(params: {
  store_code?: string;
  from?: string;
  to?: string;
}): Promise<DashboardSummary> {
  // Per-store access gate (F3). A denied store returns the empty payload and is
  // NOT cached, so an allowed user can never be served a denied user's slot.
  const scope = resolveStoreScope(params.store_code);
  const accessible = scope === null || scope.length > 0;
  if (!accessible) return EMPTY_DASHBOARD;

  // Tenant-prefixed cache key — never crosses companies.
  const key = `${currentCompany()}:${params.store_code ?? ""}:${params.from ?? ""}:${params.to ?? ""}`;
  const cached = getCached<DashboardSummary>(key);
  if (cached) return cached;

  // One connection, sequential (single tenant transaction — see tenant-context).
  const result: DashboardSummary = {
    feedback_insights: await get_feedback_insights(params),
    engagements: await get_engagements(params),
    operational_efficiency: await get_operational_efficiency(params),
    user_matrix: await get_user_matrix(params),
    conversion_rate: await get_conversion_rate(params),
  };
  setCached(key, result);
  return result;
}
