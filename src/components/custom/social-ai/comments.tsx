"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { IconDotsVertical } from "@tabler/icons-react";
import {
  deleteMetaComment,
  fetchPostComments,
  hideMetaComment,
  likeMetaComment,
  replyToMetaComment,
  SocialComment,
} from "@/redux/api-slice/social-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useAccountIdentity, useChannel } from "./channel-context";
import { ExpandableText } from "./expandable-text";
import { formatPostedAt, formatRelativeTime } from "./format";
import { ReplyBox } from "./reply-box";

const COMMENTS_PAGE_SIZE = 15;

// CommentItem and CommentsList are mutually recursive (a comment lazily
// renders its replies as a nested list), so they live in one file.

function CommentSkeleton() {
  return (
    <div className="flex items-start gap-2">
      <Skeleton className="size-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-14 w-4/5 rounded-2xl" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

function CommentItem({
    comment,
    postId,
    nested = false,
    onDeleted,
    onHiddenChange,
}: {
    comment: SocialComment;
    postId: number;
    nested?: boolean;
    onDeleted: (commentId: number) => void;
    onHiddenChange: (commentId: number, isHidden: boolean) => void;
}) {
  const dispatch = useAppDispatch();
  const account = useAccountIdentity();
  const channel = useChannel();
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  // Bumped on every successful reply so the (re-keyed) nested CommentsList
  // below remounts and fetches fresh — including the reply just posted.
  const [repliesRefreshKey, setRepliesRefreshKey] = useState(0);
  // reply_count is a snapshot from whenever this comment was fetched; track
  // it locally so posting the first reply reveals "View replies" immediately
  // instead of waiting on a full re-fetch of the parent list.
  const [localReplyCount, setLocalReplyCount] = useState(comment.reply_count ?? 0);
  const [menuBusy, setMenuBusy] = useState(false);
  // There's no unlike endpoint — once liked (locally or per owner_liked
  // from the server), the state only ever moves forward.
  const [optimisticLiked, setOptimisticLiked] = useState(false);
  const isLiked = comment.owner_liked || optimisticLiked;
  // The page's own comments ("agent"/"ai") carry no social_user — show the
  // page identity instead, and don't offer Reply on ourselves.
  const isSelf = comment.sender_type === "agent" || comment.sender_type === "ai";
  const author = comment.social_user;
  const name = isSelf
    ? account.name
    : author?.name || author?.username || channel.userFallback;
  const avatarUrl = isSelf
    ? account.profilePictureUrl
    : author?.profile_picture_url;

  const handleReplySubmit = async (text: string) => {
    try {
      await dispatch(
        replyToMetaComment({ messageId: String(comment.id), message: text }),
      ).unwrap();
      toast.success("Reply sent.");
      setShowReplyBox(false);
      setLocalReplyCount((count) => count + 1);
      setShowReplies(true);
      setRepliesRefreshKey((key) => key + 1);
    } catch {
      // The thunk already surfaces the error toast.
    }
  };

  const handleToggleHidden = async () => {
    const nextHidden = !comment.is_hidden;
    setMenuBusy(true);
    try {
      await dispatch(
        hideMetaComment({ messageId: String(comment.id), is_hidden: nextHidden }),
      ).unwrap();
      toast.success(nextHidden ? "Comment hidden." : "Comment unhidden.");
      onHiddenChange(comment.id, nextHidden);
    } catch {
      // The thunk already surfaces the error toast.
    } finally {
      setMenuBusy(false);
    }
  };

  const handleDelete = async () => {
    setMenuBusy(true);
    try {
      await dispatch(deleteMetaComment(String(comment.id))).unwrap();
      toast.success("Comment deleted.");
      onDeleted(comment.id);
    } catch {
      // The thunk already surfaces the error toast.
    } finally {
      setMenuBusy(false);
    }
  };

  const handleLike = async () => {
    if (isLiked) return;
    setOptimisticLiked(true);
    try {
      await dispatch(likeMetaComment(String(comment.id))).unwrap();
    } catch {
      // The thunk already surfaces the error toast.
      setOptimisticLiked(false);
    }
  };

    return (
        <div className="group flex items-start gap-2">
            <Avatar size={nested ? "sm" : "default"}>
                {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={name} />
                ) : (
                    <AvatarFallback className="font-medium">
                        {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                )}
            </Avatar>
            <div className="min-w-0 flex-1">
                <div className="inline-block max-w-full rounded-lg bg-muted px-3 py-2">
                    <p className="flex items-center gap-1.5 text-[13px] leading-tight font-semibold">
                        {name}
                        {isSelf && (
                            <Badge variant="secondary" className="text-[10px]">
                                Author
                            </Badge>
                        )}
                        {comment.is_hidden && (
                            <Badge variant="outline" className="text-[10px]">
                                Hidden
                            </Badge>
                        )}
                    </p>
                    <ExpandableText
                        text={comment.content}
                        textClassName="text-sm leading-snug"
                    />
                </div>
                <div className="mt-1 flex items-center gap-3 px-3 text-xs text-muted-foreground">
                    <span title={formatPostedAt(comment.external_created_at)}>
                        {formatRelativeTime(comment.external_created_at)}
                    </span>
                    {channel.key === "facebook" && (
                        <button
                            type="button"
                            onClick={handleLike}
                            disabled={isLiked}
                            aria-label={isLiked ? "Liked" : "Like"}
                            className="disabled:cursor-default"
                        >
                            {isLiked ? (
                                <channel.LikeIconFilled
                                    className={`size-4 ${channel.likeColorClass}`}
                                />
                            ) : (
                                <channel.LikeIcon className="size-4" />
                            )}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowReplyBox((open) => !open)}
                        className="font-semibold hover:underline"
                    >
                        Reply
                    </button>
                    {comment.like_count > 0 && (
                        <span className="flex items-center gap-1">
                            <channel.LikeIcon className="size-3.5" />
                            {comment.like_count}
                        </span>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                disabled={menuBusy}
                                className="opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                                aria-label="Comment actions"
                            >
                                <IconDotsVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={handleToggleHidden} disabled={menuBusy}>
                                {comment.is_hidden ? "Unhide comment" : "Hide comment"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleDelete}
                                disabled={menuBusy}
                                variant="destructive"
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {showReplyBox && (
                    <ReplyBox replyingTo={name} onSubmit={handleReplySubmit} />
                )}
                {localReplyCount > 0 && (
                    <Collapsible open={showReplies} onOpenChange={setShowReplies}>
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                size="xs"
                                className="mt-0.5 font-semibold text-muted-foreground"
                            >
                                {showReplies
                                    ? "Hide replies"
                                    : `View ${localReplyCount} ${localReplyCount === 1 ? "reply" : "replies"}`}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 border-l-2 pl-3">
                            <CommentsList
                                key={repliesRefreshKey}
                                postId={postId}
                                parentId={comment.id}
                            />
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </div>
            {channel.key === "instagram" && (
                <button
                    type="button"
                    onClick={handleLike}
                    disabled={isLiked}
                    aria-label={isLiked ? "Liked" : "Like"}
                    className="mt-1 shrink-0 disabled:cursor-default"
                >
                    {isLiked ? (
                        <channel.LikeIconFilled className={`size-4 ${channel.likeColorClass}`} />
                    ) : (
                        <channel.LikeIcon className="size-4 text-muted-foreground" />
                    )}
                </button>
            )}
        </div>
    );
}

// Paginated comment list — top-level comments without `parentId`, a
// comment's replies with it. Pages accumulate locally, de-duplicated by id.
function CommentsList({
    postId,
    parentId,
}: {
    postId: number;
    parentId?: number;
}) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const pageRef = useRef(0);
  const requestedRef = useRef(false);
  const noun = parentId ? "reply" : "comment";

    const loadMore = useCallback(async () => {
        if (!storeCode) return;
        const nextPage = pageRef.current + 1;
        setLoading(true);
        try {
            const data = await dispatch(
                fetchPostComments({
                    storeCode,
                    postId,
                    page: nextPage,
                    pageSize: COMMENTS_PAGE_SIZE,
                    parentId,
                }),
            ).unwrap();
            pageRef.current = nextPage;
            setComments((prev) => {
                const seen = new Set(prev.map((comment) => comment.id));
                return [
                    ...prev,
                    ...(data.results ?? []).filter((comment: SocialComment) => !seen.has(comment.id)),
                ];
            });
            setTotal(data.count ?? 0);
            setHasMore(Boolean(data.next));
        } catch {
            // The thunk already surfaces the error toast.
        } finally {
            setLoading(false);
        }
    }, [dispatch, storeCode, postId, parentId]);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    loadMore();
  }, [loadMore]);

  const remaining = total === null ? 0 : Math.max(total - comments.length, 0);
  const initialLoading = loading && comments.length === 0;

  const handleCommentDeleted = (commentId: number) => {
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    setTotal((prev) => (prev === null ? prev : Math.max(prev - 1, 0)));
  };

  const handleCommentHiddenChange = (commentId: number, isHidden: boolean) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, is_hidden: isHidden } : comment,
      ),
    );
  };

    return (
        <div className="flex flex-col gap-3">
            {initialLoading && (
                <>
                    <CommentSkeleton />
                    <CommentSkeleton />
                    {!parentId && <CommentSkeleton />}
                </>
            )}
            {comments.map((comment) => (
                <CommentItem
                    key={comment.id}
                    comment={comment}
                    postId={postId}
                    nested={Boolean(parentId)}
                    onDeleted={handleCommentDeleted}
                    onHiddenChange={handleCommentHiddenChange}
                />
            ))}
            {!initialLoading && total === 0 && (
                <p className="text-sm text-muted-foreground">
                    No {noun === "reply" ? "replies" : "comments"} yet.
                </p>
            )}
            {hasMore && !initialLoading && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadMore}
                    disabled={loading}
                    className="self-start text-[13px] font-semibold text-muted-foreground"
                >
                    {loading && <Spinner />}
                    {remaining > 0
                        ? `View ${remaining} more ${remaining === 1 ? noun : `${noun === "reply" ? "replies" : "comments"}`}`
                        : `View more ${noun === "reply" ? "replies" : "comments"}`}
                </Button>
            )}
        </div>
    );
}

// The comments area under a post's footer.
export function CommentsSection({ postId }: { postId: number }) {
    return (
        <div>
            <Separator className="mb-3" />
            <div className="px-(--card-spacing)">
                <CommentsList postId={postId} />
            </div>
        </div>
    );
}
