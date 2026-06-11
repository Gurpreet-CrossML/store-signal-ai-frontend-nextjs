import { get_store_by_code, list_store_faqs } from "@/db/knowledge";
import { APIResponse, DEFAULT_API_PAGE_SIZE } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import { InvalidPage, Paginator, paginateResponse } from "@/lib/pagination";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Port of Django `StoreFAQsAPIView` (knowledge/views.py) — GET only.
 * Serializer: StoreFAQSerializer.
 *  - GET -> list (paginated, page_size=15, SearchFilter on ?search=question)
 *
 * POST (create) stays on the Django backend (it also writes to the Qdrant
 * vector DB), so it is intentionally not served here.
 *
 * DRF PageNumberPagination does not read page_size from the query, so per-page
 * is fixed at 15 (DEFAULT_API_PAGE_SIZE).
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

  const { store_code, page = "1", search } = req.query;

  const storeRow = store_code
    ? await get_store_by_code(store_code as string)
    : null;

  // No store -> queryset.none(); response_data stays None -> create_api_response
  // returns [] for a GET without an id at the end of the path.
  if (!storeRow) {
    return res
      .status(200)
      .json(createAPIResponse(true, "List Store FAQs.", []));
  }

  const faqs = await list_store_faqs(
    storeRow.id,
    storeRow.code,
    typeof search === "string" && search !== "" ? search : undefined,
  );

  // Django: `if queryset:` — an empty/falsy paginated result yields data=None,
  // which create_api_response renders as [] for a non-detail GET.
  if (faqs.length === 0) {
    return res
      .status(200)
      .json(createAPIResponse(true, "List Store FAQs.", []));
  }

  const paginator = new Paginator(faqs, DEFAULT_API_PAGE_SIZE);
  try {
    const pageObj = paginator.page(page as string);
    const path = (req.url ?? "").split("?")[0];
    return res
      .status(200)
      .json(
        createAPIResponse(
          true,
          "List Store FAQs.",
          paginateResponse(pageObj, path),
        ),
      );
  } catch (error) {
    if (error instanceof InvalidPage) {
      return res
        .status(404)
        .json(createAPIResponse(false, "Invalid page", null));
    }
    throw error;
  }
}
