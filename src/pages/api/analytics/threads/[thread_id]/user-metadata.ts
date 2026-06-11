import { get_user_metadata } from "@/db/threads";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * GET /analytics/threads/{thread_id}/user-metadata/  ->
 * UserMetadataRetrieveAPIView.
 *
 * Returns the latest UserMetadata row for the thread. When none exists, Django
 * serializes a None instance which yields {} (empty object).
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

  const data = await get_user_metadata(thread_id as string);

  return res
    .status(200)
    .json(
      createAPIResponse(
        true,
        "User metadata retrieved successfully",
        data ?? {},
      ),
    );
}
