import { list_thread_tickets } from '@/db/support';
import { APIResponse } from '@/lib/config';
import { createAPIResponse } from '@/lib/helpers';
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<APIResponse>
) {
    if (req.method !== 'GET') {
        return res.status(405).json(createAPIResponse(false, "Method Not Allowed", null));
    }

    const { thread_id } = req.query;

    const tickets = await list_thread_tickets(thread_id as string);

    return res.status(200).json(
        createAPIResponse(true, "Support tickets retrieved successfully", tickets)
    );
}
