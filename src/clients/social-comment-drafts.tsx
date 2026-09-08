"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { IconChecklist, IconExternalLink } from "@tabler/icons-react";

import { LoadingState } from "@/components/custom/loading-state";
import { CommentTags } from "@/components/custom/social-ai/comment-tags";
import { DraftBubble } from "@/components/custom/social-ai/draft-bubble";
import { ExpandableText } from "@/components/custom/social-ai/expandable-text";
import {
  formatPostedAt,
  formatRelativeTime,
} from "@/components/custom/social-ai/format";
import {
  useSocialSocket,
  type SocialSocketEvent,
} from "@/components/custom/social-ai/use-social-socket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  commentDraftChanged,
  commentDraftReceived,
  fetchCommentDrafts,
  fetchSocialAccountsSubscriptions,
  type CommentDraft,
  type ConnectedAccount,
} from "@/redux/api-slice/social-ai-slice";

/* -------------------------------------------------------------------- */
/* One draft                                                             */
/* -------------------------------------------------------------------- */

/**
 * The comment rendered the way the comments view renders it — avatar,
 * bubble, tags, timestamp — with the AI's pending draft underneath in the
 * same DraftBubble the in-context surfaces use. One draft UI everywhere.
 */
function DraftCard({
  draft,
  storeCode,
  accounts,
  onStale,
}: {
  draft: CommentDraft;
  storeCode: string;
  /** Connected accounts — resolve which channel's feed the post lives in. */
  accounts: ConnectedAccount[];
  /** A mutation was refused because the draft left pending state elsewhere. */
  onStale: () => void;
}) {
  const commenter =
    draft.message.social_user?.name ||
    draft.message.social_user?.username ||
    "Unknown commenter";
  const avatarUrl = draft.message.social_user?.profile_picture_url;

  // The feed opens a post from its ?post= param; the account's channel
  // decides which feed. The serializer may not name the account, so fall
  // back to the Graph id conventions: a Facebook post id is
  // "<page id>_<post id>", and a store with one connected account leaves
  // nothing to guess.
  const postExternalId = draft.message.post_external_id;
  const pagePrefix = postExternalId?.includes("_")
    ? postExternalId.split("_")[0]
    : undefined;
  const matchedAccount =
    accounts.find(
      (row) => row.external_id === (draft.account_external_id ?? pagePrefix),
    ) ?? (accounts.length === 1 ? accounts[0] : undefined);
  const channelType =
    draft.account?.channel_type ?? matchedAccount?.channel_type;
  const postHref =
    postExternalId && channelType
      ? `/social-ai/${
          channelType === "instagram" ? "instagram-post" : "facebook-post"
        }?post=${encodeURIComponent(postExternalId)}`
      : null;

  return (
    <Card size="sm">
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <Avatar>
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={commenter} />
              ) : (
                <AvatarFallback className="font-medium">
                  {commenter.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="inline-block max-w-full rounded-lg bg-muted px-3 py-2">
                <p className="flex flex-wrap items-center gap-1.5 text-sm leading-tight font-semibold">
                  {commenter}
                  <CommentTags analysis={draft.message.analysis} />
                </p>
                <ExpandableText text={draft.message.content} />
              </div>
              <div className="mt-1 flex items-center gap-3 px-3 text-xs text-muted-foreground">
                <span title={formatPostedAt(draft.message.external_created_at)}>
                  {formatRelativeTime(draft.message.external_created_at)}
                </span>
                {draft.account?.name && <span>{draft.account.name}</span>}
              </div>
            </div>
          </div>
          {postHref && (
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href={postHref}>
                <IconExternalLink data-icon="inline-start" />
                View Post
              </Link>
            </Button>
          )}
        </div>

        <DraftBubble
          draft={draft}
          storeCode={storeCode}
          onResolved={(outcome) => {
            // Approve and discard already drop the row from the queue
            // slice; stale means someone else handled it — refresh to agree.
            if (outcome === "stale") onStale();
          }}
        />
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------- */
/* Screen                                                                */
/* -------------------------------------------------------------------- */

/**
 * The review queue for AI-drafted comment actions. Rows arrive when a
 * comment hits a rule set to Draft Automatically; nothing here is public
 * until someone approves it, and a discarded draft never regenerates.
 */
export default function SocialCommentDrafts() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const accountsData = useAppSelector(
    (state) =>
      state.GetSocialAIReducer.FetchSocialAccountSubscriptionsState
        .FetchSocialAccountsSubscriptionsData,
  );
  const accounts = useMemo(() => accountsData?.results ?? [], [accountsData]);
  const {
    FetchCommentDraftsData: draftsData,
    FetchCommentDraftsIsLoading: isLoading,
  } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchCommentDraftsState,
  );

  const [accountId, setAccountId] = useState("all");
  const pageRef = useRef(1);

  useEffect(() => {
    if (storeCode) dispatch(fetchSocialAccountsSubscriptions(storeCode));
  }, [dispatch, storeCode]);

  const loadPageOne = useCallback(() => {
    if (!storeCode) return;
    pageRef.current = 1;
    dispatch(
      fetchCommentDrafts({
        storeCode,
        accountId: accountId === "all" ? undefined : accountId,
      }),
    );
  }, [dispatch, storeCode, accountId]);

  useEffect(() => {
    loadPageOne();
  }, [loadPageOne]);

  // The queue is live off the draft broadcasts: created inserts at the top,
  // updated refreshes the row — or removes it when the draft left pending
  // state, meaning another teammate already handled it.
  const handleSocketEvent = useCallback(
    (event: SocialSocketEvent) => {
      if (event.action_type === "comment_draft_created") {
        // The stream carries every account on the store; respect the filter.
        if (accountId !== "all") {
          const account = accounts.find((row) => String(row.id) === accountId);
          if (account && event.data.account_external_id !== account.external_id)
            return;
        }
        // The event names the post and account even when the row doesn't —
        // keep both so the View Post link can always be built.
        const { draft, post_external_id, account_external_id } = event.data;
        dispatch(
          commentDraftReceived({
            ...draft,
            account_external_id:
              draft.account_external_id ?? account_external_id,
            message: {
              ...draft.message,
              post_external_id:
                draft.message.post_external_id ?? post_external_id,
            },
          }),
        );
        return;
      }
      if (event.action_type === "comment_draft_updated") {
        dispatch(commentDraftChanged(event.data.draft));
      }
    },
    [accountId, accounts, dispatch],
  );
  useSocialSocket({
    storeCode,
    onEvent: handleSocketEvent,
    // Nothing is buffered while disconnected, so a reconnect re-reads.
    onReconnect: loadPageOne,
  });

  const drafts = draftsData?.results ?? [];
  const hasMore = Boolean(draftsData?.next);

  const loadMore = () => {
    if (!storeCode) return;
    pageRef.current += 1;
    dispatch(
      fetchCommentDrafts({
        storeCode,
        accountId: accountId === "all" ? undefined : accountId,
        page: pageRef.current,
      }),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography variant="caption" as="p">
          {draftsData?.count != null &&
            `${draftsData.count} draft${draftsData.count === 1 ? "" : "s"}`}
        </Typography>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger size="sm" className="w-52" aria-label="Account">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={String(account.id)}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && drafts.length === 0 ? (
        <LoadingState label="Loading Drafts…" />
      ) : drafts.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <IconChecklist />
            </EmptyMedia>
            <EmptyTitle>Queue Clear</EmptyTitle>
            <EmptyDescription>
              Nothing is waiting for review. New drafts appear here as comments
              arrive under a Draft Automatically rule.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              storeCode={storeCode}
              accounts={accounts}
              onStale={loadPageOne}
            />
          ))}
          {hasMore && (
            <Button
              variant="outline"
              size="sm"
              className="self-center"
              disabled={isLoading}
              onClick={loadMore}
            >
              {isLoading && <Spinner data-icon="inline-start" />}
              Load More
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
