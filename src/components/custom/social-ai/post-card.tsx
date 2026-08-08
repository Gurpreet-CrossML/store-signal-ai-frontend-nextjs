"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { SocialPost } from "@/redux/api-slice/social-ai-slice";
import {
  IconExternalLink,
  IconNews,
  IconRosetteDiscountCheckFilled,
} from "@tabler/icons-react";
import Image from "next/image";

import { useAccountIdentity, useChannel } from "./channel-context";
import { CommentsSection } from "./comments";
import { ExpandableText } from "./expandable-text";
import { DEFAULT_MEDIA_SIZE, MediaCarousel } from "./media-carousel";
import { formatPostedAt } from "./format";

/**
 * The open post: a fixed header identifying the page, then the post's own
 * content, media and engagement counts, with its comments below. Flat
 * rather than a card — it fills the detail pane the way the open
 * conversation does in the DM inbox.
 */
/** 12.4K rather than 12400 — these sit in a narrow metric column. */
function formatCount(value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function PostMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-w-16 flex-col items-center gap-0.5">
      <Typography variant="muted">{label}</Typography>
      <Typography variant="large" as="span">
        {formatCount(value)}
      </Typography>
    </div>
  );
}

/**
 * The open post: a compact summary strip — media, caption and the
 * engagement numbers — pinned above its comments, which get the remaining
 * height. The media is sized down rather than full-bleed because the
 * comments are the work here, but it stays a real carousel or video player
 * so nothing is lost.
 */
export function SocialPostDetail({ post }: { post: SocialPost }) {
  const account = useAccountIdentity();
  const channel = useChannel();
  const media = post.media_entries[0];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2.5 border-b bg-background px-4">
        <Avatar>
          {account.profilePictureUrl ? (
            <AvatarImage src={account.profilePictureUrl} alt={account.name} />
          ) : (
            <AvatarFallback className="font-medium">
              {account.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-1 truncate leading-tight">
            {account.name}
            <IconRosetteDiscountCheckFilled className="size-4 shrink-0 text-sky-500" />
          </CardTitle>
          <Typography variant="muted" className="truncate">
            {formatPostedAt(post.posted_at)}
          </Typography>
        </div>
        {post.permalink && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="ml-auto shrink-0"
          >
            <a href={post.permalink} target="_blank" rel="noopener noreferrer">
              <IconExternalLink className="size-4" />
              View on {channel.label}
            </a>
          </Button>
        )}
      </header>

      {/* Summary strip — stays put so scrolling moves the comments only. */}
      <div className="flex shrink-0 items-start gap-4 border-b p-4">
        {/* Real media, not a still: a carousel post keeps its slides and a
            video stays playable, just sized to leave room for the comments. */}
        <div className="w-56 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {post.media_entries.length > 1 ? (
            <MediaCarousel mediaEntries={post.media_entries} />
          ) : post.media_type === "video" && media ? (
            <video
              controls
              preload="metadata"
              src={media.url}
              className="h-auto w-full"
            />
          ) : media ? (
            <a
              href={post.permalink || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Image
                src={media.url}
                alt="Post media"
                width={media.width ?? DEFAULT_MEDIA_SIZE}
                height={media.height ?? DEFAULT_MEDIA_SIZE}
                unoptimized
                className="h-auto w-full object-cover"
              />
            </a>
          ) : (
            <div className="flex h-32 items-center justify-center">
              <IconNews className="size-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* max-h-56 mirrors the media column's w-56: for a squarish post the
            caption runs exactly as tall as the image beside it, and only
            then collapses to "See more". */}
        <div className="min-w-0 flex-1">
          <ExpandableText text={post.content} maxHeightClass="max-h-56" />
        </div>

        <Separator orientation="vertical" className="self-stretch" />
        <div className="flex shrink-0 items-start gap-6">
          <PostMetric label="Likes" value={post.like_count} />
          <PostMetric label="Comments" value={post.comments_count} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {/* Comments are addressed by the post's external Graph id. */}
        <CommentsSection postId={post.external_id} />
      </div>
    </div>
  );
}

/** Row placeholder while the posts list is loading. */
export function SocialPostRowSkeleton() {
  return (
    <div className="flex items-start gap-3 border-b p-4">
      <Skeleton className="size-12 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
