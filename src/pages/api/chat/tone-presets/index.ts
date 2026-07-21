import type { NextApiRequest, NextApiResponse } from "next";

import { listTonePresets } from "@/db/chat";
import { APIResponse } from "@/lib/config";
import { createAPIResponse, handleApiError } from "@/lib/helpers";
import { withTenantRoute } from "@/lib/with-tenant-route";

export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  try {
    const data = await listTonePresets();

    return res
      .status(200)
      .json(
        createAPIResponse(true, "Tone presets retrieved successfully", data),
      );
  } catch (e) {
    return handleApiError(res, e, "chat/tone-presets");
  }
}
