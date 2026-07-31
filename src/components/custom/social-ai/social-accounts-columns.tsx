"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ConnectedAccount } from "@/redux/api-slice/social-ai-slice";

import { Badge } from "@/components/ui/badge";
import { SocialAIPlatformOptions } from "@/lib/config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  IconDotsVertical,
  IconEye,
  IconPlugOff,
  IconRosetteDiscountCheckFilled,
} from "@tabler/icons-react";

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

export const SocialAccountsColumns: ColumnDef<ConnectedAccount>[] = [
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
            <span title={name} className="flex items-center gap-1 font-semibold">
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

  // Status — active vs inactive pill.
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <Badge
          variant="secondary"
          className={cn(
            isActive
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              : "bg-muted text-muted-foreground",
          )}
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },

  // Webhook subscription — toggle with On/Off label.
  {
    accessorKey: "webhook_status",
    header: "Webhook Subscription",
    enableSorting: false,
    cell: ({ row }) => {
      const isSubscribed = row.original.webhook_status === "active";
      return (
        <div className="flex items-center gap-2">
          <Switch
            id={`subscription-${row.original.id}`}
            checked={isSubscribed}
          />
          <span className="text-sm text-muted-foreground">
            {isSubscribed ? "On" : "Off"}
          </span>
        </div>
      );
    },
  },

  {
    accessorKey: "auto_response_enabled",
    header: "Auto Responses",
    cell: ({ row }) => {
      return <Switch id={`auto-response-${row.original.id}`} />;
    },
  },

  // Connected On — date over time, matching the two-line design.
  {
    accessorKey: "created_at",
    header: "Connected On",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5 whitespace-nowrap">
        <span className="text-sm font-medium">
          {formatDate(row.original.created_at)}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatTime(row.original.created_at)}
        </span>
      </div>
    ),
  },

  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            View Details
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={`More actions for ${row.original.name}`}
              >
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <IconEye className="size-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <IconPlugOff className="size-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
