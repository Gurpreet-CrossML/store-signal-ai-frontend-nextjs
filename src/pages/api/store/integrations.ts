import type { NextApiRequest, NextApiResponse } from "next";

import { list_integrations_with_attributes } from "@/db/integrations";
import { APIResponse } from "@/lib/config";
import { createAPIResponse, handleApiError } from "@/lib/helpers";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * Frontend-only GET route for the integration catalog.
 * Returns all active integrations with their attributes (used to render
 * the integration cards in Settings → Integrations tab).
 *
 * POST/write operations (connect, delete, test) remain on the Django backend.
 */
export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  try {
    const data = await list_integrations_with_attributes();
    return res
      .status(200)
      .json(createAPIResponse(true, "Integrations catalog.", data));
  } catch (error) {
    return handleApiError(res, error, "store/integrations");
  }
}
