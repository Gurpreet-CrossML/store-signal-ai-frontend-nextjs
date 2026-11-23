import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import {
  HELPDESK_ACTIVE_STATUSES,
  withHelpdeskCounts,
} from "@/lib/helpdesk-filters";
import { sidebarMenus, type SubSidebarMenuItem } from "@/lib/sidebar-navs";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchSupportTicketFilterCounts,
  type SupportTicketStatus,
} from "@/redux/api-slice/support-ticket-slice";

// The statuses the list's filter can add (`?status=`); anything else in the
// URL is ignored.
const FILTER_STATUSES: SupportTicketStatus[] = ["resolved", "closed"];

/**
 * The sub-sidebar to show, with the help desk's views counted.
 *
 * Any other area's sub-sidebar comes back untouched and nothing is fetched.
 * The counts cover the open and reopened tickets the tabs show, plus any
 * resolved or closed ones picked in the list's filter, and are fetched again
 * when the store or those statuses change and whenever a ticket changes.
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

  // A plain string, so a change to another param doesn't refetch.
  const statusParam = useSearchParams()?.get("status") ?? "";

  const refreshCounts = useCallback(() => {
    if (!isHelpdesk || !storeCode) return;

    const picked = statusParam.split(",") as SupportTicketStatus[];
    void dispatch(
      FetchSupportTicketFilterCounts({
        storeCode,
        status: [
          ...HELPDESK_ACTIVE_STATUSES,
          ...FILTER_STATUSES.filter((status) => picked.includes(status)),
        ],
      }),
    );
  }, [dispatch, isHelpdesk, storeCode, statusParam]);

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
