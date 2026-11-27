import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
} from "node:crypto";

/**
 * Public ids: this app's half of the backend's `core/public_ids.py`. Both
 * follow the same rules and make the same tokens; change them together.
 *
 * Out (`/api` responses): the value of an id key becomes a token, `id_…`,
 * when it is an integer or a uuid. An id key is `id`, any key ending in `_id`
 * or `_ids`, and the relation names in `RELATIONS`. Under JSON columns
 * (`JSON_KEYS`) the data is the shops' own, so only `JSON_ID_KEYS` there are
 * ours.
 *
 * In (`/api` query and path params, page URLs): every token becomes the id
 * again. Real ids are still accepted.
 *
 * A token is `id_<base64url(IV + ciphertext + tag)>`: the id encrypted with
 * AES-256-GCM under URL_ID_KEY; the IV comes from the id, so one id always
 * gives the same token. Server only: URL_ID_KEY must never reach the browser.
 */

/**
 * Relation names (keys with no `id` in them) this app's routes return: key ->
 * [holds a list of ids, the kind of id]. A to-many name holds a list
 * ("tickets": 5 is a count), and a key holds only its kind of id (our
 * products have uuids, so a number under `product_id` is the shop's).
 */
const RELATIONS: Record<string, [boolean, "int" | "uuid"]> = {
  customer: [false, "int"],
  store: [false, "int"],
  thread: [false, "uuid"],
  thread_id: [false, "uuid"],
  before_thread_id: [false, "uuid"],
  product_id: [false, "uuid"],
  chat_handler_user: [false, "int"],
  preset: [false, "int"],
  category: [false, "int"],
  tags: [true, "int"],
  word_replacements: [true, "int"],
  products: [true, "uuid"],
  related_products: [true, "uuid"],
};

/** Id-looking keys that hold other things (with any key with "external"). */
const NOT_ID_KEYS = new Set(["variant_id", "order"]);

/** JSON column names: the shops' own data, so only `JSON_ID_KEYS` in them. */
const JSON_KEYS = new Set([
  "metadata",
  "json_content",
  "billing_address",
  "shipping_address",
  "shipping_lines",
  "fulfillments",
  "refunds",
  "line_items",
  "discount_codes",
  "note_attributes",
  "payment_details",
  "raw_data",
  "initial_cart_data",
  "updated_cart_data",
  "viewed_products",
]);

/** Our ids inside JSON columns: one id, or records whose `id` is ours. */
const JSON_ID_KEYS: Record<string, "one" | "records"> = {
  knowledge_id: "one",
  similar_tickets: "records",
};

const TOKEN_RE = /^id_[A-Za-z0-9_-]{40,400}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** A handover's chat marker id: "<assignment id>-joined". */
const MARKER_ID_RE = /^(\d+)-([a-z_]+)$/;
const AAD = Buffer.from("store-signal-public-id");

const keys = () => {
  const secret = process.env.URL_ID_KEY;
  if (!secret) throw new Error("URL_ID_KEY is not set.");
  return {
    enc: createHash("sha256").update(`url-id-enc:${secret}`).digest(),
    iv: createHash("sha256").update(`url-id-iv:${secret}`).digest(),
  };
};

/** Whether a value can be an id of that kind (either kind when undefined). */
const isIdValue = (value: unknown, kind?: "int" | "uuid") =>
  (typeof value === "number" && Number.isInteger(value) && kind !== "uuid") ||
  (typeof value === "string" && UUID_RE.test(value) && kind !== "int");

/** The token for an id (an integer or a uuid); anything else as is. */
export function encode<T>(value: T): T | string {
  if (!isIdValue(value)) return value;
  const text = Buffer.from(
    typeof value === "number"
      ? `i:${value}`
      : `u:${String(value).toLowerCase()}`,
  );
  const key = keys();
  const iv = createHmac("sha256", key.iv).update(text).digest().subarray(0, 12);
  const cipher = createCipheriv("aes-256-gcm", key.enc, iv);
  cipher.setAAD(AAD);
  const data = Buffer.concat([cipher.update(text), cipher.final()]);
  const body = Buffer.concat([iv, data, cipher.getAuthTag()]);
  return `id_${body.toString("base64url")}`;
}

/** Whether a value is shaped like a token (valid or not). */
export const isToken = (value: unknown): value is string =>
  typeof value === "string" && TOKEN_RE.test(value);

/** The id inside a token (a number or a uuid), or null when it is not ours. */
export function decode(token: string): number | string | null {
  if (!isToken(token)) return null;
  const data = Buffer.from(token.slice(3), "base64url");
  if (data.length < 29) return null;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      keys().enc,
      data.subarray(0, 12),
    );
    decipher.setAAD(AAD);
    decipher.setAuthTag(data.subarray(-16));
    const text = Buffer.concat([
      decipher.update(data.subarray(12, -16)),
      decipher.final(),
    ]).toString();
    return text.startsWith("i:") ? Number(text.slice(2)) : text.slice(2);
  } catch {
    return null;
  }
}

/** The id behind a token, or the value itself when it is not one. */
export const toRawId = (value: unknown) =>
  isToken(value) ? (decode(value) ?? value) : value;

export class InvalidToken extends Error {}

/** A text value (or a comma-separated list) with each token as its id. */
function decodeText(value: string): string {
  return value
    .split(",")
    .map((part) => {
      if (!isToken(part)) return part;
      const id = decode(part);
      if (id === null) throw new InvalidToken(part);
      return String(id);
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

/** Whether a key's value is one of our ids (a list of them, to-many). */
function isId(key: string, value: unknown): boolean {
  if (NOT_ID_KEYS.has(key) || key.includes("external")) return false;
  let many: boolean;
  let kind: "int" | "uuid" | undefined;
  if (RELATIONS[key]) [many, kind] = RELATIONS[key];
  else if (key === "id" || key.endsWith("_id")) many = false;
  else if (key.endsWith("_ids")) many = true;
  else return false;
  return many
    ? Array.isArray(value) && value.every((x) => isIdValue(x, kind))
    : isIdValue(value, kind);
}

/** A JSON column's content with only `JSON_ID_KEYS` encoded. */
function encodeJson(value: unknown, key?: string): unknown {
  if (Array.isArray(value)) return value.map((v) => encodeJson(v, key));
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    const ours =
      (k === "id" && key !== undefined && JSON_ID_KEYS[key] === "records") ||
      JSON_ID_KEYS[k] === "one";
    out[k] = ours ? encode(v) : encodeJson(v, k);
  }
  return out;
}

/** A response body with every id as a token. */
export function encodeData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(encodeData);
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    const marker =
      k === "id" && typeof v === "string" ? MARKER_ID_RE.exec(v) : null;
    if (marker && record.type === "handler_event") {
      out[k] = `${encode(Number(marker[1]))}-${marker[2]}`;
    } else if (JSON_KEYS.has(k)) {
      out[k] = encodeJson(v);
    } else if (isId(k, v)) {
      out[k] = Array.isArray(v) ? v.map(encode) : encode(v);
    } else {
      out[k] = encodeData(v);
    }
  }
  return out;
}

/** Page routes whose path carries a record id. */
const PAGE_PATHS = [
  /^\/crm\/customers\/([^/]+)/,
  /^\/crm\/orders\/([^/]+)/,
  /^\/threads\/([^/]+)/,
  /^\/knowledge\/(?:items|articles)\/([^/]+)/,
  /^\/campaign\/campaigns\/([^/]+)/,
  /^\/campaign\/segments\/([^/]+)/,
  /^\/campaign\/email-templates\/([^/]+)/,
  /^\/campaign\/whatsapp-templates\/([^/]+)/,
];
/** Page query params that carry a record id: page -> params. */
const PAGE_PARAMS: Record<string, string[]> = {
  "/helpdesk": ["ticket"],
  "/support": ["chat"],
  "/crm/orders": ["customer"],
  "/threads": ["before_thread_id"],
};

/** Whether URL text is a real id: digits or a uuid. */
const isRawId = (text: string) => /^\d+$/.test(text) || UUID_RE.test(text);
/** URL text as an id: digits are a number, a uuid stays text. */
const toId = (text: string) => (/^\d+$/.test(text) ? Number(text) : text);

/**
 * How a page URL's ids check out: `"ok"`; `"not-found"` when its path holds a
 * token that is not ours; or the URL to send the browser to instead, with its
 * real ids (e.g. from an email link) swapped for tokens and its bad tokens in
 * query params dropped.
 */
export function checkPageUrl(
  pathname: string,
  params: URLSearchParams,
): "ok" | "not-found" | { redirect: string } {
  let path = pathname;
  for (const re of PAGE_PATHS) {
    const segment = re.exec(pathname)?.[1];
    if (segment === undefined) continue;
    const value = decodeURIComponent(segment);
    if (isToken(value)) {
      if (decode(value) === null) return "not-found";
    } else if (isRawId(value)) {
      path = path.replace(segment, String(encode(toId(value))));
    }
  }
  const query = new URLSearchParams(params);
  for (const param of PAGE_PARAMS[pathname.replace(/\/+$/, "") || "/"] ?? []) {
    const value = params.get(param);
    if (value === null) continue;
    if (isToken(value)) {
      if (decode(value) === null) query.delete(param);
    } else if (isRawId(value)) {
      query.set(param, String(encode(toId(value))));
    }
  }
  const search = query.toString();
  if (path === pathname && search === params.toString()) return "ok";
  return { redirect: search ? `${path}?${search}` : path };
}
