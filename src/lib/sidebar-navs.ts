import {
  IconMessage2,
  IconMessageUser,
  IconDashboard,
  type Icon,
} from "@tabler/icons-react";

import { NAV_AREAS, type AreaSection, type NavAreaKey } from "@/lib/nav-areas";

export type SideBarMenuItem = {
  title: string;
  url: string;
  icon: Icon;
  items?: SideBarMenuItem[];
};

export type SubSidebarMenuItem = {
  title: string;
  icon: Icon;
  items: SideBarMenuItem[];
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
    if (query !== "" || !isMenuItemActive(pathname, path)) continue;
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

  // An area's menu page, which none of the above covers when the section's
  // icon points at a screen rather than the menu (Settings, Brand Voice).
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
  { adminOnly, url }: { adminOnly?: boolean; url?: string } = {},
): MainSidebarMenuItem {
  return {
    title: NAV_AREAS[key].title,
    url: url ?? NAV_AREAS[key].sections[0].href,
    icon: NAV_AREAS[key].icon,
    subSidebarKey: key,
    ...(adminOnly ? { adminOnly: true } : {}),
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
  };
}

/** Every area in NAV_AREAS as a sub-sidebar, keyed by its area key. */
function areaSubSidebars(): Record<string, SubSidebarMenuItem> {
  return Object.fromEntries(
    Object.entries(NAV_AREAS).map(([key, area]) => [
      key,
      {
        title: area.title,
        icon: area.icon,
        items: area.sections.map(toMenuItem),
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
    },
    {
      title: "Live Support",
      url: "/support",
      icon: IconMessageUser,
    },
    {
      title: "Threads",
      url: "/threads",
      icon: IconMessage2,
    },
    areaMenuItem("helpdesk", { adminOnly: true }),
    areaMenuItem("socialAI"),
    areaMenuItem("crm"),
    areaMenuItem("brandVoice", { adminOnly: true }),
    areaMenuItem("settings", { adminOnly: true }),
    areaMenuItem("knowledge", { adminOnly: true }),
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
