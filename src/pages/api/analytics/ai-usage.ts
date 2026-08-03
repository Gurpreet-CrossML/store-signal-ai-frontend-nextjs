import type { NextApiRequest, NextApiResponse } from "next";

import { listAIUsage, type AIUsageFilters } from "@/db/ai-usage";
import { type APIResponse, DEFAULT_API_PAGE_SIZE } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import { withTenantRoute } from "@/lib/with-tenant-route";

export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res.status(405).json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const filters: AIUsageFilters = {
    store_code: first(req.query.store_code),
    workflow_id: first(req.query.workflow_id),
    agent_id: first(req.query.agent_id),
    model: first(req.query.model),
    from: first(req.query.from),
    to: first(req.query.to),
  };
  const page = Math.max(1, Number(first(req.query.page)) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(first(req.query.page_size)) || DEFAULT_API_PAGE_SIZE),
  );
  const data = await listAIUsage(filters, page, pageSize);
  return res
    .status(200)
    .json(createAPIResponse(true, "AI usage retrieved successfully.", data));
}
