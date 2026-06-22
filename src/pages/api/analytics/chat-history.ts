import {
  get_chat_history_aggregated,
  get_chat_history_raw,
} from "@/db/analytics";
import { APIResponse } from "@/lib/config";
import { createAPIResponse, handleApiError } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * Mirrors Django ChatHistoryAPIView.
 *
 * Two modes:
 *  - aggregated=true → ChatLoadAnalyticsSerializer ("Chat load analytics retrieved successfully")
 *  - otherwise (raw) → ChatHistorySerializer(many) ("History retrieved successfully")
 *
 * Both branches return a generic 500 on error (the raw cause is logged
 * server-side, never sent to the client — see handleApiError).
 */
export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const aggregated = req.query.aggregated;
  const aggregatedStr = Array.isArray(aggregated) ? aggregated[0] : aggregated;

  // aggregated mode
  if ((aggregatedStr ?? "").toLowerCase() === "true") {
    try {
      const data = await get_chat_history_aggregated({
        store_code: req.query.store_code as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
        granularity: req.query.granularity as string | undefined,
        query: req.query.query as string | undefined,
      });
      return res
        .status(200)
        .json(
          createAPIResponse(
            true,
            "Chat load analytics retrieved successfully",
            data,
          ),
        );
    } catch (e) {
      return handleApiError(res, e, "analytics/chat-history");
    }
  }

  // raw mode
  try {
    const data = await get_chat_history_raw({
      store_code: req.query.store_code as string | undefined,
      daterange: req.query.daterange as string | undefined,
      query: req.query.query as string | undefined,
    });
    return res
      .status(200)
      .json(createAPIResponse(true, "History retrieved successfully", data));
  } catch (e) {
    return handleApiError(res, e, "analytics/chat-history");
  }
}
