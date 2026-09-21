"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

import { useAppDispatch } from "@/redux/hooks";
import { CompleteShopifyOauth } from "@/redux/api-slice/onboarding-slice";
import { GetStores } from "@/redux/api-slice/stores-slice";

/**
 * Closes the Shopify OAuth loop from anywhere in the app: Shopify sends the
 * browser back with code/shop/state/hmac, this forwards that query to the
 * backend callback, strips it from the URL, then refreshes the session and
 * the store list. Mounted in MainLayout — NOT in the onboarding drawer —
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

  return null;
}
