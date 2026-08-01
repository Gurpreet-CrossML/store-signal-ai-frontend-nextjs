import { list_instagram_pages } from "@/db/social";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * GET /social/instagram/pages — connected Instagram pages ("Connect Accounts"
 * table) for the page-switcher dropdown. Optional `?store_code=` narrows to
 * one store; omitted, it's every Instagram page the caller can access (F3).
 */
export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const { store_code } = req.query;
  const pages = await list_instagram_pages(
    typeof store_code === "string" ? store_code : undefined,
  );

  return res
    .status(200)
    .json(
      createAPIResponse(true, "Instagram pages retrieved successfully.", pages),
    );
}
