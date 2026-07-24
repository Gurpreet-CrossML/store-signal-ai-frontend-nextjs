import { getPersonaIdentity } from "@/db/chat";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import { withTenantRoute } from "@/lib/with-tenant-route";
import type { NextApiRequest, NextApiResponse } from "next";

export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const storeCode =
    typeof req.query.store_code === "string" ? req.query.store_code : "";
  if (!storeCode) {
    return res
      .status(400)
      .json(createAPIResponse(false, "store_code is required", null));
  }

  const identity = await getPersonaIdentity(storeCode);
  return res
    .status(200)
    .json(
      createAPIResponse(
        true,
        "Persona identity retrieved successfully",
        identity,
      ),
    );
}
