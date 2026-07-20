import {
  IconAdjustmentsSpark,
  IconBan,
  IconBook2,
  IconBooks,
  IconDashboard,
  IconHelp,
  IconHeadset,
  IconImageGeneration,
  IconMessage2,
  IconMessageUser,
  IconSearch,
  IconSettings,
  IconShoppingBag,
  IconUserHexagon,
  IconVolume,
  IconBolt,
  IconCalendarTime,
  IconClockHour4,
  IconInbox,
  IconLayoutGrid,
  IconMoodSmile,
  IconPlugConnected,
  IconRoute,
  IconSettingsAutomation,
  IconTags,
  IconUsersGroup,
  type Icon,
} from "@tabler/icons-react";

export type SideBarMenuItem = {
  title: string;
  url: string;
  icon: Icon;
  count?: number; // Optional property for count
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
      title: "Help Desk",
      url: "/helpdesk",
      icon: IconHeadset,
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
      title: "Help Desk",
      url: "/helpdesk",
      icon: IconHeadset,
      isExpanded: true,
      items: [
        {
          title: "Inbox",
          count: 34,
          url: "/helpdesk",
          icon: IconInbox,
        },
        // { title: "Urgent + SLA", count: 4, url: "#", icon: IconBolt },
        // { title: "VIP customers", count: 3, url: "#", icon: IconStar },
        // { title: "Returns - waiting", count: 6, url: "#", icon: IconReload },
        // {
        //   title: "AI-handled today",
        //   count: 218,
        //   url: "#",
        //   icon: IconMessageChatbot,
        // },
        {
          title: "Channels",
          count: 12,
          icon: IconPlugConnected,
          url: "/helpdesk?section=channels",
        },
        {
          title: "Views",
          count: 5,
          icon: IconLayoutGrid,
          url: "/helpdesk?section=views",
        },
        {
          title: "Tags & Fields",
          count: 3,
          icon: IconTags,
          url: "/helpdesk?section=tags-fields",
        },
        {
          title: "Macros",
          count: 12,
          icon: IconBolt,
          url: "#",
        },
        {
          title: "Rules & Automations",
          count: 5,
          icon: IconSettingsAutomation,
          url: "/helpdesk?section=rules-automations",
        },
        {
          title: "Routing & Assignment",
          count: 3,
          icon: IconRoute,
          url: "/helpdesk?section=routing-assignment",
        },
        {
          title: "SLA Policies",
          count: 12,
          icon: IconClockHour4,
          url: "/helpdesk?section=sla-policies",
        },
        {
          title: "Business Hours",
          count: 5,
          icon: IconCalendarTime,
          url: "/helpdesk?section=business-hours",
        },
        {
          title: "Teams & Roles",
          count: 12,
          icon: IconUsersGroup,
          url: "/helpdesk?section=teams-roles",
        },
        {
          title: "CSAT",
          count: 5,
          icon: IconMoodSmile,
          url: "/helpdesk?section=csat",
        },
      ],
    },
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
