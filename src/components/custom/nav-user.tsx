"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { IconCheck, IconLogout, IconSettings } from "@tabler/icons-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { getInitials } from "@/components/custom/customer-avatar";
import { isNavItemVisible, sidebarMenus } from "@/lib/sidebar-navs";
import { capitalizeText } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";

type AgentStatus = "online" | "away";

const STATUS_KEY = "storesignal.agent-status";
const STATUS_OPTIONS: { value: AgentStatus; label: string; dot: string }[] = [
  { value: "online", label: "Online", dot: "bg-emerald-500" },
  { value: "away", label: "Away", dot: "bg-amber-500" },
];

/*
 * shortcut: the status lives in this browser only — the backend has no
 * agent presence yet, so teammates do not see it. Move it to the API when
 * presence is built.
 */
const statusListeners = new Set<() => void>();

function readStatus(): AgentStatus {
  try {
    return window.localStorage.getItem(STATUS_KEY) === "away"
      ? "away"
      : "online";
  } catch {
    return "online";
  }
}

function writeStatus(status: AgentStatus) {
  try {
    window.localStorage.setItem(STATUS_KEY, status);
  } catch {
    // Storage blocked: the choice lasts until the page reloads.
  }
  statusListeners.forEach((listener) => listener());
}

function subscribeStatus(listener: () => void) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

const subscribeNothing = () => () => {};

/** The signed-in user's avatar, menu, status choice and log out, in the rail. */
export function NavUser() {
  const { isMobile } = useSidebar();
  const { data } = useSession();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const status = useSyncExternalStore(
    subscribeStatus,
    readStatus,
    () => "online" as AgentStatus,
  );

  // The server renders without a session; showing the user only after
  // hydration keeps the first client render identical to it.
  const hydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const user = hydrated ? data?.user : undefined;
  const initials = getInitials(user?.name || user?.email) ?? "?";
  const role = user?.role ? capitalizeText(user.role.replace(/_/g, " ")) : null;
  const settingsItem = sidebarMenus.nav.find(
    (item) => item.subSidebarKey === "settings",
  );
  const canOpenSettings = settingsItem
    ? isNavItemVisible(settingsItem, user)
    : false;
  const statusDot =
    STATUS_OPTIONS.find((option) => option.value === status)?.dot ??
    "bg-emerald-500";

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                aria-label="Account menu"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <span className="relative">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-sidebar",
                      statusDot,
                    )}
                  />
                </span>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 rounded-lg p-1.5"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="px-2 py-1.5 font-normal">
                <span className="block truncate text-base font-semibold">
                  {user?.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[role, user?.email].filter(Boolean).join(" · ")}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="px-2 pt-1.5 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Your status
              </DropdownMenuLabel>
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => writeStatus(option.value)}
                  className="gap-2.5 py-2"
                >
                  <span className={cn("size-2 rounded-full", option.dot)} />
                  <span className="flex-1">{option.label}</span>
                  {status === option.value ? (
                    <IconCheck className="size-4 text-primary" />
                  ) : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {canOpenSettings && settingsItem ? (
                <DropdownMenuItem asChild className="py-2">
                  <Link href={settingsItem.url}>
                    <IconSettings />
                    Settings
                  </Link>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                variant="destructive"
                className="py-2"
                onSelect={() => setShowLogoutAlert(true)}
              >
                <IconLogout />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Logout Alert Dialog */}
      <AlertDialog open={showLogoutAlert} onOpenChange={setShowLogoutAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You will need to log in again
              to access the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                signOut({ callbackUrl: "/login" });
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
