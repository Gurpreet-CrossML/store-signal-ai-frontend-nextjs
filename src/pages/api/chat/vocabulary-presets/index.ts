import type { NextApiRequest, NextApiResponse } from "next";

import { listVocabularyPresets } from "@/db/chat";
import { APIResponse } from "@/lib/config";
import { createAPIResponse, handleApiError } from "@/lib/helpers";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * Port of Django `VocabularyPresetsAPIView` — GET only.
 *  - GET -> Returns the catalog of all available vocabulary presets.
 *
 * This configuration is global config (not store-scoped) and read-only here; modifications
 * are handled by the Django backend.
 */

export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  try {
    const data = await listVocabularyPresets();

    return res
      .status(200)
      .json(
        createAPIResponse(
          true,
          "Vocabulary presets retrieved successfully",
          data,
        ),
      );
  } catch (e) {
    return handleApiError(res, e, "chat/vocabulary-presets");
  }
}
