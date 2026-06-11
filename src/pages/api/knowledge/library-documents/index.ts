import { get_store_by_code, list_library_documents } from '@/db/knowledge';
import { APIResponse, DEFAULT_API_PAGE_SIZE } from '@/lib/config';
import { createAPIResponse } from '@/lib/helpers';
import { InvalidPage, Paginator, paginateResponse } from '@/lib/pagination';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Port of Django `StoreLibraryDocumentAPIView` (knowledge/views.py) — GET only.
 * Serializer: StoreLibraryDocumentSerializer.
 *  - GET -> list (paginated, page_size=15, ordered by -created_at)
 *
 * POST (upload) stays on the Django backend (multipart + media storage + the
 * post-save Lambda processing pipeline), so it is intentionally not served here.
 *
 * DRF PageNumberPagination does not read page_size from the query, so per-page
 * is fixed at 15 (DEFAULT_API_PAGE_SIZE).
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<APIResponse>,
) {
    if (req.method !== 'GET') {
        return res.status(405).json(createAPIResponse(false, 'Method Not Allowed', null));
    }

    const { store_code, page = '1' } = req.query;

    const storeRow = store_code
        ? await get_store_by_code(store_code as string)
        : null;

    // No store -> queryset.none() -> data=None -> create_api_response renders []
    if (!storeRow) {
        return res
            .status(200)
            .json(createAPIResponse(true, 'List Store Library Documents.', []));
    }

    const docs = await list_library_documents(storeRow.id);

    // Django: `if queryset:` empty/falsy -> data=None -> [] for non-detail GET.
    if (docs.length === 0) {
        return res
            .status(200)
            .json(createAPIResponse(true, 'List Store Library Documents.', []));
    }

    const paginator = new Paginator(docs, DEFAULT_API_PAGE_SIZE);
    try {
        const pageObj = paginator.page(page as string);
        const path = (req.url ?? '').split('?')[0];
        return res
            .status(200)
            .json(
                createAPIResponse(
                    true,
                    'List Store Library Documents.',
                    paginateResponse(pageObj, path),
                ),
            );
    } catch (error) {
        if (error instanceof InvalidPage) {
            return res.status(404).json(createAPIResponse(false, 'Invalid page', null));
        }
        throw error;
    }
}
