import type { NextApiResponse } from "next";

import { APIResponse, ErrorResponse, PaginationResponse } from "@/lib/config";

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
