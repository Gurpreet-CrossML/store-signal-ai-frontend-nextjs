"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { SocialPost } from "@/redux/api-slice/social-ai-slice";
import {
  IconMessageCircle,
  IconRosetteDiscountCheckFilled,
} from "@tabler/icons-react";
import Image from "next/image";

import { useAccountIdentity, useChannel } from "./channel-context";
import { CommentsSection } from "./comments";
import { ExpandableText } from "./expandable-text";
import { formatPostedAt } from "./format";
import { DEFAULT_MEDIA_SIZE, MediaCarousel } from "./media-carousel";

// One FB/IG-style post: account header, clamped text, full-bleed media, and
// a like/comment footer whose comment count expands the comments section.
export function SocialPostCard({ post }: { post: SocialPost }) {
  const account = useAccountIdentity();
  const channel = useChannel();

    return (
        <Card size="sm" className="w-full max-w-xl gap-3">
            <CardHeader className="flex items-center gap-3">
                <Avatar size="lg">
                    {account.profilePictureUrl ? (
                        <AvatarImage src={account.profilePictureUrl} alt={account.name} />
                    ) : (
                        <AvatarFallback className="font-medium">
                            {account.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    )}
                </Avatar>
                <div className="flex flex-col">
                    <CardTitle className="flex items-center gap-1 text-[15px] font-semibold">
                        {account.name}
                        <IconRosetteDiscountCheckFilled className="size-4 shrink-0 text-sky-500" />
                    </CardTitle>
                    <CardDescription className="text-xs">
                        {[
                            account.username && `@${account.username}`,
                            formatPostedAt(post.posted_at),
                        ]
                            .filter(Boolean)
                            .join(" · ")}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <ExpandableText text={post.content} className="mb-3" />
                <div className="-mx-(--card-spacing)">
                    {post.media_type == 'carousel_album' && post.media_entries.length > 0 && (
                        <MediaCarousel mediaEntries={post.media_entries} />
                    )}
                    {post.media_type == 'image' && post.media_entries.length > 0 && (
                        <Image
                            src={post.media_entries[0].url}
                            alt="Post media"
                            width={post.media_entries[0].width ?? DEFAULT_MEDIA_SIZE}
                            height={post.media_entries[0].height ?? DEFAULT_MEDIA_SIZE}
                            unoptimized
                            className="w-full h-auto object-cover"
                        />
                    )}
                    {post.media_type == 'video' && post.media_entries.length > 0 && (
                        <video
                            controls
                            src={post.media_entries[0].url}
                            className="w-full h-auto"
                        />
                    )}
                </div>
            </CardContent>
            <Collapsible>
                <CardFooter className="justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <channel.LikeIcon className="size-4" />
                        {post.like_count}
                    </span>
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground"
                        >
                            <IconMessageCircle className="size-4" />
                            {post.comments_count}
                        </Button>
                    </CollapsibleTrigger>
                </CardFooter>
                <CollapsibleContent className="pt-3">
                    <CommentsSection postId={post.id} />
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

// Placeholder shown while the posts request is in flight.
export function SocialPostSkeleton() {
  return (
    <Card size="sm" className="w-full max-w-xl gap-3">
      <CardHeader className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="-mx-(--card-spacing) mt-3">
          <Skeleton className="h-64 w-full rounded-none" />
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
      </CardFooter>
    </Card>
  );
}
