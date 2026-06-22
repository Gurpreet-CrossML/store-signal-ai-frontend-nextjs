import { get_dashboard_summary } from "@/db/analytics";
import { APIResponse } from "@/lib/config";
import { createAPIResponse, handleApiError } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * Consolidated dashboard endpoint — returns feedback_insights, engagements,
 * operational_efficiency, user_matrix and conversion_rate in one response, so
 * the dashboard makes a single request (one tenant transaction, one verify) and
 * benefits from the shared short-TTL cache instead of 5 separate calls.
 */
export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  try {
    const data = await get_dashboard_summary({
      store_code: req.query.store_code as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    });
    return res
      .status(200)
      .json(createAPIResponse(true, "Dashboard retrieved successfully.", data));
  } catch (e) {
    return handleApiError(res, e, "analytics/dashboard");
  }
}
