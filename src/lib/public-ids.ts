import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
} from "node:crypto";

/**
 * Encrypted public ids — this app's half of the backend's `core/public_ids.py`,
 * and it must stay in step with it.
 *
 * No API caller sees a database id: every record id travels as an encrypted
 * token, `id_…`. Django swaps them at its boundary (PublicIdMiddleware); this
 * module does the same for this app's own boundary: the `/api` routes
 * (`withTenantRoute`), the page URLs (`proxy.ts`) and the session.
 *
 * A token is `id_<base64url(IV + ciphertext + tag)>`: the text
 * `"<model label>:<id>"` (e.g. `"support.SupportTicket:31"`) encrypted with
 * AES-256-GCM under URL_ID_KEY. Without the key it cannot be read or forged,
 * and the record type sealed inside it stops a ticket's token from being used
 * as a customer's id.
 *
 * The model labels must be Django's (`app.Model`), so a record gets the same
 * token from this app as from Django. `NAMES` lists the id keys this app's
 * routes return or read; add one when a route starts returning a new id key.
 *
 * Server only: URL_ID_KEY must never reach the browser.
 */

/**
 * The id keys this app's `/api` routes return or read: key -> [model label,
 * holds many records]. Keys whose model depends on the route are in `ROUTES`.
 */
const NAMES: Record<string, [string, boolean]> = {
  customer: ["chat.Customer", false],
  chat_handler_user: ["auth.User", false],
  assignee: ["auth.User", false],
  store: ["store.Store", false],
  thread: ["chat.Thread", false],
  thread_id: ["chat.Thread", false],
  before_thread_id: ["chat.Thread", false],
  tags: ["support.TicketTag", true],
  preset: ["core.TonePreset", false],
  word_replacements: ["chat.WordReplacement", true],
};

const TOKEN_RE = /^id_([A-Za-z0-9_-]{40,400})$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Authenticated with every token (same as the backend's AAD). */
const AAD = Buffer.from("store-signal-public-id");
/** How deep the walk goes into nested data before leaving the rest as is. */
const MAX_DEPTH = 12;

const keys = () => {
  const secret = process.env.URL_ID_KEY;
  if (!secret) throw new Error("URL_ID_KEY is not set.");
  return {
    enc: createHash("sha256").update(`url-id-enc:${secret}`).digest(),
    iv: createHash("sha256").update(`url-id-iv:${secret}`).digest(),
  };
};

/** Whether a value has the shape of a primary key: an integer or a uuid. */
const isId = (value: unknown) =>
  (typeof value === "number" && Number.isInteger(value)) ||
  (typeof value === "string" && UUID_RE.test(value));

/**
 * The token for a record id. The IV is an HMAC of the plaintext, so one id
 * always gives the same token. A value that is not an id of that model (null,
 * a name, a count) is returned as is.
 */
export function encode<T>(label: string, value: T): T | string {
  if (!isId(value)) return value;
  const key = keys();
  const plaintext = Buffer.from(`${label}:${String(value)}`);
  const iv = createHmac("sha256", key.iv)
    .update(plaintext)
    .digest()
    .subarray(0, 12);
  const cipher = createCipheriv("aes-256-gcm", key.enc, iv);
  cipher.setAAD(AAD);
  const data = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const body = Buffer.concat([iv, data, cipher.getAuthTag()]);
  return `id_${body.toString("base64url")}`;
}

/** Whether a value is shaped like a token (valid or not). */
export const isToken = (value: unknown): value is string =>
  typeof value === "string" && TOKEN_RE.test(value);

/**
 * The record inside a token: its model label and id (a number for integer
 * keys, a string for the rest). Null when the token is malformed, tampered
 * with or made with another key.
 */
export function decode(
  token: string,
): { label: string; id: number | string } | null {
  const match = TOKEN_RE.exec(token);
  if (!match) return null;
  const data = Buffer.from(match[1], "base64url");
  // Strict: re-encoding must give the same text, so each id has one token.
  if (data.toString("base64url") !== match[1] || data.length < 29) return null;
  let plaintext: string;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      keys().enc,
      data.subarray(0, 12),
    );
    decipher.setAAD(AAD);
    decipher.setAuthTag(data.subarray(-16));
    plaintext = Buffer.concat([
      decipher.update(data.subarray(12, -16)),
      decipher.final(),
    ]).toString();
  } catch {
    return null;
  }
  const split = plaintext.indexOf(":");
  const label = plaintext.slice(0, split);
  const raw = plaintext.slice(split + 1);
  if (split < 1) return null;
  // Integer keys come back as numbers, uuids as strings (as in Django).
  if (/^\d+$/.test(raw)) return { label, id: Number(raw) };
  return UUID_RE.test(raw) ? { label, id: raw } : null;
}

/** Whether a string is a valid token of that model. */
export const isTokenOf = (label: string, value: string) =>
  decode(value)?.label === label;

/** The real id behind a token, or the value itself when it is not one. */
export const toRawId = (value: unknown) =>
  isToken(value) ? (decode(value)?.id ?? value) : value;

export class InvalidToken extends Error {}

/** The model a key or parameter name holds ids of, when it says so. */
const expectedLabel = (name: string) => NAMES[name]?.[0];

/**
 * A query value or path parameter (or a comma-separated list of them) with
 * each token replaced by its id, checked to be of the model `name` holds.
 */
function decodeText(value: string, name: string): string {
  const expected = expectedLabel(name);
  return value
    .split(",")
    .map((part) => {
      if (!TOKEN_RE.test(part)) return part;
      const decoded = decode(part);
      if (!decoded || (expected && decoded.label !== expected)) {
        throw new InvalidToken(part);
      }
      return String(decoded.id);
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
      ? value.map((v) => decodeText(v, key))
      : value === undefined
        ? value
        : decodeText(value, key);
  }
  return out;
}

type Json = unknown;
/** Key -> model label, for names a route's data uses that the models cannot tell. */
type KeyHints = Record<string, string>;

/**
 * Encode the ids in a payload, found from the relation names (the mirror of
 * the backend's `walk_plain`): a record's `id` when its model is known (from
 * its key, a route hint, or `ownLabel`), a single id under a singular
 * relation name, a list of ids under a to-many one.
 */
function walk(
  value: Json,
  key: string | null,
  depth: number,
  hints: KeyHints,
  ownLabel?: string,
): Json {
  if (depth > MAX_DEPTH) return value;
  if (Array.isArray(value)) {
    return value.map((v) => walk(v, key, depth + 1, hints, ownLabel));
  }
  if (!value || typeof value !== "object") return value;
  const label =
    ownLabel ?? (key ? (hints[key] ?? expectedLabel(key)) : undefined);
  const out: Record<string, Json> = {};
  for (const [k, v] of Object.entries(value as Record<string, Json>)) {
    const relation = hints[k] ? undefined : NAMES[k];
    if (k === "id" && label) {
      out[k] = encode(label, v);
    } else if (relation && (v === null || typeof v !== "object")) {
      // A single id, e.g. "customer": 5 — never under a to-many name
      // ("tickets": 5 is a count, not an id).
      out[k] = relation[1] ? v : encode(relation[0], v);
    } else if (
      relation?.[1] &&
      Array.isArray(v) &&
      v.every((x) => x === null || typeof x !== "object")
    ) {
      out[k] = v.map((x) => encode(relation[0], x)); // "tags": [1, 2]
    } else {
      out[k] = walk(v, k, depth + 1, hints);
    }
  }
  return out;
}

/**
 * The records each `/api` route returns (its `data`, each item of a `data`
 * list, or of `data.results`), and the hints for the ambiguous key names in
 * them — the mirror of what Django's views and serializers tell its
 * middleware.
 */
const ROUTES: [RegExp, { record?: string; hints?: KeyHints }][] = [
  [/^\/api\/analytics\/chat-history\/?$/, { record: "chat.ChatHistory" }],
  [/^\/api\/analytics\/threads\/?$/, { record: "chat.Thread" }],
  [/^\/api\/analytics\/threads\/tags\/?$/, { record: "support.TicketTag" }],
  [
    /^\/api\/analytics\/threads\/[^/]+\/?$/,
    { record: "chat.Thread", hints: { messages: "chat.ChatHistory" } },
  ],
  [
    /^\/api\/analytics\/threads\/[^/]+\/order-data\/?$/,
    { record: "chat.CustomerOrder" },
  ],
  [
    /^\/api\/analytics\/threads\/[^/]+\/user-metadata\/?$/,
    { record: "analytics.UserMetadata" },
  ],
  [
    /^\/api\/analytics\/threads\/[^/]+\/ai-insights\/?$/,
    { record: "analytics.AiInsights" },
  ],
  [
    /^\/api\/analytics\/threads\/[^/]+\/feedback-sequence\/?$/,
    { hints: { feedback: "chat.ChatbotFeedback" } },
  ],
  [
    /^\/api\/support\/threads\/[^/]+\/tickets\/?$/,
    { record: "support.SupportTicket" },
  ],
  [/^\/api\/store\/list\/?$/, { record: "store.Store" }],
  [/^\/api\/chat\/tone-presets\/?$/, { record: "core.TonePreset" }],
  [/^\/api\/chat\/vocabulary-presets\/?$/, { record: "core.VocabularyPreset" }],
  [
    /^\/api\/chat\/never-say-rules-presets\/?$/,
    { record: "core.NeverSayRulesPreset" },
  ],
  [/^\/api\/chat\/vocabulary\/?$/, { record: "chat.Vocabulary" }],
  [/^\/api\/chat\/tone-style\/?$/, { record: "chat.ToneStyle" }],
  [/^\/api\/chat\/persona-identity\/?$/, { record: "chat.PersonaIdentity" }],
  [/^\/api\/chat\/never-say-rules\/?$/, { record: "chat.NeverSayRules" }],
  [
    /^\/api\/integrations\/?$/,
    {
      record: "core.Integration",
      hints: {
        category: "core.IntegrationCategory",
        attributes: "core.IntegrationAttribute",
      },
    },
  ],
];

/** An `/api` route's response body with every record id as a token. */
export function encodeResponse(path: string, body: Json): Json {
  const pathname = path.split("?")[0];
  const route = ROUTES.find(([re]) => re.test(pathname))?.[1] ?? {};
  const hints = route.hints ?? {};
  if (!body || typeof body !== "object" || !("data" in body)) {
    return walk(body, null, 0, hints);
  }
  const { data, ...rest } = body as { data: Json };
  const record = route.record;
  let encoded: Json;
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    Array.isArray((data as { results?: unknown }).results)
  ) {
    // A page: {count, …, results: […]}.
    const page = walk(data, null, 1, hints) as Record<string, Json>;
    page.results = walk(
      (data as { results: Json }).results,
      null,
      1,
      hints,
      record,
    );
    encoded = page;
  } else {
    encoded = walk(data, null, 1, hints, record);
  }
  return { ...(walk(rest, null, 0, hints) as object), data: encoded };
}

/** Page routes whose path carries a record's token: pattern -> its model. */
const PAGE_PATHS: [RegExp, string][] = [
  [/^\/crm\/customers\/([^/]+)/, "chat.Customer"],
  [/^\/crm\/orders\/([^/]+)/, "chat.CustomerOrder"],
  [/^\/threads\/([^/]+)/, "chat.Thread"],
  [/^\/knowledge\/(?:items|articles)\/([^/]+)/, "knowledge.KnowledgeItem"],
  [/^\/campaign\/campaigns\/([^/]+)/, "campaign.Campaign"],
  [/^\/campaign\/segments\/([^/]+)/, "campaign.Segment"],
  [/^\/campaign\/email-templates\/([^/]+)/, "campaign.EmailTemplate"],
  [/^\/campaign\/whatsapp-templates\/([^/]+)/, "campaign.WhatsAppTemplate"],
];
/** Page query params that carry a record's token: page -> param -> model. */
const PAGE_PARAMS: Record<string, Record<string, string>> = {
  "/helpdesk": { ticket: "support.SupportTicket" },
  "/support": { chat: "chat.Thread" },
  "/crm/orders": { customer: "chat.Customer" },
  "/threads": { before_thread_id: "chat.Thread" },
};
/** Segments under those prefixes that are pages of their own, not records. */
const NOT_RECORDS = new Set(["new", "create"]);

/**
 * How a page URL's record tokens check out: `"ok"`, `"not-found"` when the
 * path's record is not a valid token of its model (a raw id included), or the
 * query params to drop because they are not.
 */
export function checkPageUrl(
  pathname: string,
  params: URLSearchParams,
): "ok" | "not-found" | { drop: string[] } {
  for (const [re, label] of PAGE_PATHS) {
    const segment = re.exec(pathname)?.[1];
    if (segment === undefined || NOT_RECORDS.has(segment)) continue;
    if (!isTokenOf(label, decodeURIComponent(segment))) return "not-found";
  }
  const page = pathname.replace(/\/+$/, "") || "/";
  const drop = Object.entries(PAGE_PARAMS[page] ?? {})
    .filter(([param, label]) => {
      const value = params.get(param);
      return value !== null && !isTokenOf(label, value);
    })
    .map(([param]) => param);
  return drop.length ? { drop } : "ok";
}
