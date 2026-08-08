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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { IconDotsVertical } from "@tabler/icons-react";
import {
  deleteMetaComment,
  fetchCommentTopics,
  fetchPostComments,
  SOCIAL_PAGE_SIZE,
  hideMetaComment,
  likeMetaComment,
  replyToMetaComment,
  SocialComment,
} from "@/redux/api-slice/social-ai-slice";
import { Typography } from "@/components/ui/typography";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { InfoIcon } from "@/components/custom/info-icon";
import { cn } from "@/lib/utils";

import { useAccountIdentity, useChannel } from "./channel-context";
import {
  CommentFiltersBar,
  EMPTY_COMMENT_FILTERS,
  type CommentFilters,
} from "./comment-filters";
import { CommentTags } from "./comment-tags";
import { ExpandableText } from "./expandable-text";
import { formatPostedAt, formatRelativeTime } from "./format";
import {
  createPendingSend,
  PendingSendStatus,
  type PendingSend,
} from "./pending-send";
import { ReplyBox } from "./reply-box";
import { useInfiniteScroll } from "./use-infinite-scroll";
import { useSocialSocket, type SocialSocketEvent } from "./use-social-socket";

const COMMENTS_PAGE_SIZE = SOCIAL_PAGE_SIZE;

/**
 * A reply the agent has submitted that isn't confirmed yet. Same shape as a
 * real comment row but dimmed, with the send status underneath.
 */
function PendingCommentRow({
  pending,
  name,
  avatarUrl,
  onRetry,
}: {
  pending: PendingSend;
  name: string;
  avatarUrl?: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <Avatar
        size="sm"
        className={pending.status === "failed" ? "" : "opacity-60"}
      >
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={name} />
        ) : (
          <AvatarFallback className="font-medium">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="inline-block max-w-full rounded-lg bg-muted px-3 py-2 text-muted-foreground">
          <Typography variant="small" as="p" className="leading-tight">
            {name}
          </Typography>
          <Typography
            variant="small"
            as="p"
            className="mt-0.5 leading-snug font-normal wrap-break-word"
          >
            {pending.content}
          </Typography>
        </div>
        <PendingSendStatus
          status={pending.status}
          onRetry={onRetry}
          className="mt-1"
        />
      </div>
    </div>
  );
}

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
  // Replies submitted but not yet confirmed — rendered under the thread so
  // the text never disappears while the request is in flight.
  const [pendingReplies, setPendingReplies] = useState<PendingSend[]>([]);
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

  const sendReply = async (pending: PendingSend) => {
    try {
      await dispatch(
        replyToMetaComment({
          storeCode,
          postId,
          commentId: comment.id,
          message: pending.content,
        }),
      ).unwrap();
      setLocalReplyCount((count) => count + 1);
      setRepliesRefreshKey((key) => key + 1);
      // The reply is normally cleared by its own websocket echo. If the
      // stream is down, this drops it once the refreshed list has had time
      // to load rather than leaving "Sending…" on screen forever.
      setTimeout(() => {
        setPendingReplies((prev) =>
          prev.filter((item) => item.tempId !== pending.tempId),
        );
      }, 6_000);
    } catch {
      // The thunk already surfaces the error toast.
      setPendingReplies((prev) =>
        prev.map((item) =>
          item.tempId === pending.tempId
            ? { ...item, status: "failed" as const }
            : item,
        ),
      );
    }
  };

  const handleReplySubmit = (text: string) => {
    const pending = createPendingSend(text);
    setPendingReplies((prev) => [...prev, pending]);
    setShowReplyBox(false);
    setShowReplies(true);
    void sendReply(pending);
  };

  const handleRetryReply = (tempId: string) => {
    const pending = pendingReplies.find((item) => item.tempId === tempId);
    if (!pending) return;
    setPendingReplies((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, status: "sending" as const } : item,
      ),
    );
    void sendReply({ ...pending, status: "sending" });
  };

  // Our own reply comes back on the store-wide stream like any other
  // comment — that echo is what confirms it and clears the pending row.
  const handleReplyEcho = useCallback(
    (event: SocialSocketEvent) => {
      if (event.action_type !== "comment_created") return;
      const created = event.data;
      if (created.parent_message !== comment.id) return;
      if (created.sender_type === "user") return;

      setPendingReplies((prev) => {
        const match = prev.find((item) => item.content === created.content);
        if (!match) return prev;
        return prev.filter((item) => item.tempId !== match.tempId);
      });
    },
    [comment.id],
  );

  useSocialSocket({ storeCode, onEvent: handleReplyEcho });

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
        {/* Deleted reads red, hidden simply recedes — and both drop to a low
            opacity so it's obvious at a glance that they're inert. */}
        <div
          className={cn(
            "inline-block max-w-full rounded-lg px-3 py-2",
            comment.is_deleted
              ? "bg-destructive/10 opacity-70"
              : comment.is_hidden
                ? "bg-muted opacity-60"
                : "bg-muted",
          )}
        >
          <p className="flex items-center gap-1.5 text-sm leading-tight font-semibold">
            {(comment.is_deleted || comment.is_hidden) && (
              <InfoIcon
                text={
                  comment.is_deleted
                    ? `This comment was deleted on ${channel.label}. It can't be replied to, liked, or changed.`
                    : `This comment is hidden on ${channel.label}, so customers can't see it. Unhide it to restore replies and likes.`
                }
              />
            )}
            {name}
            {isSelf && <Badge variant="secondary">Author</Badge>}
            {comment.is_hidden && <Badge variant="outline">Hidden</Badge>}
            {comment.is_deleted && (
              <Badge variant="secondary" className="text-muted-foreground">
                Deleted
              </Badge>
            )}
            <CommentTags analysis={comment.analysis} />
          </p>
          <ExpandableText
            text={comment.content}
            textClassName={
              comment.is_deleted ? "text-muted-foreground italic" : undefined
            }
          />
        </div>
        <div className="mt-1 flex items-center gap-3 px-3 text-xs text-muted-foreground">
          <span title={formatPostedAt(comment.external_created_at)}>
            {formatRelativeTime(comment.external_created_at)}
          </span>
          {channel.key === "facebook" && !comment.is_deleted && (
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
          {/* Nothing can be done to a deleted comment, so it gets no menu
              at all rather than a disabled one. */}
          {!comment.is_deleted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={menuBusy}
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
                {/* Unhide is the only way back from hidden — offering an
                    irreversible delete alongside it invites a mis-click. */}
                {!comment.is_hidden && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={menuBusy}
                    variant="destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
        {/* Outside the collapsible: the very first reply to a comment has
            nothing to expand yet, and a pending reply must still show. */}
        {pendingReplies.length > 0 && (
          <div className="mt-2 flex flex-col gap-2 border-l-2 pl-3">
            {pendingReplies.map((pending) => (
              <PendingCommentRow
                key={pending.tempId}
                pending={pending}
                name={account.name}
                avatarUrl={account.profilePictureUrl}
                onRetry={() => handleRetryReply(pending.tempId)}
              />
            ))}
          </div>
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
  filters,
  disableReply = false,
  disableLike = false,
}: {
  // The post's external Graph id (SocialPost.external_id).
  postId: string;
  parentId?: number;
  // AI-tag filters. These have no backend equivalent, so they narrow the
  // comments already fetched rather than re-querying.
  filters?: CommentFilters;
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
          // Filtering is the backend's job — these narrow the query, not
          // the rows already fetched.
          topics: filters?.topics.length ? filters.topics : undefined,
          intent: filters?.intent !== "any" ? filters?.intent : undefined,
          sentiment:
            filters?.sentiment !== "any" ? filters?.sentiment : undefined,
          sarcastic: filters?.sarcastic || undefined,
          critical: filters?.critical || undefined,
          spam: filters?.spam || undefined,
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
  }, [dispatch, storeCode, postId, parentId, filters]);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    loadMore();
  }, [loadMore]);

  // Live comments and AI tags for this list.
  const handleCommentEvent = useCallback(
    (event: SocialSocketEvent) => {
      if (event.action_type === "comment_tagged") {
        const { message_id, analysis } = event.data;
        setComments((prev) =>
          prev.some((comment) => comment.id === message_id)
            ? prev.map((comment) =>
                comment.id === message_id ? { ...comment, analysis } : comment,
              )
            : prev,
        );
        return;
      }

      if (event.action_type !== "comment_created") return;

      const created = event.data;
      if (created.post_external_id !== postId) return;
      // Top-level list takes root comments; a replies list takes only its
      // own parent's children.
      if ((created.parent_message ?? null) !== (parentId ?? null)) return;

      setComments((prev) => {
        if (prev.some((comment) => comment.id === created.id)) return prev;
        // The list is newest-first, but a first-time post sync replays its
        // whole comment history through this same event — insert by the
        // comment's own timestamp so backfill doesn't land at the top.
        const createdAt = new Date(created.external_created_at ?? 0).getTime();
        const index = prev.findIndex(
          (comment) =>
            new Date(comment.external_created_at ?? 0).getTime() <= createdAt,
        );
        const next = [...prev];
        next.splice(index === -1 ? next.length : index, 0, created);
        return next;
      });
      setTotal((prev) => (prev === null ? prev : prev + 1));
    },
    [postId, parentId],
  );

  useSocialSocket({ storeCode, onEvent: handleCommentEvent });

  const remaining = total === null ? 0 : Math.max(total - comments.length, 0);
  const initialLoading = loading && comments.length === 0;

  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    onLoadMore: loadMore,
    hasMore,
    loading,
  });

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
        <Typography variant="muted">
          {`No ${noun === "reply" ? "replies" : "comments"} yet.`}
        </Typography>
      )}

      {hasMore && !initialLoading && (
        // Pulls the next page as it scrolls into view; the count tells the
        // reader more is coming rather than leaving a bare spinner.
        <div ref={sentinelRef} className="flex items-center gap-2 py-2">
          <Spinner className="size-4" />
          <Typography variant="muted" as="span">
            {remaining > 0
              ? `Loading ${remaining} more ${remaining === 1 ? noun : noun === "reply" ? "replies" : "comments"}…`
              : "Loading more…"}
          </Typography>
        </div>
      )}
    </div>
  );
}

// A post's comments, with the AI-tag filter bar above them. The tag options
// come from the topics actually present on this post's comments.
export function CommentsSection({ postId }: { postId: string }) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchCommentTopicsData: topics } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchCommentTopicsState,
  );
  const [filters, setFilters] = useState<CommentFilters>(EMPTY_COMMENT_FILTERS);
  // Reset any active filter when the post itself changes (e.g. this
  // section gets reused across posts in a feed). Adjusted during render —
  // the React-endorsed alternative to setState-in-effect, which would
  // trigger a cascading render.
  const [lastPostId, setLastPostId] = useState(postId);
  if (lastPostId !== postId) {
    setLastPostId(postId);
    setFilters(EMPTY_COMMENT_FILTERS);
  }

  useEffect(() => {
    if (!storeCode) return;
    dispatch(fetchCommentTopics({ storeCode, postId }));
  }, [dispatch, storeCode, postId]);

  return (
    <div>
      <div>
        <div className="mb-3">
          <CommentFiltersBar
            filters={filters}
            topics={topics}
            onChange={setFilters}
          />
        </div>
        {/* Keyed on the filters so a change remounts the list and re-queries
            from page 1, rather than appending onto stale rows. */}
        <CommentsList
          key={JSON.stringify(filters)}
          postId={postId}
          filters={filters}
        />
      </div>
    </div>
  );
}
