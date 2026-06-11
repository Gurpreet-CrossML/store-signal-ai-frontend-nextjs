import { db } from "@/lib/db";
import {
  store,
  storeFaqs,
  knowledgeStorelibrarydocument,
  scrapeLinkslinks,
} from "@/lib/drizzle/schema";
import { and, desc, eq, ilike } from "drizzle-orm";

/**
 * Read-only port of the `knowledge` Django app's DB access.
 *
 * Only GET endpoints are served from Next.js; all writes (POST/PUT/PATCH/DELETE)
 * stay on the Django backend because they carry side-effects the Next app does
 * not own (Qdrant vector writes, media storage, post-save Lambda pipelines).
 *
 * Every list view first resolves the store via `?store_code=` using
 *   Store.objects.filter(code=store_code).first()
 * and returns an empty result set when no store matches (queryset.none()).
 * That store lookup is replicated by `get_store_by_code`.
 */

export type StoreRow = {
  id: number;
  code: string;
  name: string;
  platform: string;
};

/** Store.objects.filter(code=store_code).first() */
export async function get_store_by_code(
  store_code: string,
): Promise<StoreRow | null> {
  const rows = await db
    .select({
      id: store.id,
      code: store.code,
      name: store.name,
      platform: store.platform,
    })
    .from(store)
    .where(eq(store.code, store_code))
    .limit(1);

  return rows[0] ?? null;
}

/* ------------------------------------------------------------------ *
 * Store FAQs  (StoreFAQsAPIView)
 * Serializer fields: id, store, question, answer, created_at, updated_at
 * `store` is a SlugRelatedField(slug_field="code") -> the store's code string.
 * ------------------------------------------------------------------ */

export type StoreFaqRow = {
  id: number;
  store: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
};

/**
 * StoreFAQsAPIView.get_queryset:
 *   StoreFAQs.objects.filter(store=store)
 *   + SearchFilter on ["question"] via ?search=
 *   .order_by("-created_at")
 * Returns ALL matching rows (in-memory pagination happens in the route, the
 * way the existing threads route does, via Paginator).
 */
export async function list_store_faqs(
  store_id: number,
  store_code: string,
  search?: string,
): Promise<StoreFaqRow[]> {
  const where = search
    ? and(
        eq(storeFaqs.storeId, store_id),
        ilike(storeFaqs.question, `%${search}%`),
      )
    : eq(storeFaqs.storeId, store_id);

  const rows = await db
    .select({
      id: storeFaqs.id,
      question: storeFaqs.question,
      answer: storeFaqs.answer,
      created_at: storeFaqs.createdAt,
      updated_at: storeFaqs.updatedAt,
    })
    .from(storeFaqs)
    .where(where)
    .orderBy(desc(storeFaqs.createdAt));

  return rows.map((r) => ({ ...r, store: store_code }));
}

/* ------------------------------------------------------------------ *
 * Library Documents  (StoreLibraryDocumentAPIView)
 * Serializer fields: id, name, type, size, status, path, created_at, updated_at
 * ------------------------------------------------------------------ */

export type LibraryDocumentRow = {
  id: number;
  name: string;
  type: string;
  size: number;
  status: string;
  path: string;
  created_at: string;
  updated_at: string;
};

/**
 * StoreLibraryDocumentAPIView.get_queryset:
 *   StoreLibraryDocument.objects.filter(store=store).order_by("-created_at")
 * (no SearchFilter on the list view; returns all rows for in-memory pagination)
 */
export async function list_library_documents(
  store_id: number,
): Promise<LibraryDocumentRow[]> {
  return db
    .select({
      id: knowledgeStorelibrarydocument.id,
      name: knowledgeStorelibrarydocument.name,
      type: knowledgeStorelibrarydocument.type,
      size: knowledgeStorelibrarydocument.size,
      status: knowledgeStorelibrarydocument.status,
      path: knowledgeStorelibrarydocument.path,
      created_at: knowledgeStorelibrarydocument.createdAt,
      updated_at: knowledgeStorelibrarydocument.updatedAt,
    })
    .from(knowledgeStorelibrarydocument)
    .where(eq(knowledgeStorelibrarydocument.storeId, store_id))
    .orderBy(desc(knowledgeStorelibrarydocument.createdAt));
}

/* ------------------------------------------------------------------ *
 * Scrape Links  (ScrapeLinksAPIView)
 * ScrapeLinksSerializer base fields: id, store, link_type, url, status,
 *   created_at, updated_at — but `to_representation` overrides `store` with a
 *   nested object {id, code, name, platform}.
 * ------------------------------------------------------------------ */

export type ScrapeLinkRow = {
  id: number;
  store: { id: number; code: string; name: string; platform: string };
  link_type: string;
  url: string;
  status: string;
  created_at: string;
  updated_at: string;
};

/**
 * ScrapeLinksAPIView.get_queryset:
 *   ScrapeLinks.objects.filter(store=store)
 * No explicit ordering in the view; Django returns default (insertion/pk) order.
 * NOT paginated.
 */
export async function list_scrape_links(
  storeRow: StoreRow,
): Promise<ScrapeLinkRow[]> {
  const rows = await db
    .select({
      id: scrapeLinkslinks.id,
      link_type: scrapeLinkslinks.linkType,
      url: scrapeLinkslinks.url,
      status: scrapeLinkslinks.status,
      created_at: scrapeLinkslinks.createdAt,
      updated_at: scrapeLinkslinks.updatedAt,
    })
    .from(scrapeLinkslinks)
    .where(eq(scrapeLinkslinks.storeId, storeRow.id));

  return rows.map((r) => ({
    ...r,
    store: {
      id: storeRow.id,
      code: storeRow.code,
      name: storeRow.name,
      platform: storeRow.platform,
    },
  }));
}
