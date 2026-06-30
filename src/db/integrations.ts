import { asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/tenant-context";
import {
  integration,
  integrationAttribute,
  integrationCategory,
} from "@/lib/drizzle/schema";
import type {
  CoreIntegration,
  IntegrationAttribute,
  IntegrationCatalogItem,
} from "@/lib/integration-types";

function resolveLogoUrl(logo: string | null): string | null {
  const trimmed = logo?.trim();
  if (!trimmed) return null;
  return trimmed;
}

function resolveCategoryLabel(category: string | null): string {
  if (!category) return "uncategorized";
  return category;
}

export async function list_integrations_with_attributes(): Promise<
  IntegrationCatalogItem[]
> {
  const db = getDb();

  const rows = await db
    .select({
      integration_id: integration.id,
      integration_name: integration.name,
      integration_logo: integration.logo,
      integration_description: integration.description,
      integration_is_active: integration.isActive,
      integration_steps_for_creds: integration.stepsForCreds,
      category_id: integrationCategory.id,
      category_name: integrationCategory.name,
      attribute_id: integrationAttribute.id,
      attribute_code: integrationAttribute.code,
      attribute_display_name: integrationAttribute.displayName,
      attribute_type: integrationAttribute.type,
      attribute_is_required: integrationAttribute.isRequired,
    })
    .from(integration)
    .leftJoin(
      integrationCategory,
      eq(integration.categoryId, integrationCategory.id),
    )
    .leftJoin(
      integrationAttribute,
      eq(integrationAttribute.integrationId, integration.id),
    )
    .orderBy(asc(integration.name), asc(integrationAttribute.displayName));

  const byId = new Map<number, IntegrationCatalogItem>();

  for (const row of rows) {
    const current = byId.get(row.integration_id);
    if (!current) {
      byId.set(row.integration_id, {
        id: Number(row.integration_id),
        name: row.integration_name,
        logo: row.integration_logo,
        logo_url: resolveLogoUrl(row.integration_logo),
        description: row.integration_description,
        is_active: Boolean(row.integration_is_active),
        category: {
          id: row.category_id == null ? null : Number(row.category_id),
          category: row.category_name ?? "uncategorized",
        },
        category_label: resolveCategoryLabel(row.category_name),
        steps_for_creds: row.integration_steps_for_creds,
        scope: null,
        attributes: [],
      });
    }

    if (row.attribute_id != null) {
      const attribute: IntegrationAttribute = {
        id: Number(row.attribute_id),
        code: row.attribute_code ?? "",
        display_name: row.attribute_display_name ?? "",
        type: row.attribute_type ?? "text",
        is_required: Boolean(row.attribute_is_required),
      };
      byId.get(row.integration_id)?.attributes.push(attribute);
    }
  }

  return Array.from(byId.values()).map((integrationItem) => ({
    ...integrationItem,
    attributes: integrationItem.attributes.sort((a, b) =>
      a.display_name.localeCompare(b.display_name),
    ),
  }));
}

export type { CoreIntegration };


