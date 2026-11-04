"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  IconBell,
  IconHeadset,
  IconMessageDots,
  IconUserPlus,
  IconX,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useSupportDashboardEvents } from "@/hooks/use-support-dashboard-events";
import { formatRelativeTime } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import {
  FetchMoreNotifications,
  FetchNotifications,
  FetchNotificationCounts,
  MarkNotificationRead,
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

/** "12 min ago", "21 h ago": the relative time as the notifications list says it. */
function timeAgo(value: string) {
  const short = formatRelativeTime(value);
  const match = /^(d+)(mo|m|h|d|w)$/.exec(short);
  if (!match) return short;
  const unit = { m: "min", h: "h", d: "d", w: "w", mo: "mo" }[match[2]];
  return `${match[1]} ${unit} ago`;
}

/** A message notification quotes the customer; the others read as is. */
function previewText(notification: AgentNotification) {
  return notification.notification_type.endsWith("_message")
    ? `“${notification.message}”`
    : notification.message;
}

function showDesktopNotification(
  notification: AgentNotification,
  onOpen: () => void,
) {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  // An active Store Signal tab must never show a Chrome notification.
  if (document.visibilityState === "visible") {
    return;
  }

  const desktopNotification = new Notification("Store Signal", {
    body: `${notification.title}\n\n${notification.message}`,
    tag: `store-signal-notification-${notification.id}`,
  });

  desktopNotification.onclick = () => {
    window.focus();
    desktopNotification.close();
    onOpen();
  };
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
        className="border-b last:border-b-0"
      >
        <button
          type="button"
          onClick={() => onOpen(notification)}
          className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
        >
          <span
            aria-hidden
            className={cn(
              "mt-1.5 size-2 shrink-0 rounded-full",
              notification.is_read ? "bg-transparent" : "bg-primary",
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm leading-snug text-foreground">
              {notification.title}
            </span>
            {notification.message ? (
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                {previewText(notification)}
              </span>
            ) : null}
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {timeAgo(notification.created_at)}
            </span>
          </span>
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
  // The open tab and the last page loaded in it.
  const [tab, setTab] = useState<NotificationTab>("all");
  const [page, setPage] = useState(1);
  // Ids pushed live this session; only these rows animate in.
  const [liveIds, setLiveIds] = useState<ReadonlySet<number>>(new Set());

  const counts = useAppSelector(
    (state) =>
      state.GetNotificationReducer.FetchNotificationCountsState
        .FetchNotificationCountsData,
  );
  const unreadCount = counts.unread;
  const { FetchNotificationsIsLoading, FetchNotificationsListData } =
    useAppSelector(
      (state) => state.GetNotificationReducer.FetchNotificationsState,
    );
  const { FetchMoreNotificationsIsLoading } = useAppSelector(
    (state) => state.GetNotificationReducer.FetchMoreNotificationsState,
  );
  const { next, results } = FetchNotificationsListData;
  const selectedStore = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const loadCounts = () => {
    if (selectedStore) {
      void dispatch(FetchNotificationCounts({ storeCode: selectedStore }));
    }
  };

  // Notifications are per store: the counts (badge and tabs) are the
  // selected store's, loaded once the agent is logged in and again whenever
  // the store changes.
  useEffect(() => {
    if (status === "authenticated" && selectedStore) {
      void dispatch(FetchNotificationCounts({ storeCode: selectedStore }));
    }
  }, [dispatch, status, selectedStore]);

  /** Shows the first page of a tab. */
  const loadTab = (value: NotificationTab) => {
    if (!selectedStore) return;
    setTab(value);
    setPage(1);
    void dispatch(FetchNotifications({ storeCode: selectedStore, tab: value }));
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    // A fresh first page on every open also brings in anything missed while
    // the socket was down. Closing ends the "just arrived" state, so those
    // rows do not slide in again next time.
    if (value) {
      loadTab(tab);
      loadCounts();
    } else {
      setLiveIds(new Set());
    }
  };

  const openNotification = (notification: AgentNotification) => {
    if (!notification.is_read) {
      // The badge drops once the backend has it as read.
      void dispatch(
        MarkNotificationRead({ storeCode: selectedStore, id: notification.id }),
      ).then(loadCounts);
    }
    router.push(
      notification.ticket !== null
        ? `/helpdesk?ticket=${notification.ticket}`
        : `/support?chat=${encodeURIComponent(notification.thread ?? "")}`,
    );
    handleOpenChange(false);
  };

  // The backend pushes only the selected store's notifications. Each one
  // refreshes the counts and, with the drawer open, its first page, where
  // the new row slides in at the top.
  useSupportDashboardEvents((event) => {
    if (event.action_type !== "notification") return;

    const notification = event.data;
    setLiveIds((ids) => new Set(ids).add(notification.id));
    loadCounts();
    if (open) loadTab(tab);
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
    // The drawer always receives every notification without browser
    // permission. When permission is granted, mirror every drawer type as a
    // desktop alert while the Store Signal tab is in the background.
    showDesktopNotification(notification, () => openNotification(notification));
  });

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (!next || FetchNotificationsIsLoading || FetchMoreNotificationsIsLoading)
      return;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 120) {
      void dispatch(
        FetchMoreNotifications({
          storeCode: selectedStore,
          tab,
          page: page + 1,
        }),
      ).then((result) => {
        if (FetchMoreNotifications.fulfilled.match(result)) setPage(page + 1);
      });
    }
  };

  const isFirstLoad = FetchNotificationsIsLoading && results.length === 0;
  // The bell toggles the popover itself, so a click on it is not "outside".
  const bellRef = useRef<HTMLDivElement | null>(null);

  // There is no "mark all" endpoint: the unread ones on screen are marked
  // one by one, then the counts and the page are fetched again.
  const markAllRead = async () => {
    if (!selectedStore) return;
    const unread = results.filter((notification) => !notification.is_read);
    await Promise.all(
      unread.map((notification) =>
        dispatch(
          MarkNotificationRead({
            storeCode: selectedStore,
            id: notification.id,
          }),
        ),
      ),
    );
    loadCounts();
    loadTab(tab);
  };

  return (
    <>
      {/* overflow-visible: the badge hangs off the button's corner. No text
          label, which would spill out of the 36px rail button; the tooltip
          and aria-label name it instead. */}
      <Popover open={open} onOpenChange={handleOpenChange}>
        {/* An anchor, not a trigger: with its tooltip the rail button renders
            a tooltip wrapper, which a trigger cannot attach to. */}
        <PopoverAnchor asChild>
          <div ref={bellRef}>
            <SidebarMenuButton
              onClick={() => handleOpenChange(!open)}
              tooltip="Notifications"
              className="relative overflow-visible"
              aria-label={
                unreadCount
                  ? `Notifications, ${unreadCount} unread`
                  : "Notifications"
              }
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
          </div>
        </PopoverAnchor>
        <PopoverContent
          side="right"
          align="end"
          sideOffset={12}
          onInteractOutside={(event) => {
            if (bellRef.current?.contains(event.target as Node)) {
              event.preventDefault();
            }
          }}
          className="flex max-h-[min(32rem,80vh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden p-0"
        >
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <h2 className="text-base font-semibold">Notifications</h2>
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
              disabled={unreadCount === 0}
              onClick={() => void markAllRead()}
            >
              Mark all as read
            </button>
          </div>
          <div
            role="tablist"
            aria-label="Notification types"
            className="flex gap-1 overflow-x-auto border-b px-3 py-2 [scrollbar-width:none]"
          >
            {TABS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => tab !== value && loadTab(value)}
                className={cn(
                  "shrink-0 rounded-md px-2 py-1 text-xs whitespace-nowrap transition-colors",
                  tab === value
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label} ({counts[value]})
              </button>
            ))}
          </div>
          <div
            className="min-h-0 flex-1 overflow-y-auto"
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
            {FetchMoreNotificationsIsLoading && (
              <div className="flex justify-center py-3">
                <Spinner />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
