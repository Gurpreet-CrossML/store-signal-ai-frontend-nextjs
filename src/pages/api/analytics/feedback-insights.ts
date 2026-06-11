import { get_feedback_insights } from '@/db/analytics';
import { APIResponse } from '@/lib/config';
import { createAPIResponse } from '@/lib/helpers';
import type { NextApiRequest, NextApiResponse } from 'next'

// Mirrors Django FeedbackInsightsAPIView + FeedbackInsightsSerializer.
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<APIResponse>
) {
    if (req.method !== 'GET') {
        return res.status(405).json(createAPIResponse(false, "Method Not Allowed", null));
    }

    const { store_code, from, to } = req.query;

    const data = await get_feedback_insights({
        store_code: store_code as string | undefined,
        from: from as string | undefined,
        to: to as string | undefined,
    });

    return res.status(200).json(
        createAPIResponse(true, "Feedback insights retreived successfully.", data)
    );
}
