import type { NextApiRequest, NextApiResponse } from "next";

import { getVocabulary } from "@/db/chat";
import { APIResponse } from "@/lib/config";
import { createAPIResponse, handleApiError } from "@/lib/helpers";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * Port of Django `VocabularyAPIView` — GET only.
 * Serializer: VocabularySerializer.
 *  - GET -> Returns the vocabulary, replacements, and phrases for the specified store.
 *
 * This configuration is store-scoped and read-only here; modifications
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
    const store_code = req.query.store_code as string | undefined;
    const data = await getVocabulary(store_code ?? "");

    return res
      .status(200)
      .json(createAPIResponse(true, "Vocabulary retrieved successfully", data));
  } catch (e) {
    return handleApiError(res, e, "chat/vocabulary");
  }
}
