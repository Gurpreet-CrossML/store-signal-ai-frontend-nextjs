import { get_cart_data } from "@/db/threads";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * GET /analytics/threads/{thread_id}/cart-data/  ->  CartDataAPIView.
 * When no UserMetadata row exists, returns 404 with
 * "No cart data found for this thread" and data {}.
 */
export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const { thread_id } = req.query;

  if (!thread_id) {
    return res
      .status(400)
      .json(createAPIResponse(false, "thread_id is required", {}));
  }

  const data = await get_cart_data(thread_id as string);

  if (!data) {
    return res
      .status(404)
      .json(createAPIResponse(false, "No cart data found for this thread", {}));
  }

  return res
    .status(200)
    .json(createAPIResponse(true, "Cart data retrieved successfully", data));
}
