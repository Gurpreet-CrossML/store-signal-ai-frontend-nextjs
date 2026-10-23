"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  IconBell,
  IconChevronRight,
  IconHeadset,
  IconMessageDots,
  IconUserPlus,
  IconX,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupportDashboardEvents } from "@/hooks/use-support-dashboard-events";
import { formatRelativeTime } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import {
  FetchNotifications,
  FetchNotificationCounts,
  MarkNotificationRead,
  notificationReceived,
  type AgentNotification,
  type NotificationTab,
  type NotificationType,
} from "@/redux/api-slice/notification-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const TYPE_ICONS: Record<NotificationType, typeof IconBell> = {
  ticket_assigned: IconUserPlus,
  ticket_message: IconMessageDots,
  chat_assigned: IconHeadset,
  chat_message: IconMessageDots,
};

const TABS: { value: NotificationTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "tickets", label: "Tickets" },
  { value: "messages", label: "Messages" },
];

// Smooth deceleration, no overshoot: a list that bounces reads as jitter.
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Badge text: exact up to the hundreds, then capped so it stays a pill. */
function badgeText(count: number) {
  return count > 999 ? "999+" : String(count);
}

/** A message notification quotes the customer; the others read as is. */
function previewText(notification: AgentNotification) {
  return notification.notification_type.endsWith("_message")
    ? `“${notification.message}”`
    : notification.message;
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const Icon = TYPE_ICONS[type];
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Icon className="size-5" />
    </span>
  );
}

/** The toast a new notification arrives as. */
function NotificationToast({
  notification,
  onOpen,
  onDismiss,
}: {
  notification: AgentNotification;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex w-(--width) items-center gap-3 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <NotificationIcon type={notification.notification_type} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">
            {notification.title}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {previewText(notification)}
          </span>
        </span>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <IconX />
      </Button>
    </div>
  );
}

function NotificationRow({
  notification,
  live,
  onOpen,
}: {
  notification: AgentNotification;
  /** Arrived over the socket while listed, so it slides in from the top. */
  live: boolean;
  onOpen: (notification: AgentNotification) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    // Only the new row animates: growing its own height pushes the rows
    // below down smoothly, with no layout measuring inside the scroller
    // (see MessageAppear). Loaded pages appear without motion.
    <motion.li
      initial={
        live
          ? reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, height: 0 }
          : false
      }
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: reduceMotion ? 0.15 : 0.4, ease: EASE_OUT }}
      className="overflow-hidden"
    >
      {/* Padding, not a list gap: the gap would jump in at the end of the
          height animation. */}
      <motion.div
        initial={live && !reduceMotion ? { y: -16 } : false}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className="pb-2"
      >
        <button
          type="button"
          onClick={() => onOpen(notification)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            !notification.is_read && "border-primary/15 bg-primary/5",
          )}
        >
          <NotificationIcon type={notification.notification_type} />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-semibold">
                {notification.title}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatRelativeTime(notification.created_at)} ago
              </span>
            </span>
            <span className="mt-0.5 block truncate text-sm text-muted-foreground">
              {previewText(notification)}
            </span>
          </span>
          <IconChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </motion.div>
    </motion.li>
  );
}

/**
 * The bell in the sidebar rail, its unread badge, and the drawer listing the
 * agent's notifications. The rail is on every page, so every role has it.
 *
 * New notifications arrive on the dashboard socket (only the agent's own —
 * the backend sends them to that agent's group alone): each one raises a
 * toast, bumps the counts and, when the drawer is open, slides in at the
 * top of the list. Opening one marks it read and goes to its ticket or
 * live chat.
 */
export function NotificationBell() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  // Ids pushed live this session; only these rows animate in.
  const [liveIds, setLiveIds] = useState<ReadonlySet<number>>(new Set());

  const counts = useAppSelector(
    (state) =>
      state.GetNotificationReducer.FetchNotificationCountsState
        .FetchNotificationCountsData,
  );
  const unreadCount = counts.unread;
  const {
    FetchNotificationsIsLoading,
    FetchNotificationsListData,
    FetchNotificationsTab: tab,
    FetchNotificationsPage: page,
  } = useAppSelector(
    (state) => state.GetNotificationReducer.FetchNotificationsState,
  );
  const { next, results } = FetchNotificationsListData;
  const selectedStore = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  // Notifications are per store: the counts (badge and tabs) are the
  // selected store's, loaded once the agent is logged in and again whenever
  // the store changes; the socket keeps them current in between.
  useEffect(() => {
    if (status === "authenticated" && selectedStore) {
      void dispatch(FetchNotificationCounts({ storeCode: selectedStore }));
    }
  }, [dispatch, status, selectedStore]);

  const loadTab = (value: NotificationTab) => {
    if (!selectedStore) return;
    void dispatch(
      FetchNotifications({ storeCode: selectedStore, tab: value, page: 1 }),
    );
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    // A fresh first page on every open also brings in anything missed while
    // the socket was down. Closing ends the "just arrived" state, so those
    // rows do not slide in again next time.
    if (value) {
      loadTab(tab);
      if (selectedStore) {
        void dispatch(FetchNotificationCounts({ storeCode: selectedStore }));
      }
    } else {
      setLiveIds(new Set());
    }
  };

  const openNotification = (notification: AgentNotification) => {
    if (!notification.is_read)
      void dispatch(
        MarkNotificationRead({
          storeCode: selectedStore,
          notification,
        }),
      );
    router.push(
      notification.ticket !== null
        ? `/helpdesk?ticket=${notification.ticket}`
        : `/support?chat=${encodeURIComponent(notification.thread ?? "")}`,
    );
    handleOpenChange(false);
  };

  useSupportDashboardEvents((event) => {
    if (event.action_type !== "notification") return;

    const notification = event.data;
    setLiveIds((ids) => new Set(ids).add(notification.id));
    dispatch(notificationReceived(notification));
    toast.custom(
      (id) => (
        <NotificationToast
          notification={notification}
          onOpen={() => {
            toast.dismiss(id);
            openNotification(notification);
          }}
          onDismiss={() => toast.dismiss(id)}
        />
      ),
      { position: "top-center", duration: 6000 },
    );
  });

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (!next || FetchNotificationsIsLoading) return;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 120) {
      void dispatch(
        FetchNotifications({ storeCode: selectedStore, tab, page: page + 1 }),
      );
    }
  };

  const isFirstLoad = FetchNotificationsIsLoading && results.length === 0;

  return (
    <>
      {/* overflow-visible: the badge hangs off the button's corner. No text
          label, which would spill out of the 36px rail button; the tooltip
          and aria-label name it instead. */}
      <SidebarMenuButton
        tooltip="Notifications"
        className="relative overflow-visible"
        aria-label={
          unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"
        }
        onClick={() => handleOpenChange(true)}
      >
        <IconBell />
        {unreadCount > 0 && (
          // Centred on the bell icon's top-right corner (left-7 is the icon's
          // right edge in the 36px rail button), so a longer count spreads
          // both ways: "3" sits on the corner, "999+" covers only the bell's
          // top and still fits inside the rail.
          <span className="absolute -top-1.5 left-7 flex h-4.5 min-w-4.5 -translate-x-1/2 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-white tabular-nums ring-2 ring-sidebar">
            {badgeText(unreadCount)}
          </span>
        )}
      </SidebarMenuButton>

      <Drawer direction="right" open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:rounded-none data-[vaul-drawer-direction=right]:sm:max-w-md">
          <DrawerHeader className="flex-row items-center justify-between gap-2 pb-2">
            <DrawerTitle className="text-xl font-semibold">
              Notifications
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Your ticket and live chat notifications, newest first.
            </DrawerDescription>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close notifications"
              >
                <IconX />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <Tabs
            value={tab}
            onValueChange={(value) => loadTab(value as NotificationTab)}
            className="px-4 pb-3"
          >
            <TabsList className="h-auto w-full gap-2 bg-transparent p-0">
              {TABS.map(({ value, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-lg border-border bg-muted/40 py-1.5 data-active:border-primary/20 data-active:bg-primary/10 data-active:text-primary data-active:shadow-none"
                >
                  {label} ({counts[value]})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div
            className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
            onScroll={handleScroll}
          >
            {isFirstLoad ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : results.length === 0 ? (
              <Empty className="py-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconBell />
                  </EmptyMedia>
                  <EmptyTitle>No notifications</EmptyTitle>
                  <EmptyDescription>
                    Ticket and live chat updates meant for you show up here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              // Keyed by tab: switching tabs swaps the list outright
              // instead of animating one list into the other.
              <ul key={tab}>
                {results.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    live={liveIds.has(notification.id)}
                    onOpen={openNotification}
                  />
                ))}
              </ul>
            )}
            {FetchNotificationsIsLoading && results.length > 0 && (
              <div className="flex justify-center py-3">
                <Spinner />
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
