"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import {
  accountAutoRespondSet,
  updateAccountAutoRespond,
  type ConnectedAccount,
  type ConnectionState,
} from "@/redux/api-slice/social-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SocialAIPlatformOptions } from "@/lib/config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  IconDotsVertical,
  IconPlugConnected,
  IconPlugOff,
  IconRefresh,
  IconRosetteDiscountCheckFilled,
} from "@tabler/icons-react";

type SocialAccountsColumnHandlers = {
  // Re-run Meta's login for the expired Facebook login behind the row.
  onReauthorize: () => void;
  // Bring one disconnected account back.
  onReconnect: (account: ConnectedAccount) => void;
  onDisconnect: (account: ConnectedAccount) => void;
};

// Pill label + colors for each state the backend derives for an account.
const CONNECTION_STATE_BADGES: Record<
  ConnectionState,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  needs_reauth: {
    label: "Needs reauthorization",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  disconnected: {
    label: "Disconnected",
    className: "bg-muted text-muted-foreground",
  },
};

// Absolute, localized date e.g. "May 16, 2024".
function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

// Localized time e.g. "09:42 PM".
function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { timeStyle: "short" }).format(date);
}

/**
 * The per-account AI auto-reply switch. Flips locally first so the control
 * answers the click, and puts itself back if the request is refused.
 *
 * Off doesn't stop the AI tagging comments — it only stops it replying.
 */
function AutoRespondSwitch({ account }: { account: ConnectedAccount }) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const [busy, setBusy] = useState(false);

  const handleChange = async (value: boolean) => {
    if (!storeCode) return;
    const accountId = String(account.id);
    setBusy(true);
    dispatch(accountAutoRespondSet({ accountId, value }));
    try {
      await dispatch(
        updateAccountAutoRespond({
          storeCode,
          accountId,
          allowAiAutoRespond: value,
        }),
      ).unwrap();
    } catch {
      // The thunk already surfaces the error toast.
      dispatch(accountAutoRespondSet({ accountId, value: !value }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Switch
      id={`auto-response-${account.id}`}
      checked={account.allow_ai_auto_respond}
      disabled={busy || !!account.disconnected_at}
      onCheckedChange={handleChange}
      aria-label={`AI auto-reply for ${account.name}`}
    />
  );
}

export const getSocialAccountsColumns = ({
  onReauthorize,
  onReconnect,
  onDisconnect,
}: SocialAccountsColumnHandlers): ColumnDef<ConnectedAccount>[] => [
  // Account — avatar, name with verified mark, handle.
  {
    accessorKey: "name",
    header: "Account / Page",
    cell: ({ row }) => {
      const name = row.original.name;
      const profilePictureUrl = row.original.profile_picture_url;
      return (
        <div className="flex items-center gap-3 py-2">
          <Avatar size="lg">
            {profilePictureUrl ? (
              <AvatarImage src={profilePictureUrl} alt={name} />
            ) : (
              <AvatarFallback className="font-medium">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <span
              title={name}
              className="flex items-center gap-1 font-semibold"
            >
              {name}
              {row.original.is_active && (
                <IconRosetteDiscountCheckFilled className="size-4 shrink-0 text-sky-500" />
              )}
            </span>
            {row.original.username && (
              <span className="text-xs text-muted-foreground">
                @{row.original.username}
              </span>
            )}
            {row.original.channel_type === "whatsapp" &&
              row.original.phone_number && (
                <span className="text-xs text-muted-foreground">
                  {row.original.phone_number}
                </span>
              )}
          </div>
        </div>
      );
    },
  },

  // Platform — brand-colored icon with label.
  {
    accessorKey: "channel_type",
    header: "Platform",
    cell: ({ row }) => {
      const channelType = row.original.channel_type;
      const platform = SocialAIPlatformOptions[channelType];
      const PlatformIcon = platform?.icon;
      return (
        <div className="flex items-center gap-2 font-medium whitespace-nowrap">
          {PlatformIcon && (
            <PlatformIcon className={cn("size-5 shrink-0", platform.color)} />
          )}
          {platform?.label ?? channelType}
        </div>
      );
    },
  },

  // Status — working, needs reauthorization, or disconnected.
  {
    accessorKey: "connection_state",
    header: "Status",
    cell: ({ row }) => {
      const badge = CONNECTION_STATE_BADGES[row.original.connection_state];
      return (
        <Badge variant="secondary" className={cn(badge.className)}>
          {badge.label}
        </Badge>
      );
    },
  },

  {
    accessorKey: "allow_ai_auto_respond",
    header: "AI Auto-Reply",
    cell: ({ row }) => <AutoRespondSwitch account={row.original} />,
  },

  // Connected On — date over time, matching the two-line design.
  {
    accessorKey: "connected_at",
    header: "Connected On",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5 whitespace-nowrap">
        <span className="text-sm font-medium">
          {formatDate(row.original.connected_at)}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatTime(row.original.connected_at)}
        </span>
      </div>
    ),
  },

  // Actions — disconnect (plus reauthorize once the login has expired), or
  // reconnect once disconnected.
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const account = row.original;
      const isDisconnected = account.connection_state === "disconnected";
      const needsReauth = account.connection_state === "needs_reauth";
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={`More actions for ${account.name}`}
            >
              <IconDotsVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isDisconnected ? (
              <DropdownMenuItem onSelect={() => onReconnect(account)}>
                <IconPlugConnected className="size-4" />
                Reconnect
              </DropdownMenuItem>
            ) : (
              <>
                {needsReauth && (
                  <>
                    <DropdownMenuItem onSelect={onReauthorize}>
                      <IconRefresh className="size-4" />
                      Reauthorize
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDisconnect(account)}
                >
                  <IconPlugOff className="size-4" />
                  Disconnect
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
