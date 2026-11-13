import type {
  AIScope,
  KnowledgeItem,
  KnowledgeType,
  ProductOption,
} from "@/redux/api-slice/knowledge-rag-slice";

/**
 * Where knowledge applies, and which AI uses it. Chosen once for everything
 * added in a step (or for one article), then sent with it.
 */

/** The four choices offered. Only `general` maps straight to the API's
 * `KnowledgeType`; the other three are all `product` and differ in which
 * picker (products, categories or collections) is filled in. */
export type ScopeKind = "general" | "product" | "category" | "collection";

export type KnowledgeScope = {
  scopeKind: ScopeKind;
  aiScope: AIScope[];
  products: ProductOption[];
  categories: ProductOption[];
  collections: ProductOption[];
};

/** New knowledge starts store-wide, used by the Sales and Support AI. */
export const DEFAULT_KNOWLEDGE_SCOPE: KnowledgeScope = {
  scopeKind: "general",
  aiScope: ["sales", "support"],
  products: [],
  categories: [],
  collections: [],
};

/** The scope an existing knowledge item was saved with, in the panel's shape. */
export function scopeOfItem(item: KnowledgeItem): KnowledgeScope {
  const products = item.products ?? [];
  const categories = item.categories ?? [];
  const collections = item.collections ?? [];
  return {
    aiScope: item.aiScope,
    scopeKind:
      item.type === "general"
        ? "general"
        : products.length > 0
          ? "product"
          : categories.length > 0
            ? "category"
            : "collection",
    products,
    categories,
    collections,
  };
}

export function scopeKindToType(scopeKind: ScopeKind): KnowledgeType {
  return scopeKind === "general" ? "general" : "product";
}

/** The shared fields of a create/update request. */
export function scopeToPayload(scope: KnowledgeScope) {
  return {
    type: scopeKindToType(scope.scopeKind),
    aiScope: scope.aiScope,
    productIds: scope.products.map((product) => product.id),
    categoryIds: scope.categories.map((category) => category.id),
    collectionIds: scope.collections.map((collection) => collection.id),
  };
}

/** What is wrong with a scope, if anything: no AI chosen, or a product,
 * category or collection scope with nothing picked. */
export function validateScope(scope: KnowledgeScope): {
  aiScope?: string;
  selection?: string;
} {
  const errors: { aiScope?: string; selection?: string } = {};

  if (scope.aiScope.length === 0) errors.aiScope = "Select at least one AI";

  const picked = {
    product: scope.products,
    category: scope.categories,
    collection: scope.collections,
  };
  if (scope.scopeKind !== "general" && picked[scope.scopeKind].length === 0) {
    errors.selection = `Select at least one ${scope.scopeKind}`;
  }

  return errors;
}

/** A short phrase for where knowledge applies, e.g. "Category · Apparel". */
export function describeScope(scope: KnowledgeScope): string {
  const labels = {
    product: ["Product", scope.products],
    category: ["Category", scope.categories],
    collection: ["Collection", scope.collections],
  } as const;
  if (scope.scopeKind === "general") return "Whole store";

  const [label, picked] = labels[scope.scopeKind];
  return picked.length > 0
    ? `${label} · ${picked.map((entry) => entry.name).join(", ")}`
    : label;
}
