import type { NextApiRequest } from "next";

import type { ListThreadsFilters } from "@/db/threads";

type Query = NextApiRequest["query"];

const getStr = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

const getList = (v: string | string[] | undefined): string[] | undefined => {
  if (!v) return undefined;
  const items = (Array.isArray(v) ? v : [v])
    .flatMap((part) => part.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
};

/**
 * The thread list's filters, read from a request's query string. Shared by
 * the thread list and the tag counts above it, so both see the same threads.
 */
export function parseThreadFilters(q: Query): ListThreadsFilters {
  return {
    store_code: getStr(q.store_code),
    from: getStr(q.from),
    to: getStr(q.to),
    is_active: getStr(q.is_active),
    need_escalation: getStr(q.need_escalation),
    search: getStr(q.search),
    user_type: getStr(q.user_type),
    has_ticket: getStr(q.has_ticket),
    has_order: getStr(q.has_order),
    has_agent: getStr(q.has_agent),
    has_feedback: getStr(q.has_feedback),
    feedback_rating: getStr(q.feedback_rating),
    tags: getList(q.tags),
    handled_by: getStr(q.handled_by),
    channel: getList(q.channel),
    assignee: getList(q.assignee),
    before_thread_id: getStr(q.before_thread_id),
  };
}
