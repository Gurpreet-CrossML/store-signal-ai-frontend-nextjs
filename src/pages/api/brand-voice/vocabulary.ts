import { getVocabulary } from "@/db/brand-voice";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { withTenantRoute } from "@/lib/with-tenant-route";

export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const store_code = req.query.store_code as string | undefined;
  const data = await getVocabulary(store_code ?? "");

  return res
    .status(200)
    .json(createAPIResponse(true, "Vocabulary retrieved successfully", data));
}
