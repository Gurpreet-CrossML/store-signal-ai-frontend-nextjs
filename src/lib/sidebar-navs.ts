import {
  IconChartDots,
  IconHeadset,
  IconMessage2,
  IconMessageUser,
  IconDashboard,
  IconInbox,
  IconUser,
  IconAlarmSnoozeFilled,
  IconPackageOff,
  IconCreditCardOff,
  IconArrowsExchange,
  IconTags,
  type Icon,
} from "@tabler/icons-react";

import { NAV_AREAS, type NavAreaKey } from "@/lib/nav-areas";

export type SideBarMenuItem = {
  title: string;
  url: string;
  icon: Icon;
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
};

export type SideBarMenus = {
  navMain: MainSidebarMenuItem[];
  navAdmin: MainSidebarMenuItem[];
  navSecondary?: MainSidebarMenuItem[];
  navSubSidebar?: {
    [key: string]: SubSidebarMenuItem;
  };
};

/**
 * Which sub-sidebar belongs to a route, if any. Derived from the path
 * rather than tracked on click, so a refresh or a shared deep link opens
 * the same sub-sidebar the click would have.
 */
export function resolveSubSidebarKey(pathname: string | null): string | null {
  if (!pathname) return null;

  const sections = [...sidebarMenus.navMain, ...sidebarMenus.navAdmin];
  const section = sections.find(
    (item) =>
      item.subSidebarKey &&
      (pathname === item.url || pathname.startsWith(`${item.url}/`)),
  );
  if (section?.subSidebarKey) return section.subSidebarKey;

  // A sub-sidebar route that doesn't sit under its section's own path.
  for (const [key, items] of Object.entries(sidebarMenus.navSubSidebar ?? {})) {
    if (
      items?.items &&
      items?.items.some(
        (item) => pathname === item.url || pathname.startsWith(`${item.url}/`),
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
 * app. Query strings are ignored: no nav entry carries one.
 */
export function isMenuItemActive(pathname: string | null, url: string) {
  if (!pathname) return false;
  if (pathname === url) return true;
  return url !== "/" && pathname.startsWith(`${url}/`);
}

/** The top-level section a path belongs to, including nested routes. */
export function findMenuSectionByPath(pathname: string | null) {
  return [...sidebarMenus.navMain, ...sidebarMenus.navAdmin].find((item) =>
    isMenuItemActive(pathname, item.url),
  );
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
  url: string = NAV_AREAS[key].sections[0].href,
): MainSidebarMenuItem {
  return {
    title: NAV_AREAS[key].title,
    url,
    icon: NAV_AREAS[key].icon,
    subSidebarKey: key,
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
        items: area.sections.map((section) => ({
          title: section.title,
          url: section.href,
          icon: section.icon,
        })),
      },
    ]),
  );
}

export const sidebarMenus: SideBarMenus = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Threads",
      url: "/threads",
      icon: IconMessage2,
    },
    {
      title: "Live Support",
      url: "/support",
      icon: IconMessageUser,
    },
    areaMenuItem("crm"),
    areaMenuItem("socialAI"),
  ],

  navSubSidebar: {
    // Settings, Brand Voice, Knowledge and Social AI come straight from
    // NAV_AREAS — adding a screen there adds it here.
    ...areaSubSidebars(),

    helpdesk: {
      title: "Help Desk",
      icon: IconHeadset,
      items: [
        {
          title: "All Inboxes",
          url: "/helpdesk",
          icon: IconInbox,
        },
        {
          title: "Unassigned",
          url: "/helpdesk?filter=unassigned",
          icon: IconUser,
        },
        {
          title: "Snoozed",
          url: "/helpdesk?filter=snoozed",
          icon: IconAlarmSnoozeFilled,
        },
        {
          title: "Order Return",
          icon: IconPackageOff,
          url: "/helpdesk?filter=Order_Return",
        },
        {
          title: "Payment Failed",
          icon: IconCreditCardOff,
          url: "/helpdesk?filter=Payment_Failed",
        },
        {
          title: "Exchange Request",
          icon: IconArrowsExchange,
          url: "/helpdesk?filter=Exchange_Request",
        },
        {
          title: "Tags",
          icon: IconTags,
          url: "/helpdesk/tags",
        },
      ],
    },
  },

  // Company-admin only (is_staff). Gated in AppSidebar by the session role.
  navAdmin: [
    {
      title: "Help Desk",
      url: "/helpdesk",
      icon: IconHeadset,
      subSidebarKey: "helpdesk",
    },
    areaMenuItem("brandVoice"),
    areaMenuItem("settings"),
    {
      title: "AI Usage",
      url: "/ai-usage",
      icon: IconChartDots,
    },
    areaMenuItem("knowledge"),
  ],

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
