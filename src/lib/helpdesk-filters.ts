import {
  IconBroadcast,
  IconTag,
  IconTags,
  type Icon,
} from "@tabler/icons-react";

import type { SideBarMenuItem, SubSidebarMenuItem } from "@/lib/sidebar-navs";
import { CHANNEL_META } from "@/lib/ticket-options";
import type {
  SupportTicketChannel,
  SupportTicketFilterCounts,
  SupportTicket,
  SupportTicketFilters,
} from "@/redux/api-slice/support-ticket-slice";

/**
 * The help desk's left panel is a set of views of one screen, each named by
 * `/helpdesk?filter=<view>`:
 *
 * - a fixed view is one word (`unassigned`),
 * - a view of one value is `<param>:<value>` (`tags:Payment Failure`),
 *   where `param` is the ticket list filter it sets.
 *
 * This file is the one place that turns a `filter` into a ticket list query
 * and into the panel's rows, so the two cannot drift apart.
 */

const FIXED_VIEWS: Record<
  string,
  {
    query: SupportTicketFilters;
    count: (counts: SupportTicketFilterCounts) => number;
  }
> = {
  "": { query: {}, count: (counts) => counts.all },
  unassigned: {
    query: { is_assigned: false },
    count: (counts) => counts.unassigned,
  },
  assigned_to_me: {
    query: { assigned_to_me: true },
    count: (counts) => counts.assigned_to_me,
  },
  unread: { query: { is_read: false }, count: (counts) => counts.unread },
  // high_priority: {
  //   query: { priority: ["urgent", "high"] },
  //   count: (counts) => counts.high_priority,
  // },
  negative_sentiment: {
    query: { sentiment: ["negative"] },
    count: (counts) => counts.negative_sentiment,
  },
};

type ValueParam = "tags" | "channel";

const VALUE_PARAMS: readonly string[] = [
  "tags",
  "channel",
] satisfies ValueParam[];

/** `count` is missing until the counts have loaded. */
type CountRow = {
  value: string;
  label: string;
  count?: number;
  icon?: Icon;
  color?: string;
};

/** Channels listed in the panel for now; the backend still counts the rest. */
const SHOWN_CHANNELS: readonly string[] = [
  "web",
  // "email",
  // "whatsapp",
  // "facebook",
  // "instagram",
];

/**
 * A collapsible group of views that share one ticket list filter. Every row
 * is listed whether or not tickets match it, so the panel never changes shape
 * with the day's tickets.
 */
const COUNT_GROUPS: {
  title: string;
  icon: Icon;
  param: ValueParam;
  rows: (counts: SupportTicketFilterCounts | null) => CountRow[];
  /** The group's own count, shown on its heading. */
  total: (
    counts: SupportTicketFilterCounts,
    rows: CountRow[],
  ) => number | undefined;
}[] = [
  {
    title: "Tags",
    icon: IconTags,
    param: "tags",
    // The store's own tags, so a new one appears without a code change.
    // A tag no ticket carries is left out.
    rows: (counts) =>
      (counts?.tags ?? [])
        .filter((tag) => tag.count > 0)
        .map((tag) => ({
          value: tag.name,
          label: tag.name,
          count: tag.count,
          icon: IconTag,
          color: tag.color,
        })),
    // Not the rows' sum: a ticket with two tags is on two rows.
    total: (counts) => counts.tagged,
  },
  {
    title: "Channels",
    icon: IconBroadcast,
    param: "channel",
    // Only the channels in SHOWN_CHANNELS, whether or not tickets came
    // through them.
    rows: (counts) => {
      const counted = new Map(
        (counts?.channels ?? []).map((channel) => [channel.value, channel]),
      );

      return SHOWN_CHANNELS.map((value) => ({
        value,
        label:
          CHANNEL_META[value as SupportTicketChannel]?.label ??
          counted.get(value)?.label ??
          value,
        count: counts ? (counted.get(value)?.count ?? 0) : undefined,
        icon: CHANNEL_META[value as SupportTicketChannel]?.icon,
      }));
    },
    // A ticket has one channel, so the rows do add up — those shown, at least.
    total: (_counts, rows) =>
      rows.reduce((sum, row) => sum + (row.count ?? 0), 0),
  },
];

/**
 * The query params the list's own controls (the filter popover and the sort
 * menu) keep in the URL. They narrow whichever view is open, so moving to
 * another view carries them along.
 */
export const HELPDESK_LIST_PARAMS = [
  "priority",
  "from_date",
  "to_date",
  "sort",
] as const;

/**
 * `href`, if it is a help desk view, with the list params of `search`
 * (the current query string) added to it.
 */
export function keepHelpdeskListParams(href: string, search: string) {
  if (href.split("?")[0] !== "/helpdesk") return href;

  const current = new URLSearchParams(search);
  const kept = new URLSearchParams();
  for (const key of HELPDESK_LIST_PARAMS) {
    const value = current.get(key);
    if (value) kept.set(key, value);
  }

  const query = kept.toString();
  if (!query) return href;
  return `${href}${href.includes("?") ? "&" : "?"}${query}`;
}

/** The URL of the view showing one value of a filter. */
function valueViewUrl(param: ValueParam, value: string) {
  return `/helpdesk?filter=${encodeURIComponent(`${param}:${value}`)}`;
}

/**
 * The ticket list query a `filter` stands for.
 *
 * Anything unrecognised (a stale bookmark) is the unfiltered list rather
 * than an error.
 */
export function helpdeskFilterToQuery(filter: string): SupportTicketFilters {
  const fixed = FIXED_VIEWS[filter];
  if (fixed) return fixed.query;

  const separator = filter.indexOf(":");
  const param = filter.slice(0, separator);
  if (separator === -1 || !VALUE_PARAMS.includes(param)) return {};

  return { [param]: [filter.slice(separator + 1)] } as SupportTicketFilters;
}

/**
 * Whether a ticket, as it now stands, still belongs in the list of a `filter`.
 *
 * Only the views a ticket can leave by being edited in place are decided here
 * (who it is assigned to, its sentiment); every other view says yes, so the
 * list keeps the ticket until it is next fetched.
 */
export function ticketBelongsToHelpdeskFilter(
  filter: string,
  ticket: Pick<SupportTicket, "internal_assignee" | "sentiment">,
  userEmail?: string | null,
) {
  const assignee = ticket.internal_assignee;

  switch (filter) {
    case "unassigned":
      return !assignee;
    case "assigned_to_me":
      return (
        Boolean(assignee?.email) &&
        assignee?.email?.toLowerCase() === userEmail?.toLowerCase()
      );
    case "negative_sentiment":
      return ticket.sentiment === "negative";
    default:
      return true;
  }
}

/** The ticket count of the fixed view a sidebar url points at, if it is one. */
function fixedViewCount(url: string, counts: SupportTicketFilterCounts | null) {
  const filter = new URLSearchParams(url.split("?")[1] ?? "").get("filter");
  return counts ? FIXED_VIEWS[filter ?? ""]?.count(counts) : undefined;
}

/**
 * The help desk's sub-sidebar with its counts filled in and the data-driven
 * groups (tags, channels) appended.
 *
 * Every view is listed even before the counts arrive, or when they fail to:
 * it then just shows no number.
 */
export function withHelpdeskCounts(
  sidebar: SubSidebarMenuItem,
  counts: SupportTicketFilterCounts | null,
): SubSidebarMenuItem {
  const groups = COUNT_GROUPS.flatMap(({ title, icon, param, rows, total }) => {
    const groupRows = rows(counts);
    const items: SideBarMenuItem[] = groupRows.map((row) => ({
      title: row.label,
      url: valueViewUrl(param, row.value),
      icon: row.icon ?? icon,
      count: row.count,
      color: row.color,
    }));
    return items.length
      ? [
          {
            title,
            url: "",
            icon,
            items,
            count: counts ? total(counts, groupRows) : undefined,
          },
        ]
      : [];
  });

  return {
    ...sidebar,
    items: [
      ...sidebar.items.map((item) => ({
        ...item,
        count: fixedViewCount(item.url, counts),
      })),
      ...groups,
    ],
  };
}
