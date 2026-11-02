/**
 * Screens switched off for now: gone from the nav (see NAV_AREAS) and not
 * reachable by typing the URL either.
 *
 * Read by the proxy. Re-enabling a screen is removing its prefix here and
 * uncommenting its entry in NAV_AREAS / sidebar-navs.
 */
const DISABLED_PREFIXES = ["/campaign"];

export function isDisabledRoute(pathname: string): boolean {
  return DISABLED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
