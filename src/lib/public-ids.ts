import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
} from "node:crypto";

/**
 * Opaque public ids for the dashboard — this app's half of the backend's
 * `core/public_ids.py`, and it must stay in step with it.
 *
 * The browser never sees the database ids of the records whose pages it links
 * to: it sees tokens such as `tkt_…`. Django swaps them at its boundary
 * (PublicIdMiddleware); this module does the same for this app's own boundary:
 * the `/api` routes (`withTenantRoute`) and the page URLs (`proxy.ts`).
 *
 * A token is `<prefix>_<AES-256-GCM of the id>`, keyed by URL_ID_KEY, the
 * record type authenticated — so it cannot be read, forged or used as another
 * type without the key. Server only: URL_ID_KEY must never reach the browser.
 */

const TYPES = {
  Ticket: "tkt",
  Thread: "thr",
  Customer: "cus",
  Order: "ord",
  KnowledgeItem: "kno",
  Campaign: "cmp",
  Segment: "seg",
  EmailTemplate: "etp",
  WhatsAppTemplate: "wtp",
} as const;

export type PublicIdType = keyof typeof TYPES;

const TYPE_BY_PREFIX = Object.fromEntries(
  Object.entries(TYPES).map(([type, prefix]) => [prefix, type]),
) as Record<string, PublicIdType>;

const TOKEN_RE = new RegExp(
  `^(${Object.values(TYPES).join("|")})_([A-Za-z0-9_-]{30,200})$`,
);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Keys of a record of that type (`{"customer": {"id": 5}}`), as in Django. */
const OBJECT_KEYS: Record<string, PublicIdType> = {
  customer: "Customer",
  linked_customer: "Customer",
  ticket: "Ticket",
  tickets: "Ticket",
  orders: "Order",
  citations: "KnowledgeItem",
};
/** Keys holding a thread's id. */
const SCALAR_KEYS: Record<string, PublicIdType> = {
  thread_id: "Thread",
  thread: "Thread",
};
/** Singular keys that may hold the bare id instead, e.g. `"ticket": 31`. */
const SCALAR_OBJECT_KEYS = new Set(["customer", "linked_customer", "ticket"]);

const keys = () => {
  const secret = process.env.URL_ID_KEY;
  if (!secret) throw new Error("URL_ID_KEY is not set.");
  return {
    enc: createHash("sha256").update(`url-id-enc:${secret}`).digest(),
    iv: createHash("sha256").update(`url-id-iv:${secret}`).digest(),
  };
};

const isId = (type: PublicIdType, value: unknown) =>
  type === "Thread"
    ? typeof value === "string" && UUID_RE.test(value)
    : typeof value === "number" && Number.isInteger(value);

/** The token for a record id; anything that is not an id is returned as is. */
export function encode<T>(type: PublicIdType, value: T): T | string {
  if (!isId(type, value)) return value;
  const key = keys();
  const raw = String(value);
  const iv = createHmac("sha256", key.iv)
    .update(`${type}:${raw}`)
    .digest()
    .subarray(0, 12);
  const cipher = createCipheriv("aes-256-gcm", key.enc, iv);
  cipher.setAAD(Buffer.from(type));
  const data = Buffer.concat([cipher.update(raw), cipher.final()]);
  const body = Buffer.concat([iv, data, cipher.getAuthTag()]);
  return `${TYPES[type]}_${body.toString("base64url")}`;
}

/** Whether a string is shaped like a token (valid or not). */
export const isToken = (value: unknown): value is string =>
  typeof value === "string" && TOKEN_RE.test(value);

/**
 * The record id inside a token — a number, or a uuid string for a thread — or
 * null when it is not a valid token for its prefix's type.
 */
export function decode(token: string): number | string | null {
  const match = TOKEN_RE.exec(token);
  if (!match) return null;
  const type = TYPE_BY_PREFIX[match[1]];
  // Strict base64url: Buffer.from would quietly skip stray characters.
  const data = Buffer.from(match[2], "base64url");
  if (data.toString("base64url") !== match[2] || data.length < 29) return null;
  let value: string;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      keys().enc,
      data.subarray(0, 12),
    );
    decipher.setAAD(Buffer.from(type));
    decipher.setAuthTag(data.subarray(-16));
    value = Buffer.concat([
      decipher.update(data.subarray(12, -16)),
      decipher.final(),
    ]).toString();
  } catch {
    return null;
  }
  if (type === "Thread") return UUID_RE.test(value) ? value : null;
  return /^\d+$/.test(value) ? Number(value) : null;
}

/** Whether a string is a valid token of that type. */
export const isTokenOf = (type: PublicIdType, value: string) =>
  value.startsWith(`${TYPES[type]}_`) && decode(value) !== null;

export class InvalidToken extends Error {}

/** A query value (or comma-separated list) with its tokens as ids. */
function decodeText(value: string): string {
  return value
    .split(",")
    .map((part) => {
      if (!TOKEN_RE.test(part)) return part;
      const raw = decode(part);
      if (raw === null) throw new InvalidToken(part);
      return String(raw);
    })
    .join(",");
}

/** `req.query` (path params included) with every token as its id. */
export function decodeQuery(
  query: Partial<Record<string, string | string[]>>,
): Partial<Record<string, string | string[]>> {
  const out: Partial<Record<string, string | string[]>> = {};
  for (const [key, value] of Object.entries(query)) {
    out[key] = Array.isArray(value)
      ? value.map(decodeText)
      : value === undefined
        ? value
        : decodeText(value);
  }
  return out;
}

type Json = unknown;

function walk(value: Json, key: string | null, depth: number): Json {
  if (depth > 12) return value;
  if (Array.isArray(value)) return value.map((v) => walk(v, key, depth + 1));
  if (!value || typeof value !== "object") return value;
  const ownType = key ? OBJECT_KEYS[key] : undefined;
  const out: Record<string, Json> = {};
  for (const [k, v] of Object.entries(value as Record<string, Json>)) {
    const scalar = v === null || typeof v !== "object";
    if (k === "id" && ownType) out[k] = encode(ownType, v);
    else if (k in SCALAR_KEYS && scalar) out[k] = encode(SCALAR_KEYS[k], v);
    else if (SCALAR_OBJECT_KEYS.has(k) && scalar)
      out[k] = encode(OBJECT_KEYS[k], v);
    else out[k] = walk(v, k, depth + 1);
  }
  return out;
}

/** A record of a known type: its `id` and the known keys inside it. */
function walkRecord(value: Json, type: PublicIdType): Json {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const out = walk(value, null, 0) as Record<string, Json>;
  if ("id" in out) out.id = encode(type, (value as { id: unknown }).id);
  return out;
}

/**
 * Which record a route's payload is (its `data`, each item of a `data` list
 * or of `data.results`), for the routes whose top-level `id` is one — the
 * mirror of what Django's serializers tell its middleware.
 */
const ROUTE_RECORDS: [RegExp, PublicIdType][] = [
  [/^\/api\/analytics\/threads\/?$/, "Thread"],
  [/^\/api\/analytics\/threads\/[^/]+\/?$/, "Thread"],
  [/^\/api\/analytics\/threads\/[^/]+\/order-data\/?$/, "Order"],
  [/^\/api\/support\/threads\/[^/]+\/tickets\/?$/, "Ticket"],
];

/** An `/api` route's response body with every record id as a token. */
export function encodeResponse(path: string, body: Json): Json {
  const pathname = path.split("?")[0];
  const type = ROUTE_RECORDS.find(([re]) => re.test(pathname))?.[1];
  if (!type || !body || typeof body !== "object" || !("data" in body)) {
    return walk(body, null, 0);
  }
  const { data, ...rest } = body as { data: Json };
  let records: Json = data;
  if (Array.isArray(data)) records = data.map((d) => walkRecord(d, type));
  else if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { results?: unknown }).results)
  ) {
    const page = walk(data, null, 0) as Record<string, Json>;
    page.results = (data as { results: Json[] }).results.map((d) =>
      walkRecord(d, type),
    );
    records = page;
  } else records = walkRecord(data, type);
  return { ...(walk(rest, null, 0) as object), data: records };
}

/** Page routes whose path carries a record's token: pattern -> its type. */
const PAGE_PATHS: [RegExp, PublicIdType][] = [
  [/^\/crm\/customers\/([^/]+)/, "Customer"],
  [/^\/crm\/orders\/([^/]+)/, "Order"],
  [/^\/threads\/([^/]+)/, "Thread"],
  [/^\/knowledge\/(?:items|articles)\/([^/]+)/, "KnowledgeItem"],
  [/^\/campaign\/campaigns\/([^/]+)/, "Campaign"],
  [/^\/campaign\/segments\/([^/]+)/, "Segment"],
  [/^\/campaign\/email-templates\/([^/]+)/, "EmailTemplate"],
  [/^\/campaign\/whatsapp-templates\/([^/]+)/, "WhatsAppTemplate"],
];
/** Page query params that carry a record's token: page -> param -> type. */
const PAGE_PARAMS: Record<string, Record<string, PublicIdType>> = {
  "/helpdesk": { ticket: "Ticket" },
  "/support": { chat: "Thread" },
  "/crm/orders": { customer: "Customer" },
  "/threads": { before_thread_id: "Thread" },
};
/** Segments under those prefixes that are pages of their own, not records. */
const NOT_RECORDS = new Set(["new", "create"]);

/**
 * How a page URL's record tokens check out: `"ok"`, `"not-found"` when the
 * path's record is not a valid token of its type (a raw id included), or the
 * query params to drop because they are not.
 */
export function checkPageUrl(
  pathname: string,
  params: URLSearchParams,
): "ok" | "not-found" | { drop: string[] } {
  for (const [re, type] of PAGE_PATHS) {
    const segment = re.exec(pathname)?.[1];
    if (segment === undefined || NOT_RECORDS.has(segment)) continue;
    if (!isTokenOf(type, decodeURIComponent(segment))) return "not-found";
  }
  const page = pathname.replace(/\/+$/, "") || "/";
  const drop = Object.entries(PAGE_PARAMS[page] ?? {})
    .filter(([param, type]) => {
      const value = params.get(param);
      return value !== null && !isTokenOf(type, value);
    })
    .map(([param]) => param);
  return drop.length ? { drop } : "ok";
}
