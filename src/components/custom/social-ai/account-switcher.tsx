"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import {
  IconBrandFacebook,
  IconCheck,
  IconSelector,
} from "@tabler/icons-react";
import type { ConnectedAccount } from "@/redux/api-slice/social-ai-slice";

import { useAccountIdentity } from "./channel-context";

/**
 * Connected-account switcher in the conversation list header — the same
 * one-row pattern as the store switcher in the app sidebar, so the whole
 * account identity (avatar, name, status) and the switcher itself
 * cost a single row instead of a card plus a separate dropdown.
 */
export function AccountSwitcher({
  loading,
  accounts,
  selectedAccount,
  onSelectAccount,
  channelLabel,
  ChannelIcon,
}: {
  loading: boolean;
  accounts: ConnectedAccount[];
  selectedAccount: ConnectedAccount | null;
  onSelectAccount: (accountId: string) => void;
  channelLabel: string;
  ChannelIcon: typeof IconBrandFacebook;
}) {
  const account = useAccountIdentity();

  if (loading) {
    // The real switcher, disabled, with the icon slot spinning — an empty
    // gap or a bare skeleton reads as "nothing here" rather than "loading".
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled tooltip="Loading accounts…">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Spinner className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                Loading {channelLabel} accounts…
              </span>
            </div>
            <IconSelector className="ml-auto" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const subtitle = selectedAccount
    ? [
        account.username && `@${account.username}`,
        selectedAccount.is_active ? "Active" : "Inactive",
      ]
        .filter(Boolean)
        .join(" · ")
    : "No accounts connected";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={!accounts.length}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {selectedAccount && account.profilePictureUrl ? (
                <Avatar className="size-8">
                  <AvatarImage
                    src={account.profilePictureUrl}
                    alt={account.name}
                  />
                  <AvatarFallback className="font-medium">
                    {account.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ChannelIcon className="size-4" />
                </div>
              )}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {selectedAccount
                    ? account.name
                    : `No ${channelLabel} account`}
                </span>
                <span className="truncate text-xs">{subtitle}</span>
              </div>
              <IconSelector className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {channelLabel} accounts
            </DropdownMenuLabel>
            {accounts.map((acc) => {
              const accountName = acc.name || acc.username || acc.external_id;

              return (
                <DropdownMenuItem
                  key={acc.id}
                  onClick={() => onSelectAccount(String(acc.id))}
                  className="gap-2 p-2"
                >
                  <Avatar className="size-6 shrink-0">
                    {acc.profile_picture_url && (
                      <AvatarImage
                        src={acc.profile_picture_url}
                        alt={accountName}
                      />
                    )}
                    {/* Falls back to the channel mark when the page has no
                        picture, or when Meta's CDN link has expired. */}
                    <AvatarFallback>
                      <ChannelIcon className="size-3.5" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate">{accountName}</span>
                  {!acc.is_active && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  {acc.id === selectedAccount?.id && (
                    <IconCheck className="size-4 shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
