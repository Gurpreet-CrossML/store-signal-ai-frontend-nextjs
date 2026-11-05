"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IconLayoutSidebar, IconPlus } from "@tabler/icons-react";

import {
  CreateTicketAction,
  useCanCreateTicket,
} from "@/components/custom/helpdesk/create-ticket-action";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  HELPDESK_CHANNEL_RINGS,
  HELPDESK_VIEWS,
  helpdeskChannelRows,
  helpdeskViewCount,
  helpdeskViewUrl,
  keepHelpdeskListParams,
} from "@/lib/helpdesk-filters";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/hooks";

/** Tags listed before "Show all N tags". */
const VISIBLE_TAGS = 5;

/** The help desk's view counts (fetched by the app sidebar) and the open view. */
export function useHelpdeskViews() {
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const activeFilter = searchParams?.get("filter") ?? "";
  const { FetchSupportTicketFilterCountsData: counts } = useAppSelector(
    (state) =>
      state.GetSupportTicketsReducer.FetchSupportTicketFilterCountsState,
  );

  return {
    counts,
    activeFilter,
    /** A view's link, carrying the list's own filter and sort along. */
    hrefFor: (filter: string) =>
      keepHelpdeskListParams(helpdeskViewUrl(filter), search),
  };
}

function Count({ value, active }: { value?: number; active?: boolean }) {
  if (value === undefined) return null;
  return (
    <span
      className={cn(
        "ml-auto text-xs tabular-nums",
        active ? "font-semibold text-primary" : "text-muted-foreground",
      )}
    >
      {value}
    </span>
  );
}

/** A dot, a colour square or a ring: what marks a row of the panel. */
function RowMark({ className }: { className: string }) {
  return <span aria-hidden className={cn("shrink-0", className)} />;
}

function PanelRow({
  href,
  label,
  mark,
  count,
  active,
}: {
  href: string;
  label: string;
  mark: React.ReactNode;
  count?: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-foreground hover:bg-muted",
      )}
    >
      {mark}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <Count value={count} active={active} />
    </Link>
  );
}

function SectionHeading({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="flex items-center px-3 pt-2 pb-1">
      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {children}
      </span>
      <Count value={count} />
    </div>
  );
}

/**
 * The help desk's left panel: create a ticket, then its views, tags and
 * channels, each with its count for the status tab the list is on.
 *
 * Drawn in the app's sub-sidebar slot. `onCollapse` hides it; the ticket
 * list then offers the same views from its title.
 */
export function HelpdeskNavPanel({ onCollapse }: { onCollapse: () => void }) {
  const { counts, activeFilter, hrefFor } = useHelpdeskViews();
  const [showAllTags, setShowAllTags] = useState(false);

  const tags = (counts?.tags ?? []).filter((tag) => tag.count > 0);
  const visibleTags = showAllTags ? tags : tags.slice(0, VISIBLE_TAGS);
  const channels = helpdeskChannelRows(counts);

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
        <h2 className="text-lg font-semibold tracking-tight">Help Desk</h2>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Hide Help Desk menu"
          onClick={onCollapse}
        >
          <IconLayoutSidebar className="size-4" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4">
        <CreateTicketAction variant="panel" />

        <nav
          aria-label="Help desk views"
          className="mt-4 flex flex-col gap-0.5"
        >
          {HELPDESK_VIEWS.map((view) => (
            <PanelRow
              key={view.filter}
              href={hrefFor(view.filter)}
              label={view.label}
              mark={<RowMark className={cn("size-2 rounded-full", view.dot)} />}
              count={helpdeskViewCount(view.filter, counts)}
              active={activeFilter === view.filter}
            />
          ))}
        </nav>

        {tags.length > 0 ? (
          <>
            <div className="my-4 border-t" />
            <SectionHeading count={tags.length}>Tags</SectionHeading>
            <div className="flex flex-col gap-0.5">
              {visibleTags.map((tag) => {
                const filter = `tags:${tag.name}`;
                return (
                  <PanelRow
                    key={tag.id}
                    href={hrefFor(filter)}
                    label={tag.name}
                    mark={
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-[3px]"
                        style={{ backgroundColor: tag.color }}
                      />
                    }
                    count={tag.count}
                    active={activeFilter === filter}
                  />
                );
              })}
            </div>
            {tags.length > VISIBLE_TAGS ? (
              <button
                type="button"
                className="mt-1 ml-[2.125rem] py-1 text-left text-sm font-medium text-primary hover:underline"
                onClick={() => setShowAllTags((shown) => !shown)}
              >
                {showAllTags
                  ? "Show fewer tags"
                  : `Show all ${tags.length} tags`}
              </button>
            ) : null}
          </>
        ) : null}

        <div className="my-4 border-t" />
        <SectionHeading>Channels</SectionHeading>
        <div className="flex flex-col gap-0.5">
          {channels.map((channel) => (
            <PanelRow
              key={channel.value}
              href={hrefFor(channel.filter)}
              label={channel.label}
              mark={
                <RowMark
                  className={cn(
                    "size-2.5 rounded-full border-2",
                    HELPDESK_CHANNEL_RINGS[channel.value] ?? "border-zinc-500",
                  )}
                />
              }
              count={channel.count}
              active={activeFilter === channel.filter}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The views as dropdown menu items, for the ticket list's title once the
 * left panel is hidden and on the phone layout: create a ticket, the fixed
 * views, then the channels.
 *
 * `onCreateTicket` opens a dialog that lives outside the menu, since the
 * menu unmounts its items as it closes.
 */
export function HelpdeskViewsMenuItems({
  onCreateTicket,
  withTags = false,
}: {
  onCreateTicket?: () => void;
  /** Also list the tags: on a phone there is no panel to find them in. */
  withTags?: boolean;
}) {
  const { counts, activeFilter, hrefFor } = useHelpdeskViews();
  const channels = helpdeskChannelRows(counts);
  const canCreate = useCanCreateTicket();
  const tags = withTags
    ? (counts?.tags ?? []).filter((tag) => tag.count > 0)
    : [];

  return (
    <>
      {onCreateTicket && canCreate ? (
        <DropdownMenuItem
          onSelect={onCreateTicket}
          className="mb-1 justify-center gap-1.5 bg-primary py-2 font-medium text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground"
        >
          <IconPlus className="size-4 text-primary-foreground" />
          Create ticket
        </DropdownMenuItem>
      ) : null}
      {HELPDESK_VIEWS.map((view) => {
        const active = activeFilter === view.filter;
        return (
          <DropdownMenuItem
            key={view.filter}
            asChild
            className={cn(
              "gap-3 py-2",
              active &&
                "bg-primary/10 font-medium text-primary focus:bg-primary/10 focus:text-primary",
            )}
          >
            <Link href={hrefFor(view.filter)}>
              <RowMark className={cn("size-2 rounded-full", view.dot)} />
              <span className="flex-1">{view.label}</span>
              <Count
                value={helpdeskViewCount(view.filter, counts)}
                active={active}
              />
            </Link>
          </DropdownMenuItem>
        );
      })}
      {tags.length > 0 ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Tags
          </DropdownMenuLabel>
          {tags.map((tag) => {
            const filter = `tags:${tag.name}`;
            const active = activeFilter === filter;
            return (
              <DropdownMenuItem
                key={tag.id}
                asChild
                className={cn(
                  "gap-3 py-2",
                  active &&
                    "bg-primary/10 font-medium text-primary focus:bg-primary/10 focus:text-primary",
                )}
              >
                <Link href={hrefFor(filter)}>
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 truncate">{tag.name}</span>
                  <Count value={tag.count} active={active} />
                </Link>
              </DropdownMenuItem>
            );
          })}
        </>
      ) : null}
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        Channels
      </DropdownMenuLabel>
      {channels.map((channel) => {
        const active = activeFilter === channel.filter;
        return (
          <DropdownMenuItem
            key={channel.value}
            asChild
            className={cn(
              "gap-3 py-2",
              active &&
                "bg-primary/10 font-medium text-primary focus:bg-primary/10 focus:text-primary",
            )}
          >
            <Link href={hrefFor(channel.filter)}>
              <RowMark
                className={cn(
                  "size-2.5 rounded-full border-2",
                  HELPDESK_CHANNEL_RINGS[channel.value] ?? "border-zinc-500",
                )}
              />
              <span className="flex-1">{channel.label}</span>
              <Count value={channel.count} active={active} />
            </Link>
          </DropdownMenuItem>
        );
      })}
    </>
  );
}
