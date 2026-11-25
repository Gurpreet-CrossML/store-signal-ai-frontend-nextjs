"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { SHOPIFY_OAUTH_PENDING_KEY } from "@/lib/config";
import { useAppDispatch } from "@/redux/hooks";
import {
  CompleteShopifyOauth,
  resetStartShopifyOauth,
} from "@/redux/api-slice/onboarding-slice";
import { GetStores } from "@/redux/api-slice/stores-slice";

/**
 * Closes the Shopify OAuth loop from anywhere in the app: Shopify sends the
 * browser back with code/shop/state/hmac, this forwards that query to the
 * backend callback, strips it from the URL, then refreshes the session and
 * the store list. Also tells the user when they come back from Shopify
 * without finishing. Mounted in MainLayout — NOT in the onboarding drawer —
 * because connecting another store from Settings → Stores returns here too,
 * long after onboarding is over.
 */
export function ShopifyOauthReturn() {
  const dispatch = useAppDispatch();
  const { update } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams?.toString() ?? "";
  const isShopifyReturn = ["code", "shop", "state", "hmac"].every((key) =>
    searchParams?.has(key),
  );
  // The `state` is single-use server-side, so the callback must fire once —
  // not again on a re-render, and not on a refresh (hence the URL rewrite).
  const handled = useRef(false);
  useEffect(() => {
    if (!isShopifyReturn || handled.current) return;
    handled.current = true;
    sessionStorage.removeItem(SHOPIFY_OAUTH_PENDING_KEY);
    router.replace(pathname ?? "/");
    dispatch(CompleteShopifyOauth(search)).then((result) => {
      if (CompleteShopifyOauth.fulfilled.match(result)) {
        // Session first (onboarding step / accessible stores), then the
        // switcher's list so the new store shows up without a reload.
        update();
        dispatch(GetStores({}));
      }
    });
  }, [isShopifyReturn, search, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Back from Shopify without its params: Shopify never redirects for a
  // client ID that matches no app (it shows its own error page), so the
  // user backed out. Runs after the effect above, which clears the flag
  // on a real return. A Back either reloads the page (checked on mount) or
  // restores it from the back/forward cache (`persisted`), spinner and all.
  useEffect(() => {
    const cameBack = () => {
      if (!sessionStorage.getItem(SHOPIFY_OAUTH_PENDING_KEY)) return;
      sessionStorage.removeItem(SHOPIFY_OAUTH_PENDING_KEY);
      dispatch(resetStartShopifyOauth());
      toast.error("Your Shopify store wasn't connected", {
        description:
          "If Shopify showed an error, the Client ID doesn't match your Shopify app. Check it and the store URL, then try again.",
      });
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) cameBack();
    };
    cameBack();
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [dispatch]);

  return null;
}
