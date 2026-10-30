import { list_thread_tags } from "@/db/threads";
import { parseThreadFilters } from "@/lib/thread-filters";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * GET /analytics/threads/tags  -> the store ticket tags that threads carry,
 * each with its thread count, for the Threads page's tag chips. Takes the same
 * query params as the thread list and counts against all of them except the
 * tag filter.
 */
export default withTenantRoute(handler, "conversations");

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const tags = await list_thread_tags(parseThreadFilters(req.query));

  return res
    .status(200)
    .json(createAPIResponse(true, "Tags retrieved successfully.", tags));
}
