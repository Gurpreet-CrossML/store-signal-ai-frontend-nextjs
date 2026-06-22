import { get_user_matrix } from "@/db/analytics";
import { APIResponse } from "@/lib/config";
import { createAPIResponse, handleApiError } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { withTenantRoute } from "@/lib/with-tenant-route";

// Mirrors Django AnalyticsUserAPIView + AnalyticsUserSerializer.
export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const { store_code, from, to } = req.query;

  try {
    const data = await get_user_matrix({
      store_code: store_code as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
    });

    return res
      .status(200)
      .json(
        createAPIResponse(true, "User Matrix retrieved successfully", data),
      );
  } catch (e) {
    return handleApiError(res, e, "analytics/user-matrix");
  }
}
