import type { NextApiResponse } from "next";

import {
  APIResponse,
  ErrorResponse,
  PaginationResponse,
  WIDGET_API_BASE,
  WIDGET_SCRIPT_SRC,
} from "@/lib/config";

export const formatDateTime = (dateInput: string | null) => {
  if (!dateInput || dateInput === "-") return "-";
  return new Date(dateInput).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Short relative time e.g. "3m", "2h", "5d", "3w", "2mo" — used by chat/thread
// lists where absolute timestamps would be too wide to fit.
export const formatRelativeTime = (value: string | null | undefined) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w`;

  return `${Math.max(1, Math.floor(diffDays / 30))}mo`;
};

export const getDuration = (start: string | null, end: string | null) => {
  if (!start || !end || start === "-" || end === "-") return "-";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (diff < 0) return "-";
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

// Utility function to create paginated API responses
export const createPaginatedResponse = (
  url: string,
  count: number,
  currentPage: number,
  pageSize: number,
  results: object[],
): PaginationResponse => {
  const totalPages = Math.ceil(count / pageSize);
  const next =
    currentPage < totalPages ? `${url}?page=${currentPage + 1}` : null;
  const previous = currentPage > 1 ? `${url}?page=${currentPage - 1}` : null;

  return {
    count,
    next,
    previous,
    results,
  };
};

// Utility function to create standardized API responses
export const createAPIResponse = (
  success: boolean,
  message: string = "",
  data: object | object[] | PaginationResponse | ErrorResponse | null = null,
): APIResponse => {
  return { success, message, data };
};

/**
 * Log an unexpected API error server-side and return a generic 500 to the
 * client. DB/driver errors (Drizzle/pg) embed the SQL text and bind params in
 * their message — that MUST NOT reach the client (information disclosure). The
 * full error is logged here; the client only ever sees "Internal server error".
 */
export const handleApiError = (
  res: NextApiResponse,
  err: unknown,
  context: string = "api",
): void => {
  console.error(`[${context}] request failed:`, err);
  if (!res.headersSent) {
    res
      .status(500)
      .json(createAPIResponse(false, "Internal server error", null));
  }
};

/* Utility function to convert time values into a human-readable format. 
It takes a numeric value and its corresponding unit (either "seconds" or "minutes") and formats it accordingly. 
For example, 
if the input is 90 seconds, it will return "1m 30s". 
If the input is 120 minutes, it will return "2h". 
This function is particularly useful for displaying average handle times in a more user-friendly way on the dashboard. */
export const custructTimeInHumanReadableFormat = (
  value: number,
  unit: "seconds" | "minutes" | undefined,
) => {
  if (unit === "seconds") {
    if (value < 60) return `${value}s`;
    const minutes = Math.floor(value / 60);
    const seconds = Math.round(value % 60);
    return `${minutes}m${seconds > 0 ? ` ${seconds}s` : ""}`;
  } else if (unit === "minutes") {
    if (value < 60) return `${value}m`;
    const hours = Math.floor(value / 60);
    const minutes = Math.round(value % 60);
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`;
  }
  return `${value}m`;
};

/**
 * Format a date/time value as a compact relative time string.
 *
 * Examples:
 * - 5m
 * - 2h
 * - 3d
 * - 1w
 * - 2mo
 *
 * Returns an em dash (`—`) if the input is null, undefined, or an invalid date.
 *
 * @param value - ISO date string or other valid date string.
 * @returns A compact relative time representation.
 */
export function formatRelativeDateTime(
  value: string | null | undefined,
): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w`;

  return `${Math.max(1, Math.floor(diffDays / 30))}mo`;
}

/**
 * Converts a string to title case by capitalizing the first letter of
 * each word. Also converts snake_case and kebab-case to spaced words.
 *
 * @param value The string to format.
 * @returns The formatted string.
 *
 * @example
 * capitalizeText("active");
 * // "Active"
 *
 * @example
 * capitalizeText("payment_failed");
 * // "Payment Failed"
 *
 * @example
 * capitalizeText("exchange-request");
 * // "Exchange Request"
 */
export function capitalizeText(value: string): string {
  if (!value) return "";

  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Format an amount with its currency, e.g. "3850.00" → "$3,850.00".
 *
 * Amounts arrive as strings from DRF (DecimalField) and as numbers from the
 * platform payloads, so both are accepted.
 */
export function formatPrice(
  value: string | number | null | undefined,
  currency = "USD",
): string {
  if (value === null || value === undefined || value === "") return "—";
  const amount = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(amount)) return String(value);

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      // Without this, some locales render USD as "US$" instead of "$" to
      // disambiguate from their own local currency — narrowSymbol forces
      // the plain symbol regardless of locale.
      currencyDisplay: "narrowSymbol",
    }).format(amount);
  } catch {
    // Unrecognized currency code — fall back to plain formatting.
    return `${value} ${currency}`;
  }
}

/**
 * Date without a time, e.g. "8 Aug 2026".
 *
 * Normalizes before parsing: Date.parse needs the "T" separator instead of
 * a space, and rejects bare-hour offsets like "+00" unless minutes are
 * appended ("+00:00") — both shapes arrive from the commerce platforms.
 */
export function formatDate(value: string): string {
  // Normalize before parsing: Date.parse needs the "T" separator instead of
  // a space, and rejects bare-hour offsets like "+00" unless minutes are
  // appended ("+00:00").
  const date = new Date(
    value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"),
  );
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Midnight at the start of `value`'s day, as an ISO instant. */
export function startOfDay(value: string) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

/**
 * The last instant of `value`'s day, so a date range's end day is included.
 * Without it, "up to today" stops at midnight and hides everything that
 * happened today.
 */
export function endOfDay(value: string) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

/**
 * Coerce a list response into the paginated shape the tables expect.
 *
 * The Django routes are not uniform: some wrap their payload in a `data`
 * envelope and some return DRF's pagination object directly, and an
 * unpaginated endpoint can answer with a bare array. Reading `results` off
 * the wrong one yields undefined, which reaches the table as undefined rows
 * and takes the page down.
 *
 * Normalising in one place means a screen shows an empty table when the
 * shape is unexpected, instead of crashing — and the caller keeps one type.
 */
export function toPaginatedList<T>(payload: unknown): {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
} {
  const empty = { count: 0, next: null, previous: null, results: [] as T[] };
  if (!payload) return empty;

  // A bare array: everything there is, on one page.
  if (Array.isArray(payload)) {
    return { ...empty, count: payload.length, results: payload as T[] };
  }

  if (typeof payload !== "object") return empty;

  const record = payload as Record<string, unknown>;
  const results = Array.isArray(record.results)
    ? (record.results as T[])
    : Array.isArray(record.data)
      ? (record.data as T[])
      : [];

  return {
    count: typeof record.count === "number" ? record.count : results.length,
    next: typeof record.next === "string" ? record.next : null,
    previous: typeof record.previous === "string" ? record.previous : null,
    results,
  };
}

// Tells the widget who is browsing: Shopify's Liquid exposes the logged-in
// customer, and the widget reads window.currentCustomer / window.isLoggedIn.
const SHOPIFY_CUSTOMER_BLOCK = `{% if customer %}
  <script>
    window.currentCustomer = {
      id: "{{ customer.id }}",
      email: "{{ customer.email }}",
      firstName: "{{ customer.first_name }}",
      lastName: "{{ customer.last_name }}",
      fullName: "{{ customer.name }}",
    };
    window.isLoggedIn = true;
  </script>
{% else %}
  <script>
    window.currentCustomer = null;
    window.isLoggedIn = false;
  </script>
{% endif %}`;

/**
 * The embed code a merchant pastes before </body>, for one store's widget
 * key. On Shopify it is Liquid — the customer block above plus the script
 * tag, destined for the end of layout/theme.liquid; on any other platform
 * it is the bare script tag.
 */
export function widgetSnippet(widgetKey: string, platform?: string): string {
  const tag = [
    "<script",
    `  src="${WIDGET_SCRIPT_SRC}"`,
    `  data-widget-key="${widgetKey}"`,
    `  data-api-base="${WIDGET_API_BASE}"`,
    "  data-chatbot-init",
    "></script>",
  ].join("\n");
  return platform === "shopify" ? `${SHOPIFY_CUSTOMER_BLOCK}\n${tag}` : tag;
}
