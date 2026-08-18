"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useMemo, useState } from "react";
import {
  createMetaOAuthUrl,
  fetchSocialAccountsSubscriptions,
} from "@/redux/api-slice/social-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { IconBrandMeta, IconSearch } from "@tabler/icons-react";
import { SocialAccountsDataTable } from "./social-accounts-data-table";
import { SocialAccountsColumns } from "./social-accounts-columns";
import { SocialAIPlatformOptions } from "@/lib/config";
import { useSearchParams } from "next/navigation";
import { PaginationState } from "@tanstack/react-table";

export default function SocialAITabContent({
  storeCode,
}: {
  storeCode: string;
}) {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { FetchMetaOauthURLIsLoading } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchMetaOauthURLState,
  );
  const {
    FetchSocialAccountsSubscriptionsData,
    FetchSocialAccountsSubscriptionsIsLoading,
  } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchSocialAccountSubscriptionsState,
  );

  // Controlled pagination. Defaults to 15 rows per page. The active page is
  // mirrored in the `?page=` query param (1-indexed) so a shared link lands
  // on the same page the account lives on.
  const [pagination, setPagination] = useState<PaginationState>(() => {
    const pageParam = Number(searchParams?.get("page"));
    const pageIndex = pageParam > 1 ? Math.floor(pageParam) - 1 : 0;
    return { pageIndex, pageSize: 25 };
  });

  // Platform tab + search filter both apply client-side, since the
  // subscriptions endpoint returns every account in one response.
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  // Fetch the authorize URL and open it in the SAME click flow — routing
  // it through the store + an effect made the popup re-open on every tab
  // mount, since the last URL never left the store.
  const handleConnectMeta = async () => {
    try {
      const data = await dispatch(createMetaOAuthUrl(storeCode)).unwrap();
      if (!data?.authorize_url) return;
      // A features string makes window.open spawn a popup window;
      // without one the browser opens a full tab instead. Centered on
      // the parent window; the fixed name reuses the same popup if
      // "Connect" is clicked again instead of stacking new ones.
      const width = 600;
      const height = 750;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(
        data.authorize_url,
        "meta-oauth-connect",
        `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
      );
    } catch (error) {
      console.error("Failed to connect Meta:", error);
    }
  };

  useEffect(() => {
    if (storeCode) {
      dispatch(fetchSocialAccountsSubscriptions(storeCode));
    }
  }, [dispatch, storeCode]);

  const rows = useMemo(
    () => FetchSocialAccountsSubscriptionsData?.results ?? [],
    [FetchSocialAccountsSubscriptionsData],
  );

  // Per-platform counts shown in the tab badges, computed over all accounts.
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const account of rows) {
      counts[account.channel_type] = (counts[account.channel_type] ?? 0) + 1;
    }
    return counts;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((account) => {
      if (activeTab !== "all" && account.channel_type !== activeTab)
        return false;
      if (!query) return true;
      return (
        account.name.toLowerCase().includes(query) ||
        (account.username ?? "").toLowerCase().includes(query)
      );
    });
  }, [rows, activeTab, search]);

  const resetToFirstPage = () =>
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex w-full items-center justify-end gap-4">
        <Button
          onClick={handleConnectMeta}
          disabled={FetchMetaOauthURLIsLoading}
        >
          <IconBrandMeta className="size-4" />
          Connect Meta Account
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
              resetToFirstPage();
            }}
          >
            <TabsList variant="line">
              <TabsTrigger value="all">
                All Accounts
                <Badge variant="secondary">{rows.length}</Badge>
              </TabsTrigger>
              {Object.entries(SocialAIPlatformOptions).map(
                ([key, platform]) => (
                  <TabsTrigger key={key} value={key}>
                    {platform.label}
                    <Badge variant="secondary">
                      {platformCounts[key] ?? 0}
                    </Badge>
                  </TabsTrigger>
                ),
              )}
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-64">
            <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetToFirstPage();
              }}
              placeholder="Search accounts..."
              className="pl-8"
              aria-label="Search accounts"
            />
          </div>
        </div>

        <SocialAccountsDataTable
          columns={SocialAccountsColumns}
          data={filteredRows}
          totalCount={filteredRows.length}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={FetchSocialAccountsSubscriptionsIsLoading}
        />
      </div>
    </div>
  );
}
