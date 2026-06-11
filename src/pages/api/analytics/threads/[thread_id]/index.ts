import { get_thread_details } from "@/db/threads";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * GET /analytics/threads/{thread_id}/  ->  ThreadChatsAPIView (analytics/views.py)
 *
 * Optional query param `limit`: when a positive integer, returns the latest
 * `limit` messages (ordered -created_at); otherwise all messages (created_at).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>,
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const { thread_id } = req.query;

  let limit: number | null = null;
  const limitParam = Array.isArray(req.query.limit)
    ? req.query.limit[0]
    : req.query.limit;
  if (typeof limitParam === "string") {
    const parsed = parseInt(limitParam, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      limit = parsed;
    }
  }

  const data = await get_thread_details(thread_id as string, limit);

  return res
    .status(200)
    .json(
      createAPIResponse(true, "Thread chats retrieved successfully.", data),
    );
}
