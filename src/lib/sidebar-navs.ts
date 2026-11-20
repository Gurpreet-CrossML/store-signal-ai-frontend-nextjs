import type { ComponentType } from "react";
import {
  IconMessage2,
  IconMessageUser,
  IconDashboard,
  IconBooks,
  type Icon,
} from "@tabler/icons-react";

import { can, type SessionIdentity } from "@/lib/access-rules";
import type { Permission } from "@/lib/tenant-types";
import {
  NAV_AREAS,
  type AreaSection,
  type NavArea,
  type NavAreaKey,
} from "@/lib/nav-areas";

export type SideBarMenuItem = {
  title: string;
  url: string;
  icon: Icon;
  items?: SideBarMenuItem[];
  /** A count shown at the row's right edge, e.g. a view's ticket count. */
  count?: number;
  /** Colours the row's icon, e.g. a tag's own colour. */
  color?: string;
  /** Only the store owner sees it (see AreaSection.ownerOnly). */
  ownerOnly?: boolean;
};

export type SubSidebarMenuItem = {
  title: string;
  icon: Icon;
  items: SideBarMenuItem[];
  action?: ComponentType;
};

export type MainSidebarMenuItem = {
  title: string;
  url: string;
  icon: Icon;
  isExpanded?: boolean; // Optional property to indicate if the item is expanded
  isMenuHeading?: boolean; // Optional property to indicate if the item is a menu heading
  items?: SideBarMenuItem[]; // Optional property for nested items
  subSidebarKey?: string; // Optional property for sub-sidebar key
  /**
   * Path the active check matches against when it differs from `url`.
   * An area's icon lands on its first screen, but must stay lit on every
   * screen of the area — so it matches the area root instead.
   */
  activeBasePath?: string;
  /** Only shown to company admins (is_staff). */
  adminOnly?: boolean;
  /** Shown to roles that may read this permission (see `can`). */
  permission?: Permission;
};

export type SideBarMenus = {
  /**
   * One ordered list rather than a main/admin pair.
   *
   * The two were concatenated, which forced every admin-only entry below
   * every ordinary one — so Help Desk could not sit between Threads and
   * Social AI where it belongs. Order is the order here; who sees an entry
   * is `adminOnly`, which is a separate question.
   */
  nav: MainSidebarMenuItem[];
  navSecondary?: MainSidebarMenuItem[];
  navSubSidebar?: {
    [key: string]: SubSidebarMenuItem;
  };
};

/** A nav url split into the parts that are matched separately. */
function splitHref(url: string) {
  const [path, query = ""] = url.split("?");
  return { path, query };
}

/**
 * Is every param the nav entry names also set, to the same value, in the
 * current query? Extra params in the URL are ignored, so a page number or
 * a search term does not un-highlight the section you are in.
 */
function queryMatches(currentSearch: string, entryQuery: string) {
  const current = new URLSearchParams(currentSearch);
  for (const [key, value] of new URLSearchParams(entryQuery)) {
    if (current.get(key) !== value) return false;
  }
  return true;
}

/**
 * Which of a group of sibling nav entries should be highlighted.
 *
 * Sections are not always separate pages: Help Desk's are query filters on
 * one screen (`/helpdesk?filter=snoozed`). Matching on pathname alone lit
 * "All Inboxes" on every one of them and the others never.
 *
 * The rule is most-specific-wins. An entry carrying a query is active only
 * when all of its params match. A bare-path entry is active for its path
 * and everything under it, but stands down when a sibling's query matches
 * — that sibling is the more specific answer. When several bare paths
 * match, the deepest one wins: on /settings/tags both "General"'s area
 * root and "Help Desk Tags" (/settings/tags) match, and the latter wins.
 *
 * Returns the winning url so callers compare by identity rather than each
 * re-deriving the rule.
 */
export function activeNavUrl(
  items: readonly { url: string }[],
  pathname: string | null,
  search = "",
): string | null {
  if (!pathname) return null;

  const withQuery = items.find((item) => {
    const { path, query } = splitHref(item.url);
    return query !== "" && pathname === path && queryMatches(search, query);
  });
  if (withQuery) return withQuery.url;

  let bare: { url: string; pathLength: number } | null = null;
  for (const item of items) {
    const { path, query } = splitHref(item.url);
    // A group heading has no destination. Its empty path would otherwise
    // match every page, lighting the group (and opening it) everywhere.
    if (!path || query !== "" || !isMenuItemActive(pathname, path)) continue;
    if (!bare || path.length > bare.pathLength) {
      bare = { url: item.url, pathLength: path.length };
    }
  }
  return bare?.url ?? null;
}

/**
 * Every entry in a menu tree, parents included, depth-first.
 *
 * The nav is no longer one level: a section can carry its own screens, and
 * both "which entry is active" and "which sub-sidebar am I in" have to see
 * the leaves, not just the branches.
 */
export function flattenMenuItems(
  items: readonly SideBarMenuItem[],
): SideBarMenuItem[] {
  return items.flatMap((item) => [
    item,
    ...(item.items ? flattenMenuItems(item.items) : []),
  ]);
}

/** Is this entry, or anything beneath it, the one currently open? */
export function isBranchActive(
  item: SideBarMenuItem,
  pathname: string | null,
  search = "",
): boolean {
  const winner = activeNavUrl(flattenMenuItems([item]), pathname, search);
  return winner !== null;
}

/**
 * Which sub-sidebar belongs to a route, if any. Derived from the path
 * rather than tracked on click, so a refresh or a shared deep link opens
 * the same sub-sidebar the click would have.
 */
export function resolveSubSidebarKey(pathname: string | null): string | null {
  if (!pathname) return null;

  const sections = sidebarMenus.nav;
  const section = sections.find(
    (item) => item.subSidebarKey && isMenuItemActive(pathname, item.url),
  );
  if (section?.subSidebarKey) return section.subSidebarKey;

  // A sub-sidebar route that doesn't sit under its section's own path.
  // Compared on the path alone: an entry may carry a query string, which
  // says which section you are in, not which screen.
  for (const [key, items] of Object.entries(sidebarMenus.navSubSidebar ?? {})) {
    // Flattened: a nested screen is as much "in" this area as a top-level
    // one, and only checking the first level lost the sub-sidebar the
    // moment you opened one.
    if (
      flattenMenuItems(items?.items ?? []).some((item) =>
        isMenuItemActive(pathname, splitHref(item.url).path),
      )
    ) {
      return key;
    }
  }

  // An area's own address (it redirects to the area's first screen), which
  // none of the above covers since no section uses it (Settings, Brand Voice).
  const area = Object.entries(NAV_AREAS).find(
    ([, item]) => pathname === item.href,
  );
  return area ? area[0] : null;
}

/**
 * Is `url` the menu entry for the page at `pathname`? A section stays
 * active for everything beneath it, so opening a sub-sidebar page keeps its
 * parent lit. "/" is exact-only — otherwise Dashboard would match the whole
 * app.
 *
 * Path only — an entry's query string is matched separately, by
 * `activeNavUrl`, which knows how siblings compete.
 */
export function isMenuItemActive(pathname: string | null, url: string) {
  if (!pathname) return false;
  if (pathname === url) return true;
  return url !== "/" && pathname.startsWith(`${url}/`);
}

/** The top-level section a path belongs to, including nested routes. */
export function findMenuSectionByPath(pathname: string | null) {
  return sidebarMenus.nav.find((item) => isMenuItemActive(pathname, item.url));
}

/** Depth-first lookup for the menu item at `url`, searching nested `items` at any depth. */
export function findMenuItemByUrl(
  items: MainSidebarMenuItem[],
  url: string | null,
): MainSidebarMenuItem | undefined {
  if (!url) return undefined;

  for (const item of items) {
    if (item.url === url) return item;

    const match = item.items && findMenuItemByUrl(item.items, url);
    if (match) return match;
  }
  return undefined;
}

/**
 * The main-nav entry for an area. Title, icon and screens all come from
 * NAV_AREAS, so a renamed area renames everywhere at once.
 *
 * `url` is where the section's own icon lands you — usually its first
 * screen, since an area with a sub-sidebar lists the rest anyway.
 */
function areaMenuItem(
  key: NavAreaKey,
  {
    adminOnly,
    permission,
    url,
  }: { adminOnly?: boolean; permission?: Permission; url?: string } = {},
): MainSidebarMenuItem {
  return {
    title: NAV_AREAS[key].title,
    url: url ?? NAV_AREAS[key].sections[0].href,
    icon: NAV_AREAS[key].icon,
    subSidebarKey: key,
    ...(adminOnly ? { adminOnly: true } : {}),
    ...(permission ? { permission } : {}),
    // The icon lands on the first screen, but stays lit for the whole
    // area — without this it would unlight on every sibling screen.
    activeBasePath: NAV_AREAS[key].href,
  };
}

/**
 * One section as a menu entry, carrying its children.
 *
 * The nesting is load-bearing: an entry with `items` renders as a
 * collapsible group rather than a link, and dropping them here — as this
 * did — left every section flat however NAV_AREAS described it.
 */
function toMenuItem(section: AreaSection): SideBarMenuItem {
  return {
    title: section.title,
    url: section.href,
    icon: section.icon,
    ...(section.items?.length ? { items: section.items.map(toMenuItem) } : {}),
    ...(section.ownerOnly ? { ownerOnly: true } : {}),
  };
}

/** Every area in NAV_AREAS as a sub-sidebar, keyed by its area key. */
function areaSubSidebars(): Record<string, SubSidebarMenuItem> {
  return Object.fromEntries(
    Object.entries<NavArea>(NAV_AREAS).map(([key, area]) => [
      key,
      {
        title: area.title,
        icon: area.icon,
        items: area.sections.map(toMenuItem),
        ...(area.action ? { action: area.action } : {}),
      },
    ]),
  );
}

export const sidebarMenus: SideBarMenus = {
  nav: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
      permission: "team_metrics",
    },
    {
      title: "Live Support",
      url: "/support",
      icon: IconMessageUser,
      permission: "conversations",
    },
    {
      title: "Threads",
      url: "/threads",
      icon: IconMessage2,
      permission: "conversations",
    },
    areaMenuItem("helpdesk", { permission: "conversations" }),
    // Social AI is admin-only until its roles are decided.
    // areaMenuItem("socialAI", { adminOnly: true }),
    areaMenuItem("crm", { permission: "conversations" }),
    areaMenuItem("campaign", { permission: "marketing" }),
    areaMenuItem("brandVoice", { permission: "setup" }),
    // Lands on the first screen the user may open (see visibleNavItems).
    areaMenuItem("settings", { permission: "setup" }),
    {
      title: "Knowledge",
      url: "/knowledge",
      icon: IconBooks,
      permission: "knowledge",
    },
  ],

  navSubSidebar: {
    // Every area in NAV_AREAS, Help Desk included — adding a screen or a
    // filter there adds it to the sidebar with no change here.
    ...areaSubSidebars(),
  },

  // navSecondary: [
  //   {
  //     title: "Get Help",
  //     url: "#",
  //     icon: IconHelp,
  //   },
  //   {
  //     title: "Search",
  //     url: "#",
  //     icon: IconSearch,
  //   },
  // ],
};

/**
 * May this user see a main-nav entry? The same rule the area's page gate
 * applies, so a visible entry never leads to a locked page.
 */
export function isNavItemVisible(
  item: MainSidebarMenuItem,
  user: SessionIdentity | null | undefined,
): boolean {
  // No permission on an admin-only entry means owner-only, as in `can`.
  if (item.adminOnly) return can(user, undefined);
  if (item.permission) return can(user, item.permission);
  return true;
}

/**
 * May this user open the area whose sub-sidebar is `key`? Uses the area's
 * main-nav entry, so the side menu never shows beside an area's lock screen.
 * An area with no main-nav entry is left to its own page gate.
 */
export function isAreaVisible(
  key: string,
  user: SessionIdentity | null | undefined,
): boolean {
  const item = sidebarMenus.nav.find((entry) => entry.subSidebarKey === key);
  return !item || isNavItemVisible(item, user);
}

/**
 * The sub-sidebar entries this user may see: owner-only screens are dropped
 * for everyone but the store owner.
 */
export function visibleMenuItems(
  items: SideBarMenuItem[],
  user: SessionIdentity | null | undefined,
): SideBarMenuItem[] {
  if (can(user, undefined)) return items;
  return items
    .filter((item) => !item.ownerOnly)
    .map((item) =>
      item.items
        ? { ...item, items: visibleMenuItems(item.items, user) }
        : item,
    );
}

/** Where to send a user whose role cannot open the page they landed on. */
export function firstVisibleNavUrl(
  user: SessionIdentity | null | undefined,
): string | null {
  return visibleNavItems(user)[0]?.url ?? null;
}

/**
 * The first screen of an area this user may open: owner-only screens are
 * skipped for everyone but the store owner (a manager's Settings opens on
 * Staff Management, not General).
 */
export function firstAreaUrl(
  key: string,
  user: SessionIdentity | null | undefined,
): string | null {
  const area = NAV_AREAS[key as NavAreaKey];
  if (!area) return null;
  const isOwner = can(user, undefined);
  const sections: readonly AreaSection[] = area.sections;
  return (
    sections.find((section) => isOwner || !section.ownerOnly)?.href ?? null
  );
}

/**
 * The main-nav entries this user may see, each area landing on the first
 * screen they may open, so an icon never opens an area's menu page or a
 * screen the user is locked out of.
 */
export function visibleNavItems(
  user: SessionIdentity | null | undefined,
): MainSidebarMenuItem[] {
  return sidebarMenus.nav
    .filter((item) => isNavItemVisible(item, user))
    .map((item) => {
      const url = item.subSidebarKey && firstAreaUrl(item.subSidebarKey, user);
      return url && url !== item.url ? { ...item, url } : item;
    });
}
