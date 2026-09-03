"use client";

import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import {
  IconBuildingStore,
  IconDotsVertical,
  IconCode,
  IconPlugOff,
  IconShieldLock,
} from "@tabler/icons-react";

import { STORE_PLATFORMS } from "@/lib/config";
import { formatDate } from "@/lib/helpers";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StoreListItem } from "@/redux/api-slice/stores-slice";

export type StoreRowActions = {
  /** Code of the store the dashboard is currently working on. */
  selectedStore: string;
  onEditAllowedIps: (store: StoreListItem) => void;
  onGetWidgetScript: (store: StoreListItem) => void;
  onSelect: (store: StoreListItem) => void;
  onDeactivate: (store: StoreListItem) => void;
};

export function getStoreColumns({
  selectedStore,
  onEditAllowedIps,
  onGetWidgetScript,
  onSelect,
  onDeactivate,
}: StoreRowActions): ColumnDef<StoreListItem>[] {
  return [
    {
      accessorKey: "name",
      header: "Store",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            {row.original.name}
          </span>
          {row.original.code === selectedStore && <Badge>Selected</Badge>}
        </div>
      ),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "platform",
      header: "Platform",
      cell: ({ row }) => {
        const platform = STORE_PLATFORMS.find(
          (p) => p.value === row.original.platform,
        );
        if (!platform)
          return (
            <span className="text-muted-foreground">
              {row.original.platform || "—"}
            </span>
          );
        return (
          <div className="flex items-center gap-2">
            <Image
              src={platform.icon}
              alt=""
              width={16}
              height={16}
              className="size-4 object-contain"
            />
            <span>{platform.label}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "default_language",
      header: "Language",
      cell: ({ row }) => (
        <span className="text-muted-foreground uppercase">
          {row.original.default_language || "—"}
        </span>
      ),
    },
    {
      accessorKey: "is_follow_ups_allowed",
      header: "Follow-ups",
      cell: ({ row }) => {
        const allowed = row.original.is_follow_ups_allowed;
        return (
          <Badge
            variant="outline"
            className={cn(BADGE_TONE_STYLES[allowed ? "success" : "warning"])}
          >
            {allowed ? "Allowed" : "Off"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "allowed_ips_count",
      header: "Widget Visibility",
      cell: ({ row }) => {
        const count = row.original.allowed_ips_count;
        return (
          <Badge
            variant="outline"
            className={cn(BADGE_TONE_STYLES[count > 0 ? "warning" : "success"])}
          >
            {count > 0
              ? `Restricted to ${count} ${count === 1 ? "IP" : "IPs"}`
              : "Public"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.original.is_active !== false;
        return (
          <Badge
            variant="outline"
            className={cn(BADGE_TONE_STYLES[active ? "success" : "danger"])}
          >
            {active ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const store = row.original;
        const isSelected = store.code === selectedStore;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${store.name}`}
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem onSelect={() => onEditAllowedIps(store)}>
                  <IconShieldLock />
                  Edit allowed IPs
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onGetWidgetScript(store)}>
                  <IconCode />
                  Get widget script
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isSelected}
                  onSelect={() => onSelect(store)}
                >
                  <IconBuildingStore />
                  {isSelected ? "Currently selected" : "Work on this store"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={store.is_active === false}
                  className="text-destructive focus:text-destructive"
                  onSelect={() => onDeactivate(store)}
                >
                  <IconPlugOff />
                  Deactivate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
