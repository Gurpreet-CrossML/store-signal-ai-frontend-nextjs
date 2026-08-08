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
} from "@tabler/icons-react";

export type SideBarMenuItem = {
  title: string;
  url: string;
  icon: Icon;
  isMenuHeading?: boolean; // Optional property to indicate if the menu item is a heading
  isExpanded?: boolean; // Optional property to indicate if the menu item is expanded
  items?: SideBarMenuItem[]; // Optional property for nested items
};

export type SideBarMenus = {
  navMain: SideBarMenuItem[];
  navAdmin: SideBarMenuItem[];
  navSecondary?: SideBarMenuItem[];
};

/** Depth-first lookup for the menu item at `url`, searching nested `items` at any depth. */
export function findMenuItemByUrl(
  items: SideBarMenuItem[],
  url: string | null,
): SideBarMenuItem | undefined {
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
      url: "/social-ai",
      icon: IconBrandMeta,
    },
  ],

  // Company-admin only (is_staff). Gated in AppSidebar by the session role.
  navAdmin: [
    {
      title: "Help Desk",
      url: "/helpdesk",
      icon: IconHeadset,
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
