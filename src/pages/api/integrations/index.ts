import { list_integrations } from "@/db/integration";
import { APIResponse } from "@/lib/config";
import { createAPIResponse } from "@/lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { withTenantRoute } from "@/lib/with-tenant-route";

/**
 * Port of Django `IntegrationsAPIView` — GET only.
 * Serializer: IntegrationSerializer (nested category + attributes).
 *  - GET -> list of every available integration in the catalog.
 *
 * The catalog is global config (not store-scoped) and read-only here; wiring a
 * store to an integration is a write and stays on the Django backend.
 */
export default withTenantRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json(createAPIResponse(false, "Method Not Allowed", null));
  }

  const integrations = await list_integrations();

  return res
    .status(200)
    .json(
      createAPIResponse(
        true,
        "Integrations retrieved successfully",
        integrations,
      ),
    );
}
