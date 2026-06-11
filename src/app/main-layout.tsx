"use client"

import { AppSidebar } from "@/components/custom/app-sidebar"
import { SiteHeader } from "@/components/custom/site-header"
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useAppSelector } from "@/redux/hooks"
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
                    Please wait while we retrieve the stores of your account. Do not refresh the page.
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    )
}

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { GetStoresIsLoading } = useAppSelector(
        (state) => state.GetStoresReducer.GetStoresState
    );
    const pathname = usePathname();

    if (pathname === "/login") {
        return (
            <>
                {children}
            </>
        );
    }

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className={
                            cn(
                                "flex flex-col gap-4 py-4 md:gap-6 md:py-6",
                                "h-full"
                            )
                        }>
                            {GetStoresIsLoading ? <StoreLoading /> : children}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>

    );
}