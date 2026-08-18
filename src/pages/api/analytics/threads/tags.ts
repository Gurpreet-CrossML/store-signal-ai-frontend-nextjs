import { list_thread_tags } from "@/db/threads";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * GET /analytics/threads/tags  -> distinct AiInsights.tags for a store's
 * threads, used to populate the Threads page's tags filter.
 */
export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const store_code = req.query.store_code;
  const tags = await list_thread_tags(
    Array.isArray(store_code) ? store_code[0] : store_code,
  );

  return res
    .status(200)
    .json(createAPIResponse(true, "Tags retrieved successfully.", tags));
}
