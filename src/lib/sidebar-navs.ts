import {
  IconBooks,
  IconDashboard,
  IconHelp,
  IconImageGeneration,
  IconMessage2,
  IconSearch,
  IconSettings,
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
      title: "Tickets",
      url: "/tickets",
      icon: IconHelp,
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

  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
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
