import { list_stores } from '@/db/store';
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

    const stores = await list_stores();

    return res.status(200).json(
        createAPIResponse(true, "Stores retrieved successfully", stores)
    );
}
