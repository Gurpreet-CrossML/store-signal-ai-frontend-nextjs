"use client";

import { AppSidebar } from "@/components/custom/app-sidebar";
import { OnboardingDrawer } from "@/components/custom/onboarding-drawer";
import { ShopifyOauthReturn } from "@/components/custom/shopify-oauth-return";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  resolveSubSidebarKey,
  sidebarMenus,
  SubSidebarMenuItem,
} from "@/lib/sidebar-navs";
import { Suspense, useState } from "react";
import { useIsBelowLg } from "@/hooks/use-narrow-viewport";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { isAuthPage } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/hooks";
import { usePathname } from "next/navigation";

function StoreLoading() {
  return (
    <Empty className="w-full h-full">
      <EmptyHeader>
        <EmptyMedia>
          <Spinner />
        </EmptyMedia>
        <EmptyTitle>Retrieving Stores</EmptyTitle>
        <EmptyDescription>
          Please wait while we retrieve the stores of your account. Do not
          refresh the page.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { GetStoresIsLoading } = useAppSelector(
    (state) => state.GetStoresReducer.GetStoresState,
  );
  const pathname = usePathname();

  // Collapses the sub-sidebar only. The icon rail is the app's navigation
  // and stays put — the width worth reclaiming is the sub-sidebar's 14rem,
  // not the rail's 3.5rem.
  //
  // Below 1024px it starts collapsed. That is only the default: the toggle
  // on the rail still wins, until the viewport crosses the breakpoint
  // (rotating an iPad), when the default for the new size applies again.
  const isNarrow = useIsBelowLg();
  const [toggled, setToggled] = useState<{
    atNarrow: boolean;
    hidden: boolean;
  } | null>(null);
  const subSidebarHidden =
    toggled && toggled.atNarrow === isNarrow ? toggled.hidden : isNarrow;

  // Derived from the route, so it survives a refresh and works on a deep
  // link. Computed here rather than in AppSidebar because the sidebar's
  // width is a provider-level CSS variable that both the layout gap and the
  // fixed container read.
  const subSidebarKey = resolveSubSidebarKey(pathname);
  const subSidebarItems: SubSidebarMenuItem | null = subSidebarKey
    ? (sidebarMenus.navSubSidebar?.[subSidebarKey] ?? null)
    : null;
  const hasSubSidebar = subSidebarItems !== null;
  // On a narrow screen the open menu floats over the page rather than
  // taking 14rem out of it, and closes once a destination is picked.
  const subSidebarOverlays = isNarrow && hasSubSidebar && !subSidebarHidden;
  const toggleSubSidebar = () =>
    setToggled({ atNarrow: isNarrow, hidden: !subSidebarHidden });

  if (isAuthPage(pathname)) {
    return <>{children}</>;
  }

  return (
    // `open` is pinned false so the sidebar is permanently in its collapsed
    // (icon) state — that state is what drives every icon-mode style, so
    // letting it expand is what made labels spill out of the rail. Hiding is
    // therefore its own concern, not the provider's `open`.
    //
    // Widening happens through --sidebar-width-icon, the width a collapsed
    // sidebar actually uses, so a sub-sidebar gets its room while the rail
    // keeps its own fixed --rail-width.
    <SidebarProvider
      open={false}
      onOpenChange={() => {}}
      style={
        {
          // Literal values: the rail keeps 3.5rem, and the collapsed
          // sidebar grows by the sub-sidebar's width when one is open.
          //
          // 14rem, not 16: the longest label in any area is "Widget
          // Customisation" at roughly 12.5rem including its icon and
          // padding, so the extra two were empty gutter on every screen —
          // and the panes that matter are to the right of it.
          // The page only ever reserves the rail's width while the menu
          // overlays it.
          ...(isNarrow ? { "--sidebar-gap-width": "3.5rem" } : {}),
          "--sidebar-width-icon":
            hasSubSidebar && !subSidebarHidden
              ? "calc(3.5rem + 14rem)"
              : "3.5rem",
        } as React.CSSProperties
      }
    >
      {/* The sidebar reads the query string to decide which sub-nav entry
          is active, and useSearchParams opts a route out of static
          rendering unless it sits under a boundary. */}
      {subSidebarOverlays && (
        <div
          aria-hidden
          className="fixed inset-0 z-[9] bg-black/30"
          onClick={toggleSubSidebar}
        />
      )}
      <Suspense fallback={null}>
        <AppSidebar
          subSidebarItems={subSidebarItems}
          subSidebarHidden={subSidebarHidden}
          onToggleSubSidebar={toggleSubSidebar}
          onSubSidebarNavigate={() => {
            if (isNarrow) setToggled({ atNarrow: true, hidden: true });
          }}
          className={subSidebarOverlays ? "shadow-2xl" : undefined}
        />
      </Suspense>
      <SidebarInset>
        {/* Reads Shopify's OAuth return params from the query string. */}
        <Suspense fallback={null}>
          <ShopifyOauthReturn />
          <OnboardingDrawer />
        </Suspense>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {/* No vertical padding here: each page owns its spacing with a
                uniform p-4 container, and the full-bleed screens (help desk,
                live support, social inbox/feed) fill the viewport edge to
                edge. Padding added here would double up on every page. */}
            <div className={cn("flex flex-col", "h-full")}>
              {GetStoresIsLoading ? <StoreLoading /> : children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
