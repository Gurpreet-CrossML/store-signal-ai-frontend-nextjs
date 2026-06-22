import { get_feedback_sequence } from "@/db/threads";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * GET /analytics/threads/{thread_id}/feedback-sequence/  ->
 * FeedbackSequenceAPIView.
 *
 * Returns the thread's chatbot feedback (rating, message, timestamp), or null
 * when none was submitted. See get_feedback_sequence.
 */
export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const { thread_id } = req.query;

  const data = await get_feedback_sequence(thread_id as string);

  return res
    .status(200)
    .json(
      createAPIResponse(true, "Feedback sequence retrieved successfully", data),
    );
}
