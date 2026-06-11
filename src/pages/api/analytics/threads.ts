import { list_threads, ListThreadsFilters } from "@/db/threads";
import { APIResponse, DEFAULT_API_PAGE_SIZE } from "@/lib/config";
import { createAPIResponse, createPaginatedResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * GET /analytics/threads/  ->  ThreadListAPIView (analytics/views.py)
 *
 * Query params: store_code, page, page_size, from, to, search, is_active,
 * user_type, has_ticket, has_feedback.
 *
 * Paginated (DRF PageNumberPagination, default page_size=15). When there are no
 * results, Django sets response_data=None which create_api_response renders as
 * [] for a list GET path; we mirror that by returning [] (not the paginated
 * envelope) in the empty case.
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

  const q = req.query;
  const getStr = (v: string | string[] | undefined): string | undefined =>
    Array.isArray(v) ? v[0] : v;

  const filters: ListThreadsFilters = {
    store_code: getStr(q.store_code),
    from: getStr(q.from),
    to: getStr(q.to),
    is_active: getStr(q.is_active),
    search: getStr(q.search),
    user_type: getStr(q.user_type),
    has_ticket: getStr(q.has_ticket),
    has_feedback: getStr(q.has_feedback),
  };

  const pageParam = getStr(q.page);
  const pageSizeParam = getStr(q.page_size);

  const page = pageParam ? parseInt(pageParam, 10) || 1 : 1;
  const pageSize = pageSizeParam
    ? parseInt(pageSizeParam, 10) || DEFAULT_API_PAGE_SIZE
    : DEFAULT_API_PAGE_SIZE;

  const { count, results } = await list_threads(filters, page, pageSize);

  // Empty queryset -> Django response_data is None -> rendered as [].
  if (count === 0) {
    return res
      .status(200)
      .json(createAPIResponse(true, "Threads retrieved successfully.", []));
  }

  const paginated = createPaginatedResponse(
    "/analytics/threads/",
    count,
    page,
    pageSize,
    results,
  );

  return res
    .status(200)
    .json(
      createAPIResponse(true, "Threads retrieved successfully.", paginated),
    );
}
