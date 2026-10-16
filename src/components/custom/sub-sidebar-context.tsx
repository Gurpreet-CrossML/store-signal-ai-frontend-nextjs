"use client";

import { createContext, useContext } from "react";

import type { SideBarMenuItem } from "@/lib/sidebar-navs";

export type SubSidebarControl = {
  /** Whether the current screen has a sub-sidebar to show at all. */
  available: boolean;
  /** Whether it is currently collapsed away. */
  hidden: boolean;
  toggle: () => void;
  /** The sub-sidebar's entries, for screens that offer them in their own menu. */
  items: SideBarMenuItem[];
};

/**
 * Lets a screen open the area menu (e.g. Help Desk's inboxes) from its own
 * header. On a tablet that menu starts collapsed, and the only other way to
 * it is a small toggle on the icon rail — too easy to miss when the thing
 * you want is "switch to another inbox".
 */
export const SubSidebarControlContext = createContext<SubSidebarControl | null>(
  null,
);

export function useSubSidebarControl() {
  return useContext(SubSidebarControlContext);
}
