import { getDb } from "@/lib/tenant-context";
import {
  integration,
  integrationCategory,
  integrationAttribute,
} from "@/lib/drizzle/schema";
import { asc, eq, inArray } from "drizzle-orm";
import { getAbsoluteS3Url } from "@/lib/url";

/**
 * Read-only port of the `integration` catalog DB access.
 *
 * The integrations catalog (available integrations + their credential-attribute
 * definitions) is global config, not store-scoped: every store in the tenant
 * sees the same list. Only the GET (list) is served from Next.js; connecting a
 * store to an integration is a write and stays on the Django backend.
 *
 * Serializer fields mirrored (IntegrationSerializer):
 *   id, name, description, logo, is_active, steps_for_creds,
 *   category (nested {id, name, description}),
 *   attributes (nested list, ordered by `order`).
 */

export type IntegrationCategoryRow = {
  id: number;
  name: string;
  description: string | null;
};

export type IntegrationAttributeRow = {
  name: string;
  code: string;
  display_name: string;
  type: string;
  is_required: boolean;
  options: string[] | null;
  order: number;
  placeholder?: string | null;
};

export type IntegrationRow = {
  id: number;
  name: string;
  description: string | null;
  logo: string | null;
  is_active: boolean;
  steps_for_creds: string;
  category: IntegrationCategoryRow;
  attributes: IntegrationAttributeRow[];
};

/**
 * Integration.objects.all().order_by("name"), each with its category and its
 * attributes (ordered by `order`). Assembled with two queries on the request's
 * single tenant connection (run sequentially — see runSequentially note in
 * tenant-context) and joined in memory.
 */
export async function list_integrations(): Promise<IntegrationRow[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: integration.id,
      name: integration.name,
      description: integration.description,
      logo: integration.logo,
      is_active: integration.isActive,
      steps_for_creds: integration.stepsForCreds,
      category: {
        id: integrationCategory.id,
        name: integrationCategory.name,
        description: integrationCategory.description,
      },
    })
    .from(integration)
    .innerJoin(
      integrationCategory,
      eq(integration.categoryId, integrationCategory.id),
    )
    .orderBy(asc(integration.name));

  if (rows.length === 0) return [];

  const attributeRows = await db
    .select({
      integrationId: integrationAttribute.integrationId,
      name: integrationAttribute.name,
      code: integrationAttribute.code,
      display_name: integrationAttribute.displayName,
      type: integrationAttribute.type,
      is_required: integrationAttribute.isRequired,
      options: integrationAttribute.options,
      order: integrationAttribute.order,
      placeholder: integrationAttribute.placeholder,
    })
    .from(integrationAttribute)
    .where(
      inArray(
        integrationAttribute.integrationId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(asc(integrationAttribute.order));

  const attributesByIntegration = new Map<number, IntegrationAttributeRow[]>();
  for (const { integrationId, options, ...attr } of attributeRows) {
    const list = attributesByIntegration.get(integrationId) ?? [];
    list.push({ ...attr, options: (options as string[] | null) ?? null });
    attributesByIntegration.set(integrationId, list);
  }

  return rows.map((r) => ({
    ...r,
    logo: r.logo ? getAbsoluteS3Url(r.logo) : null,
    attributes: attributesByIntegration.get(r.id) ?? [],
  }));
}
