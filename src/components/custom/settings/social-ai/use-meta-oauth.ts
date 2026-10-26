"use client";

import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import { createMetaOAuthUrl } from "@/redux/api-slice/social-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const META_OAUTH_POPUP = "meta-oauth-connect";

// The popup reports to the window that opened it over this channel. A
// BroadcastChannel, not window.opener: Facebook's own pages can sever the
// opener link while the popup is away on them.
export const META_OAUTH_CHANNEL = "meta-oauth-result";

export type MetaOAuthResult = { status: string; message: string };

export function announceMetaOAuthResult({ status, message }: MetaOAuthResult) {
  if (status === "success") {
    toast.success(message || "Meta account connected.");
  } else {
    toast.error("Uh oh! Something went wrong.", { description: message });
  }
}

/**
 * Runs Meta's login in a popup — for a first connect, reauthorizing an
 * expired login (same flow, the backend refreshes the token) and
 * reconnecting one disconnected account (`accountId`).
 *
 * The backend finishes by redirecting the popup to
 * `SOCIAL_CONNECT_REDIRECT_URL` with `?social_connect=success|error`;
 * `MetaOAuthPopupResult` (settings layout) picks that up, reports the
 * outcome over `META_OAUTH_CHANNEL` and closes the popup. This hook shows
 * the outcome here and calls `onResult` to refresh the list.
 */
export function useMetaOAuth(storeCode: string, onResult: () => void) {
  const dispatch = useAppDispatch();
  const { FetchMetaOauthURLIsLoading } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchMetaOauthURLState,
  );

  // Fetch the authorize URL and open it in the SAME click flow — routing
  // it through the store + an effect made the popup re-open on every tab
  // mount, since the last URL never left the store.
  const startMetaOAuth = useCallback(
    async (accountId?: string) => {
      try {
        const data = await dispatch(
          createMetaOAuthUrl({ storeCode, accountId }),
        ).unwrap();
        if (!data?.authorize_url) return;
        // A features string makes window.open spawn a popup window;
        // without one the browser opens a full tab instead. Centered on
        // the parent window; the fixed name reuses the same popup if
        // clicked again instead of stacking new ones.
        const width = 600;
        const height = 750;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
          data.authorize_url,
          META_OAUTH_POPUP,
          `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
        );
      } catch (error) {
        console.error("Failed to start Meta login:", error);
      }
    },
    [dispatch, storeCode],
  );

  useEffect(() => {
    const channel = new BroadcastChannel(META_OAUTH_CHANNEL);
    channel.onmessage = (event: MessageEvent<MetaOAuthResult>) => {
      announceMetaOAuthResult(event.data);
      onResult();
    };
    return () => channel.close();
  }, [onResult]);

  return { startMetaOAuth, isStarting: FetchMetaOauthURLIsLoading };
}
