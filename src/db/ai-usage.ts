import { and, desc, eq, gte, ilike, lte, sql, type SQL } from "drizzle-orm";

import { storeIdScope } from "@/db/access";
import { aiUsage, chatHistory, chatThread } from "@/lib/drizzle/schema";
import { getDb } from "@/lib/tenant-context";

export type AIUsageFilters = {
  store_code?: string;
  workflow_id?: string;
  agent_id?: string;
  model?: string;
  from?: string;
  to?: string;
};

export type AIUsageItem = {
  id: number;
  workflow_id: string;
  agent_id: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: string;
  latency: number;
  model: string;
  created_at: string;
};

export type AIUsageSummary = {
  total_cost: number;
  total_records: number;
  average_latency: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
};

export type AIUsageCharts = {
  workflow_costs: { workflow: string; cost: number }[];
  agent_calls: { agent: string; calls: number }[];
  model_tokens: {
    model: string;
    input_tokens: number;
    output_tokens: number;
  }[];
  latency_trend: { date: string; latency: number }[];
};

function buildConditions(filters: AIUsageFilters): SQL[] {
  const conditions: SQL[] = [];
  const storeScope = storeIdScope(chatThread.storeId, filters.store_code);
  if (storeScope) conditions.push(storeScope);
  if (filters.workflow_id)
    conditions.push(ilike(aiUsage.workflowId, `%${filters.workflow_id}%`));
  if (filters.agent_id)
    conditions.push(ilike(aiUsage.agentId, `%${filters.agent_id}%`));
  if (filters.model)
    conditions.push(ilike(aiUsage.model, `%${filters.model}%`));
  if (filters.from)
    conditions.push(gte(aiUsage.createdAt, `${filters.from}T00:00:00.000Z`));
  if (filters.to)
    conditions.push(lte(aiUsage.createdAt, `${filters.to}T23:59:59.999Z`));
  return conditions;
}

export async function listAIUsage(
  filters: AIUsageFilters,
  page: number,
  pageSize: number,
): Promise<{
  count: number;
  results: AIUsageItem[];
  summary: AIUsageSummary;
  charts: AIUsageCharts;
}> {
  const db = getDb();
  const where = and(...buildConditions(filters));
  const base = db
    .select({
      total_records: sql<number>`count(*)::int`,
      total_cost: sql<number>`coalesce(sum(${aiUsage.cost}), 0)::double precision`,
      average_latency: sql<number>`coalesce(avg(${aiUsage.latency}), 0)::double precision`,
      total_tokens: sql<number>`coalesce(sum(${aiUsage.totalTokens}), 0)::bigint`,
      input_tokens: sql<number>`coalesce(sum(${aiUsage.inputTokens}), 0)::bigint`,
      output_tokens: sql<number>`coalesce(sum(${aiUsage.outputTokens}), 0)::bigint`,
    })
    .from(aiUsage)
    .innerJoin(chatHistory, eq(aiUsage.chatHistoryId, chatHistory.id))
    .innerJoin(chatThread, eq(chatHistory.threadId, chatThread.id))
    .where(where);

  const [summaryRow] = await base;
  const summary: AIUsageSummary = {
    total_cost: Number(summaryRow?.total_cost ?? 0),
    total_records: Number(summaryRow?.total_records ?? 0),
    average_latency: Number(summaryRow?.average_latency ?? 0),
    total_tokens: Number(summaryRow?.total_tokens ?? 0),
    input_tokens: Number(summaryRow?.input_tokens ?? 0),
    output_tokens: Number(summaryRow?.output_tokens ?? 0),
  };

  const rows = await db
    .select({
      id: aiUsage.id,
      workflow_id: aiUsage.workflowId,
      agent_id: aiUsage.agentId,
      input_tokens: aiUsage.inputTokens,
      output_tokens: aiUsage.outputTokens,
      total_tokens: aiUsage.totalTokens,
      cost: aiUsage.cost,
      latency: aiUsage.latency,
      model: aiUsage.model,
      created_at: aiUsage.createdAt,
    })
    .from(aiUsage)
    .innerJoin(chatHistory, eq(aiUsage.chatHistoryId, chatHistory.id))
    .innerJoin(chatThread, eq(chatHistory.threadId, chatThread.id))
    .where(where)
    .orderBy(desc(aiUsage.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const workflowCosts = await db
    .select({
      workflow: aiUsage.workflowId,
      cost: sql<number>`sum(${aiUsage.cost})::double precision`,
    })
    .from(aiUsage)
    .innerJoin(chatHistory, eq(aiUsage.chatHistoryId, chatHistory.id))
    .innerJoin(chatThread, eq(chatHistory.threadId, chatThread.id))
    .where(where)
    .groupBy(aiUsage.workflowId)
    .orderBy(desc(sql`sum(${aiUsage.cost})`))
    .limit(8);

  const agentCalls = await db
    .select({
      agent: aiUsage.agentId,
      calls: sql<number>`count(*)::int`,
    })
    .from(aiUsage)
    .innerJoin(chatHistory, eq(aiUsage.chatHistoryId, chatHistory.id))
    .innerJoin(chatThread, eq(chatHistory.threadId, chatThread.id))
    .where(where)
    .groupBy(aiUsage.agentId)
    .orderBy(desc(sql`count(*)`))
    .limit(8);

  const modelTokens = await db
    .select({
      model: aiUsage.model,
      input_tokens: sql<number>`sum(${aiUsage.inputTokens})::bigint`,
      output_tokens: sql<number>`sum(${aiUsage.outputTokens})::bigint`,
    })
    .from(aiUsage)
    .innerJoin(chatHistory, eq(aiUsage.chatHistoryId, chatHistory.id))
    .innerJoin(chatThread, eq(chatHistory.threadId, chatThread.id))
    .where(where)
    .groupBy(aiUsage.model)
    .orderBy(desc(sql`sum(${aiUsage.inputTokens} + ${aiUsage.outputTokens})`))
    .limit(8);

  const latencyTrend = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${aiUsage.createdAt}), 'YYYY-MM-DD')`,
      latency: sql<number>`avg(${aiUsage.latency})::double precision`,
    })
    .from(aiUsage)
    .innerJoin(chatHistory, eq(aiUsage.chatHistoryId, chatHistory.id))
    .innerJoin(chatThread, eq(chatHistory.threadId, chatThread.id))
    .where(where)
    .groupBy(sql`date_trunc('day', ${aiUsage.createdAt})`)
    .orderBy(sql`date_trunc('day', ${aiUsage.createdAt})`)
    .limit(90);

  return {
    count: summary.total_records,
    results: rows,
    summary,
    charts: {
      workflow_costs: workflowCosts.map((item) => ({
        workflow: item.workflow || "Unspecified",
        cost: Number(item.cost),
      })),
      agent_calls: agentCalls.map((item) => ({
        agent: item.agent || "Unspecified",
        calls: Number(item.calls),
      })),
      model_tokens: modelTokens.map((item) => ({
        model: item.model || "Unknown",
        input_tokens: Number(item.input_tokens),
        output_tokens: Number(item.output_tokens),
      })),
      latency_trend: latencyTrend.map((item) => ({
        date: item.date,
        latency: Number(item.latency),
      })),
    },
  };
}
