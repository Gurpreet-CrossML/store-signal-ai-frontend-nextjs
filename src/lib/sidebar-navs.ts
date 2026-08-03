import {
  IconAdjustmentsSpark,
  IconBan,
  IconBook2,
  IconBooks,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandMessenger,
  IconBrandMeta,
  IconDashboard,
  IconHelp,
  IconHeadset,
  IconImageGeneration,
  IconMessage2,
  IconMessageUser,
  IconPhotoVideo,
  IconSearch,
  IconSend,
  IconSettings,
  IconUserHexagon,
  IconVolume,
  IconInbox,
  IconTags,
  type Icon,
  IconUser,
  IconPackageOff,
  IconCreditCardOff,
  IconArrowsExchange,
  IconAlarmSnoozeFilled,
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
    {
      title: "Social AI",
      url: "#",
      icon: IconBrandMeta,
      isMenuHeading: true,
      isExpanded: true,
      items: [
        {
          title: "Facebook",
          url: "#",
          icon: IconBrandFacebook,
          isExpanded: true,
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
          ],
        },
        {
          title: "Instagram",
          url: "#",
          icon: IconBrandInstagram,
          isExpanded: true,
          items: [
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
      ],
    },
  ],

  // Company-admin only (is_staff). Gated in AppSidebar by the session role.
  navAdmin: [
    {
      title: "Help Desk",
      url: "#",
      icon: IconHeadset,
      isMenuHeading: true,
      isExpanded: true,
      items: [
        {
          title: "All Open",
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
    {
      title: "Brand Voice",
      url: "#",
      icon: IconVolume,
      isMenuHeading: true,
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
        {
          title: "Never-Say Rules",
          url: "/brand-voice/never-say-rules",
          icon: IconBan,
        },
      ],
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
      ],
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