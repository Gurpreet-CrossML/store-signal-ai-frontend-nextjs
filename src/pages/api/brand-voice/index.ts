import type { NextApiRequest, NextApiResponse } from "next";

import { getToneStyle, getVocabulary } from "@/db/chat";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import { withTenantRoute } from "@/lib/with-tenant-route";

type BrandVoiceFeature = "tone-style" | "vocabulary" | "all";

export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const store_code = req.query.store_code as string | undefined;
  const feature = (req.query.feature as BrandVoiceFeature | undefined) ?? "all";

  if (feature === "tone-style") {
    const data = await getToneStyle(store_code ?? "");
    return res
      .status(200)
      .json(createAPIResponse(true, "Tone style retrieved successfully", data));
  }

  if (feature === "vocabulary") {
    const data = await getVocabulary(store_code ?? "");
    return res
      .status(200)
      .json(createAPIResponse(true, "Vocabulary retrieved successfully", data));
  }

  const [toneStyle, vocabulary] = await Promise.all([
    getToneStyle(store_code ?? ""),
    getVocabulary(store_code ?? ""),
  ]);

  return res.status(200).json(
    createAPIResponse(true, "Brand voice retrieved successfully", {
      tone_style: toneStyle,
      vocabulary,
    }),
  );
}
