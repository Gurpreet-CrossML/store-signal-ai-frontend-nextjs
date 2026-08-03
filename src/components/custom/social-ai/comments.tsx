"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { fetchPostComments, SocialComment } from "@/redux/api-slice/social-ai-slice";
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
}: {
    comment: SocialComment;
    postId: number;
    nested?: boolean;
}) {
    const account = useAccountIdentity();
    const channel = useChannel();
    const [showReplies, setShowReplies] = useState(false);
    const [showReplyBox, setShowReplyBox] = useState(false);
    // The page's own comments ("agent"/"ai") carry no social_user — show the
    // page identity instead, and don't offer Reply on ourselves.
    const isSelf = false;
    const author = comment.social_user;
    const name = isSelf
        ? account.name
        : author?.name || author?.username || channel.userFallback;
    const avatarUrl = isSelf
        ? account.profilePictureUrl
        : author?.profile_picture_url;

    const handleReplySubmit = (text: string) => {
        // TODO: call the reply API here once it's available.
        console.log("Reply submitted", { commentId: comment.id, text });
        toast.info("Reply API is not connected yet.");
        setShowReplyBox(false);
    };

    return (
        <div className="flex items-start gap-2">
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
                    <p className="text-[13px] leading-tight font-semibold">{name}</p>
                    <ExpandableText
                        text={comment.content}
                        textClassName="text-sm leading-snug"
                    />
                </div>
                <div className="mt-1 flex items-center gap-3 px-3 text-xs text-muted-foreground">
                    <span title={formatPostedAt(comment.external_created_at)}>
                        {formatRelativeTime(comment.external_created_at)}
                    </span>
                    {!isSelf && (
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
                </div>
                {showReplyBox && (
                    <ReplyBox replyingTo={name} onSubmit={handleReplySubmit} />
                )}
                {comment.reply_count > 0 && (
                    <Collapsible open={showReplies} onOpenChange={setShowReplies}>
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                size="xs"
                                className="mt-0.5 font-semibold text-muted-foreground"
                            >
                                {showReplies
                                    ? "Hide replies"
                                    : `View ${comment.reply_count} ${comment.reply_count === 1 ? "reply" : "replies"}`}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 border-l-2 pl-3">
                            <CommentsList
                                postId={postId}
                                parentId={comment.id}
                            />
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </div>
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
