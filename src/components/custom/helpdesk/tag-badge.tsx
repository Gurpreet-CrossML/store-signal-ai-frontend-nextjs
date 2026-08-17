"use client";

import { IconX } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { SupportTicketTagData } from "@/redux/api-slice/support-ticket-slice";

/**
 * One tag chip. A tag used to be drawn three different ways — a bespoke
 * span in the list, a Badge in the header, another in the hover card — so
 * the same tag changed shape as you moved across the screen.
 */
export function TagBadge({
  tag,
  onRemove,
}: {
  tag: SupportTicketTagData;
  onRemove?: () => void;
}) {
  return (
    <Badge
      variant="outline"
      className="max-w-40"
      style={
        tag.color
          ? { color: tag.color, borderColor: `${tag.color}40` }
          : undefined
      }
    >
      <span className="truncate">{tag.name}</span>
      {onRemove ? (
        // Same remove affordance as ChipList: sized explicitly (Badge's
        // `[&>svg]:size-3` only reaches direct children, and this icon is
        // nested in the button) and dimmed so the tag reads before the X.
        <button
          type="button"
          aria-label={`Remove tag ${tag.name}`}
          className="ml-0.5 cursor-pointer opacity-60 hover:opacity-100"
          onClick={onRemove}
        >
          <IconX className="size-3" />
        </button>
      ) : null}
    </Badge>
  );
}

/** The "+2" chip revealing the tags that didn't fit. */
export function HiddenTagsBadge({
  tags,
  label,
  onRemoveTag,
}: {
  tags: SupportTicketTagData[];
  label: string;
  onRemoveTag?: (tagId: number) => void;
}) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Badge variant="outline" className="cursor-default">
          {label}
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="flex w-auto max-w-xs flex-wrap gap-1.5"
      >
        {tags.map((tag) => {
          const tagId = tag.id;
          return (
            <TagBadge
              key={tagId}
              tag={tag}
              onRemove={
                onRemoveTag && tagId ? () => onRemoveTag(tagId) : undefined
              }
            />
          );
        })}
      </HoverCardContent>
    </HoverCard>
  );
}
