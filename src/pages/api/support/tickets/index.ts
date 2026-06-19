import { list_tickets } from "@/db/support";
import { APIResponse, DEFAULT_API_PAGE_SIZE } from "@/lib/config";
import { createAPIResponse, createPaginatedResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>,
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const { store_code, page = "1", page_size = "15", search, status, priority, platform } =
    req.query;

  const pageNumber = Array.isArray(page)
    ? parseInt(page[0], 10) || 1
    : parseInt(page, 10) || 1;
  const pageSizeNumber = Array.isArray(page_size)
    ? parseInt(page_size[0], 10) || DEFAULT_API_PAGE_SIZE
    : parseInt(page_size, 10) || DEFAULT_API_PAGE_SIZE;

  const filters = {
    store_code: Array.isArray(store_code) ? store_code[0] : store_code,
    search: Array.isArray(search) ? search[0] : search,
    status: Array.isArray(status) ? status[0] : status,
    priority: Array.isArray(priority) ? priority[0] : priority,
    platform: Array.isArray(platform) ? platform[0] : platform,
  };

  const result = await list_tickets(filters, pageNumber, pageSizeNumber);

  if (result.count === 0) {
    return res
      .status(200)
      .json(createAPIResponse(true, "Tickets retrieved successfully.", []));
  }

  const paginated = createPaginatedResponse(
    "/support/tickets/",
    result.count,
    pageNumber,
    pageSizeNumber,
    result.results,
  );

  return res
    .status(200)
    .json(createAPIResponse(true, "Tickets retrieved successfully.", paginated));
}
