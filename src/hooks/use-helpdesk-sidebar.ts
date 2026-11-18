import { useCallback, useEffect, useMemo } from "react";

import {
  HELPDESK_ACTIVE_STATUSES,
  withHelpdeskCounts,
} from "@/lib/helpdesk-filters";
import { sidebarMenus, type SubSidebarMenuItem } from "@/lib/sidebar-navs";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { FetchSupportTicketFilterCounts } from "@/redux/api-slice/support-ticket-slice";

/**
 * The sub-sidebar to show, with the help desk's views counted.
 *
 * Any other area's sub-sidebar comes back untouched and nothing is fetched.
 * The counts cover the open and reopened tickets the tabs show, not the
 * resolved and closed ones, and are fetched again when the store changes and
 * whenever a ticket changes.
 */
export function useHelpdeskSidebar(
  sidebar: SubSidebarMenuItem | null,
): SubSidebarMenuItem | null {
  const dispatch = useAppDispatch();
  const isHelpdesk =
    sidebar !== null && sidebar === sidebarMenus.navSubSidebar?.helpdesk;

  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const refreshKey = useAppSelector(
    (state) => state.GetSupportTicketsReducer.FilterCountsRefreshKey,
  );
  const { FetchSupportTicketFilterCountsData } = useAppSelector(
    (state) =>
      state.GetSupportTicketsReducer.FetchSupportTicketFilterCountsState,
  );

  const refreshCounts = useCallback(() => {
    if (!isHelpdesk || !storeCode) return;

    void dispatch(
      FetchSupportTicketFilterCounts({
        storeCode,
        status: HELPDESK_ACTIVE_STATUSES,
      }),
    );
  }, [dispatch, isHelpdesk, storeCode]);

  // `refreshKey` is not read: a change to it is the reason to fetch again.
  useEffect(() => refreshCounts(), [refreshCounts, refreshKey]);

  return useMemo(
    () =>
      isHelpdesk
        ? withHelpdeskCounts(sidebar, FetchSupportTicketFilterCountsData)
        : sidebar,
    [isHelpdesk, sidebar, FetchSupportTicketFilterCountsData],
  );
}
