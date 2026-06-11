import { get_ai_insights } from "@/db/threads";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * GET /analytics/threads/{thread_id}/ai-insights/  ->  AiInsightsAPIView.
 * When no AiInsights row exists, returns message "No AI Insights found for this
 * thread" with data {} (HTTP 200), mirroring the Django view.
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

    const data = await get_ai_insights(thread_id as string);

    if (!data) {
        return res
            .status(200)
            .json(
                createAPIResponse(true, "No AI Insights found for this thread", {}),
            );
    }

    return res
        .status(200)
        .json(createAPIResponse(true, "AI Insights retrieved successfully", data));
}
