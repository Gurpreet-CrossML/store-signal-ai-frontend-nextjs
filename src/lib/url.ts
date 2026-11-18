/** URL helpers: chatbot quick links, and the "website or page links" field of
 * the Add knowledge screen. */

import { KNOWLEDGE_URL_MAX_LENGTH } from "@/lib/config";

/** Prefixes a bare host with https:// so "example.com" becomes a valid URL. */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** True when `value` (after normalisation) is a valid http/https URL. */
export function isValidUrl(value: string): boolean {
  const normalized = normalizeUrl(value);
  if (!normalized) return false;
  try {
    const url = new URL(normalized);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Stricter than `isValidUrl`, for addresses we'll fetch: the host must be a
 * real domain (with a TLD, e.g. `company.com`) or an IPv4 address. Plain words
 * like "AGENT" pass `isValidUrl` because a scheme gets prepended to them. */
export function isValidWebsiteUrl(value: string): boolean {
  if (!isValidUrl(value)) return false;
  const { hostname } = new URL(normalizeUrl(value));
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true;
  return /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+([a-z]{2,63}|xn--[a-z0-9-]{1,59})$/i.test(
    hostname,
  );
}

/** True only for a complete http/https URL. Unlike isValidUrl, it adds no scheme. */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Takes the spaces and tabs out of typed text. Addresses never contain them;
 * several are told apart by a new line (or a comma). */
export function stripUrlSpaces(value: string): string {
  return value.replace(/[^\S\r\n]+/g, "");
}

/** Pasted text with each run of spaces turned into a new line, so a list
 * pasted as "a.com/x b.com/y" becomes one address per line instead of one
 * glued-together address. */
export function spacesToNewLines(value: string): string {
  return value.trim().replace(/\s+/g, "\n");
}

/** A site's own address ("https://crossml.in"), as opposed to one of its
 * pages: no path, query or fragment. */
export function isSiteAddress(url: string): boolean {
  try {
    const { pathname, search, hash } = new URL(url);
    return (pathname === "/" || pathname === "") && !search && !hash;
  } catch {
    return false;
  }
}

/** Whether the address carries a login ("https://user:pass@host"), which is
 * never a page to read. It is also what "mailto:a@b.com" turns into once
 * "https://" is put in front of it. */
function hasCredentials(url: string): boolean {
  const { username, password } = new URL(url);
  return Boolean(username || password);
}

/** What identifies a page, so the same one typed twice (different case, a
 * trailing slash, a fragment) is only added once. */
function pageKey(url: string): string {
  const { protocol, host, pathname, search } = new URL(url);
  return `${protocol}//${host.toLowerCase()}${pathname.replace(/\/+$/, "")}${search}`;
}

export type ParsedUrlList = {
  /** The addresses, normalised (with https:// if none was typed), once each. */
  urls: string[];
  /** The pieces that aren't a usable web address. */
  invalid: string[];
  /** Addresses typed more than once (as first written), each listed once. */
  duplicates: string[];
};

/** Splits the field into addresses: one per line, or comma-separated. */
export function parseUrlList(text: string): ParsedUrlList {
  const urls: string[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];
  const seen = new Map<string, string>();

  for (const piece of text.split(/[\r\n,;]+/)) {
    const token = piece.trim();
    if (!token) continue;
    if (
      /\s/.test(token) ||
      token.length > KNOWLEDGE_URL_MAX_LENGTH ||
      !isValidWebsiteUrl(token)
    ) {
      invalid.push(token);
      continue;
    }
    const url = normalizeUrl(token);
    if (hasCredentials(url)) {
      invalid.push(token);
      continue;
    }
    const key = pageKey(url);
    const first = seen.get(key);
    if (first !== undefined) {
      if (!duplicates.includes(first)) duplicates.push(first);
      continue;
    }
    seen.set(key, url);
    urls.push(url);
  }
  return { urls, invalid, duplicates };
}

/** What is wrong with the field, if anything. `null` when it is empty or
 * holds either one site address or only distinct page addresses. */
export function urlListProblem(
  parsed: ParsedUrlList,
  maxPages: number,
): string | null {
  if (parsed.invalid.length > 0) {
    const shown = parsed.invalid.slice(0, 3).join(", ");
    return `This doesn't look like a web address: ${shown}${
      parsed.invalid.length > 3 ? "…" : ""
    }`;
  }
  if (parsed.duplicates.length > 0) {
    const shown = parsed.duplicates.slice(0, 3).join(", ");
    return `This link is entered more than once: ${shown}${
      parsed.duplicates.length > 3 ? "…" : ""
    }. Each link can only be added once.`;
  }
  if (parsed.urls.length > 1 && parsed.urls.some(isSiteAddress)) {
    return "Enter one website address to scan it, or links to specific pages. They can't be mixed.";
  }
  if (parsed.urls.length > maxPages) {
    return `You can add up to ${maxPages} pages at a time`;
  }
  return null;
}

export function getAbsoluteS3Url(key: string): string {
  const awsStorageBucketName = process.env.NEXT_AWS_STORAGE_BUCKET_NAME;
  const awsRegion = process.env.NEXT_AWS_REGION;
  return `https://${awsStorageBucketName}.s3.${awsRegion}.amazonaws.com/${key}`;
}
