"use client";

import { useEffect, useMemo } from "react";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchSocialAccountsSubscriptions } from "@/redux/api-slice/social-ai-slice";

/**
 * The store's connected WhatsApp Business Account, if any. Unlike
 * Facebook/Instagram there's no switcher — a store has at most one
 * registered WABA today, so this always resolves to the first one found.
 */
export function useWhatsAppAccount() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const {
    FetchSocialAccountsSubscriptionsData,
    FetchSocialAccountsSubscriptionsIsLoading,
    FetchSocialAccountsSubscriptionsIsSuccess,
    FetchSocialAccountsSubscriptionsIsError,
  } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchSocialAccountSubscriptionsState,
  );

  useEffect(() => {
    if (storeCode) dispatch(fetchSocialAccountsSubscriptions(storeCode));
  }, [storeCode, dispatch]);

  const account = useMemo(
    () =>
      (FetchSocialAccountsSubscriptionsData?.results ?? []).find(
        (acc) => acc.channel_type === "whatsapp",
      ) ?? null,
    [FetchSocialAccountsSubscriptionsData],
  );

  const loading =
    FetchSocialAccountsSubscriptionsIsLoading ||
    (!FetchSocialAccountsSubscriptionsIsSuccess &&
      !FetchSocialAccountsSubscriptionsIsError);

  return { storeCode, account, loading };
}
