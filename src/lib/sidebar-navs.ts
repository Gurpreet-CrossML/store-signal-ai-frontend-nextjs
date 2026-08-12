import {
  IconChartDots,
  IconBooks,
  IconBrandMeta,
  IconDashboard,
  IconHeadset,
  IconMessage2,
  IconMessageUser,
  IconSettings,
  IconVolume,
  type Icon,
  IconPhotoVideo,
  IconBrandMessenger,
  IconSend,
  IconUser,
  IconAlarmSnoozeFilled,
  IconPackageOff,
  IconCreditCardOff,
  IconArrowsExchange,
  IconTags,
} from "@tabler/icons-react";

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
  return null;
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
    {
      title: "Social AI",
      url: "/social-ai/facebook-post",
      icon: IconBrandMeta,
      subSidebarKey: "socialAI",
    },
  ],

  // Social AI sub-sidebar items
  navSubSidebar: {
    socialAI: {
      title: "Social AI",
      icon: IconBrandMeta,
      items: [
        {
          title: "Facebook Posts",
          url: "/social-ai/facebook-post",
          icon: IconPhotoVideo,
        },
        {
          title: "Facebook Messages",
          url: "/social-ai/facebook-messages",
          icon: IconBrandMessenger,
        },
        {
          title: "Instagram Posts",
          url: "/social-ai/instagram-post",
          icon: IconPhotoVideo,
        },
        {
          title: "Instagram Messages",
          url: "/social-ai/instagram-messages",
          icon: IconSend,
        },
      ],
    },
    helpdesk: {
      title: "Help Desk",
      icon: IconHeadset,
      items: [
        {
          title: "All Inboxes",
          url: "/helpdesk",
          icon: IconPhotoVideo,
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
    {
      title: "Brand Voice",
      url: "/brand-voice",
      icon: IconVolume,
    },
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
      isMenuHeading: true,
      items: [
        {
          title: "Settings",
          url: "/settings",
          icon: IconSettings,
        },
        {
          title: "AI Usage",
          url: "/ai-usage",
          icon: IconChartDots,
        },
        {
          title: "Knowledge",
          url: "/knowledge",
          icon: IconBooks,
        },
      ],
    },
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
