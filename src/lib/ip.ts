/**
 * IP validation for the store's allow-list.
 *
 * The list is matched against the public address a visitor's browser
 * arrives from, so a private or loopback address can never match one and is
 * rejected at entry rather than silently doing nothing.
 */

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function ipv4Octets(value: string): number[] | null {
  const match = value.match(IPV4);
  if (!match) return null;
  const octets = match.slice(1, 5).map(Number);
  // Reject 1.2.3.256 and leading-zero forms like 010.1.1.1, which some
  // parsers read as octal.
  if (octets.some((octet) => octet > 255)) return null;
  if (match.slice(1, 5).some((part) => part.length > 1 && part[0] === "0")) {
    return null;
  }
  return octets;
}

/** Loose IPv6 check — enough to catch typos without re-implementing RFC 4291. */
function isIpv6(value: string): boolean {
  if (!value.includes(":")) return false;
  if (!/^[0-9a-f:]+$/i.test(value)) return false;
  // At most one "::" run, and no more than 8 groups.
  if ((value.match(/::/g) ?? []).length > 1) return false;
  return value.split(":").filter(Boolean).length <= 8;
}

export function isValidIp(value: string): boolean {
  return ipv4Octets(value) !== null || isIpv6(value);
}

/**
 * True for addresses that can't reach us from the open internet: RFC 1918
 * private ranges, loopback, link-local, and the IPv6 equivalents.
 */
export function isPrivateIp(value: string): boolean {
  const octets = ipv4Octets(value);
  if (octets) {
    const [a, b] = octets;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }

  const lower = value.toLowerCase();
  // ::1 loopback, fc00::/7 unique-local, fe80::/10 link-local.
  return (
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe8") ||
    lower.startsWith("fe9") ||
    lower.startsWith("fea") ||
    lower.startsWith("feb")
  );
}

/** Why an address can't be added, or null when it's fine. */
export function describeIpProblem(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Enter an IP address.";
  if (!isValidIp(trimmed)) return `"${trimmed}" isn't a valid IP address.`;
  if (isPrivateIp(trimmed)) {
    return `${trimmed} is a private address — visitors reach us from a public IP, so it would never match.`;
  }
  return null;
}

/**
 * Canonical form for comparison. IPv6 is case-insensitive, so 2001:DB8::1
 * and 2001:db8::1 are the same address and must not both be addable;
 * lowercasing is a no-op for IPv4, which has no letters.
 *
 * This does not expand shorthand — 2001:db8::1 and 2001:0db8:0:0:0:0:0:1
 * are still treated as different entries.
 */
export function normalizeIp(value: string): string {
  return value.trim().toLowerCase();
}

/** Drop repeats, keeping first occurrence and the original spelling. */
export function dedupeIps(ips: string[]): string[] {
  const seen = new Set<string>();
  return ips.filter((ip) => {
    const key = normalizeIp(ip);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Separators a pasted list may use — commas, spaces, semicolons or
 * newlines — so a list copied from anywhere splits into chips.
 */
export const IP_SPLIT_PATTERN = /[\s,;]+/;
