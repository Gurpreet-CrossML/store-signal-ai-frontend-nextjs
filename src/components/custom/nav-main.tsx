"use client"

import { type Icon } from "@tabler/icons-react"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { GetStores } from "@/redux/api-slice/stores-slice"
import { useEffect } from "react"

function StoreSelector() {

    const dispatch = useAppDispatch();

    const { GetStoresListData } = useAppSelector(
        (state) => state.GetStoresReducer.GetStoresState
    );

    useEffect(() => {
        if (!GetStoresListData.length) {
            dispatch(
                GetStores({})
            )
        }
    }, [GetStoresListData, dispatch]);

    return (
        <Select>
            <SelectTrigger className="w-full mb-2">
                <SelectValue placeholder="Select a Store" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Stores</SelectLabel>
                    {GetStoresListData.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                            {store.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}

export function NavMain({
    items,
}: {
    items: {
        title: string
        url: string
        icon?: Icon
    }[]
}) {

    const pathname = usePathname();

    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
                <StoreSelector />
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                tooltip={item.title}
                                className={cn(
                                    pathname == item.url ? "min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground" : "",
                                )}
                                asChild
                            >
                                <Link href={item.url}>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
