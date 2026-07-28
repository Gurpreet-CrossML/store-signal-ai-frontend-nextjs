import { getNeverSayRules } from "@/db/chat";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import { withTenantRoute } from "@/lib/with-tenant-route";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Port of Django `NeverSayRulesAPIView` — GET only.
 * Serializer: NeverSayRulesSerializer.
 *  - GET -> Returns the never-say rules configuration for the specified store.
 *
 * This configuration is store-scoped and read-only here; modifications
 * are handled by the Django backend.
 */
export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const storeCode =
    typeof req.query.store_code === "string" ? req.query.store_code : "";
  if (!storeCode) {
    return res
      .status(400)
      .json(createAPIResponse(false, "store_code is required", null));
  }

  const rules = await getNeverSayRules(storeCode);
  return res
    .status(200)
    .json(
      createAPIResponse(true, "Never-say rules retrieved successfully", rules),
    );
}
