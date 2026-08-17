"use client";

import { AppSidebar } from "@/components/custom/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  resolveSubSidebarKey,
  sidebarMenus,
  SubSidebarMenuItem,
} from "@/lib/sidebar-navs";
import { Suspense, useState } from "react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
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
  // and stays put — the width worth reclaiming is the sub-sidebar's 16rem,
  // not the rail's 3.5rem.
  const [subSidebarHidden, setSubSidebarHidden] = useState(false);

  // Derived from the route, so it survives a refresh and works on a deep
  // link. Computed here rather than in AppSidebar because the sidebar's
  // width is a provider-level CSS variable that both the layout gap and the
  // fixed container read.
  const subSidebarKey = resolveSubSidebarKey(pathname);
  const subSidebarItems: SubSidebarMenuItem | null = subSidebarKey
    ? (sidebarMenus.navSubSidebar?.[subSidebarKey] ?? null)
    : null;
  const hasSubSidebar = subSidebarItems !== null;

  if (pathname === "/login") {
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
          "--sidebar-width-icon":
            hasSubSidebar && !subSidebarHidden
              ? "calc(3.5rem + 16rem)"
              : "3.5rem",
        } as React.CSSProperties
      }
    >
      {/* The sidebar reads the query string to decide which sub-nav entry
          is active, and useSearchParams opts a route out of static
          rendering unless it sits under a boundary. */}
      <Suspense fallback={null}>
        <AppSidebar
          subSidebarItems={subSidebarItems}
          subSidebarHidden={subSidebarHidden}
          onToggleSubSidebar={() => setSubSidebarHidden((hidden) => !hidden)}
        />
      </Suspense>
      <SidebarInset>
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
