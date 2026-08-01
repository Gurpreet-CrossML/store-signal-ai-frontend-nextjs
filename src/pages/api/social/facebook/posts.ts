import { list_facebook_posts } from "@/db/social";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * GET /social/facebook/posts?account_id=&store_code= — posts for one Facebook
 * page ("Social post" table), newest first. Switching the selected page means
 * re-calling this with the new `account_id`.
 */
export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const { store_code, account_id } = req.query;
  const accountIdParam = Array.isArray(account_id) ? account_id[0] : account_id;
  const accountId = parseInt(accountIdParam ?? "", 10);
  if (!accountIdParam || Number.isNaN(accountId)) {
    return res
      .status(400)
      .json(createAPIResponse(false, "account_id is required", null));
  }

  const posts = await list_facebook_posts(
    accountId,
    typeof store_code === "string" ? store_code : undefined,
  );

  return res
    .status(200)
    .json(
      createAPIResponse(true, "Facebook posts retrieved successfully.", posts),
    );
}
