import type { NextApiRequest, NextApiResponse } from "next";

import { get_thread_counts } from "@/db/threads";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import { withTenantRoute } from "@/lib/with-tenant-route";

export default withTenantRoute(handler, "conversations");

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const storeCode = Array.isArray(req.query.store_code)
    ? req.query.store_code[0]
    : req.query.store_code;
  const counts = await get_thread_counts(storeCode);

  return res
    .status(200)
    .json(
      createAPIResponse(true, "Thread counts retrieved successfully.", counts),
    );
}
