"use client";

import { createContext, useContext } from "react";

/**
 * Whether the area's sub-sidebar is collapsed, and how to flip it.
 *
 * The state lives in the main layout (the sidebar's width is a provider-level
 * CSS variable), but a screen may need it too: the help desk swaps its left
 * panel for a views dropdown in the ticket list once the panel is hidden.
 */
export type SubSidebarState = { hidden: boolean; toggle: () => void };

export const SubSidebarContext = createContext<SubSidebarState>({
  hidden: false,
  toggle: () => {},
});

export const useSubSidebar = () => useContext(SubSidebarContext);
