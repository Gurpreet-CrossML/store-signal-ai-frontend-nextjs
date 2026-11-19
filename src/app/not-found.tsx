"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconDashboard,
  IconFileSearch,
  IconLink,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

// The host never changes while the page is open, so there is nothing to
// subscribe to. On the server it is unknown and the chip shows the path only.
const noSubscribe = () => () => {};

/**
 * The page for an address that doesn't exist (design: StoreSignal Design
 * System › Page not found (404)). Shows the address that was tried and
 * offers a way out.
 */
export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const host = useSyncExternalStore(
    noSubscribe,
    () => window.location.host,
    () => "",
  );

  // A page opened in a new tab has nothing to go back to.
  const goBack = () =>
    window.history.length > 1 ? router.back() : router.push("/");

  return (
    <div className="flex flex-1 flex-col items-center justify-start px-4 pt-6 pb-12 sm:min-h-[70vh] sm:justify-center sm:pt-12">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-7 text-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-primary/5 sm:size-30">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 sm:size-22">
            <IconFileSearch
              className="size-6 text-primary sm:size-8"
              aria-hidden
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2.5">
          <p className="text-xs leading-4 font-semibold tracking-[0.6px] text-primary uppercase">
            Error 404
          </p>
          <h1 className="text-[22px] leading-[30px] font-semibold tracking-[-0.5px] text-foreground sm:text-3xl sm:leading-[38px]">
            We can&apos;t find that page
          </h1>
          <p className="text-sm leading-[22px] text-muted-foreground sm:text-[15px]">
            This link is broken, or the page has been moved.
          </p>
        </div>

        {/* The address that was tried, so the user can spot a typo. */}
        <div className="flex max-w-full items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground">
          <IconLink className="size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 truncate font-mono">
            {host}
            {pathname}
          </span>
        </div>

        {/* Stacked full width on a phone, side by side from tablet up. */}
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/">
              <IconDashboard data-icon="inline-start" />
              Go To Dashboard
            </Link>
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={goBack}
          >
            <IconArrowLeft data-icon="inline-start" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
