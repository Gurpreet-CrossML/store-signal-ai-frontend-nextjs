import { list_instagram_comments } from "@/db/social";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * GET /social/instagram/comments?post_id=&store_code= — comments on one
 * Instagram post (`social_message` where message_type = 'comment').
 */
export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const { store_code, post_id } = req.query;
  const postIdParam = Array.isArray(post_id) ? post_id[0] : post_id;
  const postId = parseInt(postIdParam ?? "", 10);
  if (!postIdParam || Number.isNaN(postId)) {
    return res
      .status(400)
      .json(createAPIResponse(false, "post_id is required", null));
  }

  const comments = await list_instagram_comments(
    postId,
    typeof store_code === "string" ? store_code : undefined,
  );

  return res
    .status(200)
    .json(
      createAPIResponse(
        true,
        "Instagram comments retrieved successfully.",
        comments,
      ),
    );
}
