import { list_instagram_dms } from "@/db/social";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * GET /social/instagram/dms?account_id=&store_code= — DMs for one Instagram
 * page. Same `social_message` table as comments, filtered by
 * `message_type = 'dm'` instead. Rows come back oldest-first; the client
 * groups them by `social_user_id` into the conversation list and threads.
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

  const dms = await list_instagram_dms(
    accountId,
    typeof store_code === "string" ? store_code : undefined,
  );

  return res
    .status(200)
    .json(
      createAPIResponse(true, "Instagram DMs retrieved successfully.", dms),
    );
}
