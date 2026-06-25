import { get_store_by_code, list_scrape_links } from "@/db/knowledge";
import { APIResponse } from "@/lib/config";
import { createAPIResponse, handleApiError } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * Port of Django `ScrapeLinksAPIView` (knowledge/views.py) — GET only.
 * Serializer: ScrapeLinksSerializer.
 *  - GET -> list scrape links for the store (NOT paginated)
 *
 * POST (create) stays on the Django backend (it triggers the post-save
 * URL-processing Lambda), so it is intentionally not served here.
 *
 * ScrapeLinksSerializer.to_representation nests `store` as
 * {id, code, name, platform}.
 */
export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  try {
    const store_code = req.query.store_code as string | undefined;
    const storeRow = store_code ? await get_store_by_code(store_code) : null;

    // No store -> queryset.none(): serializer.data is [] (NOT None here, the
    // view passes serializer.data directly as data).
    if (!storeRow) {
      return res
        .status(200)
        .json(
          createAPIResponse(true, "Policy links retrieved successfully", []),
        );
    }

    const links = await list_scrape_links(storeRow);
    return res
      .status(200)
      .json(
        createAPIResponse(true, "Policy links retrieved successfully", links),
      );
  } catch (e) {
    return handleApiError(res, e, "knowledge/scrape-links");
  }
}
