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
  fetchCommentTopics,
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
  disableReply = false,
  disableLike = false,
}: {
  comment: SocialComment;
  // The post's external Graph id — the URL scope for comment actions.
  postId: string;
  nested?: boolean;
  onDeleted: (commentId: number) => void;
  onHiddenChange: (commentId: number, isHidden: boolean) => void;
  // True when an ancestor comment is deleted — once a thread's origin is
  // gone, replying anywhere under it (however deep) is disallowed too.
  disableReply?: boolean;
  // True when an ancestor comment is deleted or hidden — same cascade,
  // for liking instead of replying.
  disableLike?: boolean;
}) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
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
  const [localReplyCount, setLocalReplyCount] = useState(
    comment.reply_count ?? 0,
  );
  const [menuBusy, setMenuBusy] = useState(false);
  // There's no unlike endpoint — once liked (locally or per owner_liked
  // from the server), the state only ever moves forward.
  const [optimisticLiked, setOptimisticLiked] = useState(false);
  const isLiked = comment.owner_liked || optimisticLiked;
  const likeDisabled =
    isLiked || comment.is_deleted || comment.is_hidden || disableLike;
  // The page's own comments ("agent"/"ai") carry no social_user — show the
  // page identity instead, and don't offer Reply on ourselves.
  const isSelf =
    comment.sender_type === "agent" || comment.sender_type === "ai";
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
        replyToMetaComment({
          storeCode,
          postId,
          commentId: comment.id,
          message: text,
        }),
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
        hideMetaComment({
          storeCode,
          postId,
          commentId: comment.id,
          is_hidden: nextHidden,
        }),
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
      await dispatch(
        deleteMetaComment({ storeCode, postId, commentId: comment.id }),
      ).unwrap();
      toast.success("Comment deleted.");
      onDeleted(comment.id);
    } catch {
      // The thunk already surfaces the error toast.
    } finally {
      setMenuBusy(false);
    }
  };

  const handleLike = async () => {
    if (likeDisabled) return;
    setOptimisticLiked(true);
    try {
      await dispatch(
        likeMetaComment({ storeCode, postId, commentId: comment.id }),
      ).unwrap();
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
            {comment.is_deleted && (
              <Badge
                variant="secondary"
                className="text-[10px] text-muted-foreground"
              >
                Deleted
              </Badge>
            )}
            {comment.analysis?.topic_labels.map((label) => (
              <Badge
                key={label}
                className="bg-primary/10 text-[10px] text-primary hover:bg-primary/10"
              >
                {label}
              </Badge>
            ))}
          </p>
          <ExpandableText
            text={comment.content}
            textClassName={`text-sm leading-snug ${comment.is_deleted ? "text-muted-foreground italic" : ""}`}
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
              disabled={likeDisabled}
              aria-label={isLiked ? "Liked" : "Like"}
              className="disabled:cursor-default disabled:opacity-50"
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
          {!comment.is_deleted && !comment.is_hidden && !disableReply && (
            <button
              type="button"
              onClick={() => setShowReplyBox((open) => !open)}
              className="font-semibold hover:underline"
            >
              Reply
            </button>
          )}
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
                disabled={menuBusy || comment.is_deleted}
                className="opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100 disabled:opacity-50"
                aria-label="Comment actions"
              >
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={handleToggleHidden}
                disabled={menuBusy}
              >
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
                disableReply={comment.is_deleted || disableReply}
                disableLike={
                  comment.is_deleted || comment.is_hidden || disableLike
                }
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
      {channel.key === "instagram" && (
        <button
          type="button"
          onClick={handleLike}
          disabled={likeDisabled}
          aria-label={isLiked ? "Liked" : "Like"}
          className="mt-1 shrink-0 disabled:cursor-default disabled:opacity-50"
        >
          {isLiked ? (
            <channel.LikeIconFilled
              className={`size-4 ${channel.likeColorClass}`}
            />
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
  topic,
  disableReply = false,
  disableLike = false,
}: {
  // The post's external Graph id (SocialPost.external_id).
  postId: string;
  parentId?: number;
  topic?: string;
  disableReply?: boolean;
  disableLike?: boolean;
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
          topic,
        }),
      ).unwrap();
      pageRef.current = nextPage;
      setComments((prev) => {
        const seen = new Set(prev.map((comment) => comment.id));
        return [
          ...prev,
          ...(data.results ?? []).filter(
            (comment: SocialComment) => !seen.has(comment.id),
          ),
        ];
      });
      setTotal(data.count ?? 0);
      setHasMore(Boolean(data.next));
    } catch {
      // The thunk already surfaces the error toast.
    } finally {
      setLoading(false);
    }
  }, [dispatch, storeCode, postId, parentId, topic]);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    loadMore();
  }, [loadMore]);

  const remaining = total === null ? 0 : Math.max(total - comments.length, 0);
  const initialLoading = loading && comments.length === 0;

  const handleCommentDeleted = (commentId: number) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, is_deleted: true } : comment,
      ),
    );
  };

  const handleCommentHiddenChange = (commentId: number, isHidden: boolean) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, is_hidden: isHidden }
          : comment,
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
          disableReply={disableReply}
          disableLike={disableLike}
        />
      ))}
      {!initialLoading && total === 0 && (
        <p className="text-sm text-muted-foreground">
          {topic
            ? "No comments match this tag."
            : `No ${noun === "reply" ? "replies" : "comments"} yet.`}
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

// The comments area under a post's footer: a topic filter chip bar (only
// topics actually AI-tagged on this post's comments) above the comment list.
export function CommentsSection({ postId }: { postId: string }) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchCommentTopicsData: topics } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchCommentTopicsState,
  );
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    if (!storeCode) return;
    dispatch(fetchCommentTopics({ storeCode, postId }));
    // Reset any active filter when the post itself changes (e.g. this
    // section gets reused across posts in a feed).
    setSelectedTopic(null);
  }, [dispatch, storeCode, postId]);

  const selectedLabel = topics.find((t) => t.slug === selectedTopic)?.label;

  return (
    <div>
      <Separator className="mb-3" />
      <div className="px-(--card-spacing)">
        {topics.length > 0 && (
          <div className="mb-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Filter comments by tags
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {topics.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() =>
                    setSelectedTopic((prev) =>
                      prev === t.slug ? null : t.slug,
                    )
                  }
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition ${
                    t.slug === selectedTopic
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-muted/40 text-foreground hover:bg-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                disabled={!selectedTopic}
                className="text-xs font-semibold text-primary hover:text-primary/80 disabled:pointer-events-none disabled:opacity-40"
              >
                Clear
              </button>
              {selectedLabel && (
                <Badge variant="secondary" className="text-[10px]">
                  Selected tag: {selectedLabel}
                </Badge>
              )}
            </div>
            <Separator />
          </div>
        )}
        <CommentsList
          key={selectedTopic ?? "all"}
          postId={postId}
          topic={selectedTopic ?? undefined}
        />
      </div>
    </div>
  );
}
