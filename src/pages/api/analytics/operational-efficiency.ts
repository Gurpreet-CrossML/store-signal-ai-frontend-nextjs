import { get_operational_efficiency } from "@/db/analytics";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";

// Mirrors Django OperationalEfficiencyAPIView + OperationalEfficiencySerializer.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>,
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const { store_code, from, to } = req.query;

  try {
    const data = await get_operational_efficiency({
      store_code: store_code as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
    });

    return res
      .status(200)
      .json(
        createAPIResponse(
          true,
          "Operational efficiency insights retreived successfully.",
          data,
        ),
      );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[analytics/operational-efficiency] failed:", e);
    return res
      .status(500)
      .json(createAPIResponse(false, `Internal server error - ${msg}`, null));
  }
}
