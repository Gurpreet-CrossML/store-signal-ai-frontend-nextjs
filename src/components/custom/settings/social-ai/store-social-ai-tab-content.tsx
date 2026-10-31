"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  disconnectSocialAccount,
  fetchSocialAccountsSubscriptions,
  type ConnectedAccount,
} from "@/redux/api-slice/social-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { IconBrandMeta, IconSearch } from "@tabler/icons-react";
import { SocialAccountsDataTable } from "./social-accounts-data-table";
import { getSocialAccountsColumns } from "./social-accounts-columns";
import { useMetaOAuth } from "./use-meta-oauth";
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

  // The accounts screen is the one place disconnected accounts still show,
  // so they can be reconnected.
  const refreshAccounts = useCallback(() => {
    if (storeCode) {
      dispatch(
        fetchSocialAccountsSubscriptions({
          storeCode,
          includeDisconnected: true,
        }),
      );
    }
  }, [dispatch, storeCode]);

  const { startMetaOAuth, isStarting } = useMetaOAuth(
    storeCode,
    refreshAccounts,
  );

  const [accountToDisconnect, setAccountToDisconnect] =
    useState<ConnectedAccount | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  // Disconnecting a Facebook page also disconnects its Instagram account,
  // so reload the list rather than patching a single row.
  const handleConfirmDisconnect = async () => {
    if (!accountToDisconnect) return;
    setDisconnecting(true);
    try {
      await dispatch(
        disconnectSocialAccount({
          storeCode,
          accountId: String(accountToDisconnect.id),
        }),
      ).unwrap();
      refreshAccounts();
      setAccountToDisconnect(null);
    } catch {
      // The thunk already surfaces the error toast.
    } finally {
      setDisconnecting(false);
    }
  };

  const columns = useMemo(
    () =>
      getSocialAccountsColumns({
        onReauthorize: () => startMetaOAuth(),
        onReconnect: (account) => startMetaOAuth(String(account.id)),
        onDisconnect: setAccountToDisconnect,
      }),
    [startMetaOAuth],
  );

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

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
        <Button onClick={() => startMetaOAuth()} disabled={isStarting}>
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
          columns={columns}
          data={filteredRows}
          totalCount={filteredRows.length}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={FetchSocialAccountsSubscriptionsIsLoading}
        />
      </div>

      <AlertDialog
        open={!!accountToDisconnect}
        onOpenChange={(open) => {
          if (!open) setAccountToDisconnect(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect account?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">
                {accountToDisconnect?.name}
              </span>{" "}
              will stop receiving comments and messages, and nothing will be
              sent from it, including AI replies.
              {accountToDisconnect?.channel_type === "facebook" &&
                " Its linked Instagram account is disconnected too."}{" "}
              Everything already synced is kept, and you can reconnect it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleConfirmDisconnect();
              }}
              disabled={disconnecting}
              className={buttonVariants({ variant: "destructive" })}
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
