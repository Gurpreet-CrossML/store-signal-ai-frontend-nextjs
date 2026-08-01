import {
  IconAdjustmentsSpark,
  IconBan,
  IconBook2,
  IconBooks,
  IconDashboard,
  IconHelp,
  IconImageGeneration,
  IconMessage2,
  IconMessageUser,
  IconSearch,
  IconSettings,
  IconShoppingBag,
  IconUserHexagon,
  IconVolume,
  type Icon,
} from "@tabler/icons-react";

export type SideBarMenuItem = {
  title: string;
  url: string;
  icon: Icon;
  isExpanded?: boolean; // Optional property to indicate if the menu item is expanded
  items?: SideBarMenuItem[]; // Optional property for nested items
};

export type SideBarMenus = {
  navMain: SideBarMenuItem[];
  navAdmin: SideBarMenuItem[];
  navSecondary: SideBarMenuItem[];
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
      title: "Knowledge",
      url: "/knowledge",
      icon: IconBooks,
    },
    {
      title: "Customisation",
      url: "/customisation",
      icon: IconImageGeneration,
    },
  ],

  // Company-admin only (is_staff). Gated in AppSidebar by the session role.
  navAdmin: [
    {
      title: "Brand Voice",
      url: "#",
      icon: IconVolume,
      isExpanded: true,
      items: [
        {
          title: "Persona Identity",
          url: "/brand-voice/persona-identity",
          icon: IconUserHexagon,
        },
        {
          title: "Tone & Style",
          url: "/brand-voice/tone-and-style",
          icon: IconAdjustmentsSpark,
        },
        {
          title: "Vocabulary",
          url: "/brand-voice/vocabulary",
          icon: IconBook2,
        },
        // {
        //   title: "Selling Style",
        //   url: "/brand-voice/selling-style",
        //   icon: IconShoppingBag,
        // },
        {
          title: "Never-Say Rules",
          url: "/brand-voice/never-say-rules",
          icon: IconBan,
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ],

  navSecondary: [
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
};