import type { NextApiRequest, NextApiResponse } from "next";

import { listNeverSayRulesPresets } from "@/db/chat";
import { APIResponse } from "@/lib/config";
import { createAPIResponse, handleApiError } from "@/lib/helpers";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * Port of Django `NeverSayRulesPresetsAPIView` — GET only..
 *  - GET -> Returns the catalog of all available never-say rules presets.
 *
 * This configuration is global config (not store-scoped) and read-only here; modifications
 * are handled by the Django backend.
 */

export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  try {
    const data = await listNeverSayRulesPresets();

    return res
      .status(200)
      .json(
        createAPIResponse(
          true,
          "Never-say rules presets retrieved successfully",
          data,
        ),
      );
  } catch (e) {
    return handleApiError(res, e, "chat/never-say-rules-presets");
  }
}
