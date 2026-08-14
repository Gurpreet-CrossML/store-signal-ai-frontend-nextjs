"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { SocialPost } from "@/redux/api-slice/social-ai-slice";
import {
  IconExternalLink,
  IconMessageCircle,
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
/** 12.4K rather than 12400 — engagement counts run long on a live page. */
function formatCount(value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
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

      {/* Read top to bottom the way the post reads on the platform:
          caption, then the media it is about, then what it earned, then
          the conversation under it. The whole thing scrolls as one — the
          media is part of the post, not a fixed panel above the comments,
          so an agent working through a long thread can scroll it away. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {post.content ? (
          <div className="px-4 pt-4">
            <ExpandableText text={post.content} maxHeightClass="max-h-40" />
          </div>
        ) : null}

        {/* Full width, letterboxed on a muted ground rather than cropped:
            a portrait post is as common as a square one, and cropping to
            fill hides the part a comment is usually about. */}
        {post.media_entries.length > 0 ? (
          <div className="mt-3 flex justify-center border-y bg-muted">
            {post.media_entries.length > 1 ? (
              // No height cap here: the carousel's slides cap themselves,
              // and constraining its viewport as well is what broke it.
              <div className="w-full">
                <MediaCarousel mediaEntries={post.media_entries} />
              </div>
            ) : post.media_type === "video" && media ? (
              <video
                controls
                preload="metadata"
                src={media.url}
                className="max-h-112 w-auto"
              />
            ) : media ? (
              <a
                href={post.permalink || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex"
              >
                <Image
                  src={media.url}
                  alt="Post media"
                  width={media.width ?? DEFAULT_MEDIA_SIZE}
                  height={media.height ?? DEFAULT_MEDIA_SIZE}
                  unoptimized
                  className="max-h-112 w-auto object-contain"
                />
              </a>
            ) : null}
          </div>
        ) : null}

        {/* The engagement bar, where the platform puts it: between the
            post and its comments, separating one from the other. */}
        <div className="flex items-center gap-4 border-b px-4 py-2.5 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <channel.LikeIcon className="size-4" />
            <Typography variant="small" as="span" className="font-normal">
              {formatCount(post.like_count)}
            </Typography>
          </span>
          <span className="flex items-center gap-1.5">
            <IconMessageCircle className="size-4" />
            <Typography variant="small" as="span" className="font-normal">
              {formatCount(post.comments_count)}{" "}
              {post.comments_count === 1 ? "comment" : "comments"}
            </Typography>
          </span>
        </div>

        <div className="p-4">
          {/* Comments are addressed by the post's external Graph id. */}
          <CommentsSection postId={post.external_id} />
        </div>
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
