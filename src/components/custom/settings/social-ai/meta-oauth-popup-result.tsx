"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  META_OAUTH_CHANNEL,
  announceMetaOAuthResult,
  type MetaOAuthResult,
} from "./use-meta-oauth";

const ACCOUNTS_HREF = "/settings/social-ai/accounts";

/**
 * The Meta login popup's landing spot: the backend redirects it to
 * `SOCIAL_CONNECT_REDIRECT_URL?social_connect=…`. It hands the outcome to the
 * window that opened it and closes itself, so the user never ends up on a
 * second dashboard. Mounted in the settings layout, so it works whichever
 * settings page that URL points at.
 */
export function MetaOAuthPopupResult() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Dev-mode double effects must not report the same outcome twice.
  const reported = useRef(false);

  useEffect(() => {
    const status = searchParams?.get("social_connect");
    if (!status || reported.current) return;
    reported.current = true;

    const result: MetaOAuthResult = {
      status,
      message: searchParams?.get("message") ?? "",
    };
    const channel = new BroadcastChannel(META_OAUTH_CHANNEL);
    channel.postMessage(result);
    channel.close();
    window.close();

    // Still running means this window can't close itself (it wasn't opened
    // by the connect button): show the outcome here and open the accounts
    // screen, which loads fresh.
    const timer = window.setTimeout(() => {
      announceMetaOAuthResult(result);
      router.replace(ACCOUNTS_HREF);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [searchParams, router]);

  return null;
}
