import {
  IconAdjustmentsHorizontal,
  IconBan,
  IconBooks,
  IconDashboard,
  IconHelp,
  IconImageGeneration,
  IconMessage2,
  IconMoodSmile,
  IconNotebook,
  IconSearch,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";

export const sidebarMenus = {
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
      title: "Support",
      url: "/support",
      icon: IconMessage2,
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

  navBrandVoice: {
    label: "Brand Voice & Tone",
    items: [
      {
        title: "Persona Identity",
        url: "/brand-voice/persona-identity",
        icon: IconUser,
      },
      {
        title: "Tone & Style",
        url: "/brand-voice/tone-style",
        icon: IconMoodSmile,
      },
      {
        title: "Vocabulary",
        url: "/brand-voice/vocabulary",
        icon: IconBooks,
      },
      {
        title: "Never-Say Rules",
        url: "/brand-voice/never-say-rules",
        icon: IconBan,
      },
    ],
  },

  // Company-admin only (is_staff). Gated in AppSidebar by the session role.
  navAdmin: [
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
