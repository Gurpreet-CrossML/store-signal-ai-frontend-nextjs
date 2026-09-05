"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconChecklist,
  IconPencil,
  IconSend,
  IconTrash,
} from "@tabler/icons-react";

import { CommentTags } from "@/components/custom/social-ai/comment-tags";
import {
  useSocialSocket,
  type SocialSocketEvent,
} from "@/components/custom/social-ai/use-social-socket";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { ACTIONS } from "@/lib/comment-handling-data";
import { formatRelativeTime } from "@/lib/helpers";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  approveCommentDraft,
  discardCommentDraft,
  fetchCommentDrafts,
  fetchSocialAccountsSubscriptions,
  updateCommentDraft,
  type CommentDraft,
  type CommentDraftStatus,
} from "@/redux/api-slice/social-ai-slice";

const STATUS_FILTERS: { value: CommentDraftStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "discarded", label: "Discarded" },
  { value: "all", label: "All" },
];

/* -------------------------------------------------------------------- */
/* One draft                                                             */
/* -------------------------------------------------------------------- */

function DraftCard({
  draft,
  storeCode,
  onStale,
}: {
  draft: CommentDraft;
  storeCode: string;
  /** A mutation was refused because the draft left pending state elsewhere. */
  onStale: () => void;
}) {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [responseText, setResponseText] = useState(draft.response_text);
  const [dmText, setDmText] = useState(draft.dm_text);
  const [busy, setBusy] = useState<"approve" | "discard" | "save" | null>(null);

  const commenter =
    draft.message.social_user?.name ||
    draft.message.social_user?.username ||
    "Unknown commenter";
  const isPending = draft.status === "pending";

  const run = async (
    kind: "approve" | "discard" | "save",
    action: () => Promise<unknown>,
  ) => {
    setBusy(kind);
    try {
      await action();
      setIsEditing(false);
    } catch {
      // The thunk toasted; a refusal means someone else handled the draft.
      onStale();
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{commenter}</CardTitle>
        <CardDescription>
          Drafted {formatRelativeTime(draft.created_at)} · {draft.rule_source}
        </CardDescription>
        <CardAction>
          {draft.status === "approved" && (
            <Badge variant="outline" className={BADGE_TONE_STYLES.success}>
              Approved
            </Badge>
          )}
          {draft.status === "discarded" && (
            <Badge variant="outline" className={BADGE_TONE_STYLES.neutral}>
              Discarded
            </Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        <blockquote className="flex flex-col gap-2 border-l-2 border-border pl-3">
          <Typography variant="small" as="p">
            {draft.message.content}
          </Typography>
          <CommentTags analysis={draft.message.analysis} />
        </blockquote>

        <div className="flex flex-wrap items-center gap-2">
          <Typography variant="caption">Will do:</Typography>
          {/* ACTIONS is declared in execution-priority order, so filtering
              it keeps the chips reading as the sequence the AI runs. */}
          {ACTIONS.filter((action) => draft.actions.includes(action.id)).map(
            (action) => (
              <Badge
                key={action.id}
                variant="outline"
                className={BADGE_TONE_STYLES[action.tone]}
              >
                {action.label}
              </Badge>
            ),
          )}
        </div>

        {isEditing ? (
          <>
            <div className="flex flex-col gap-2">
              <Typography variant="caption">Public reply</Typography>
              <Textarea
                value={responseText}
                onChange={(event) => setResponseText(event.target.value)}
                placeholder="What gets posted under the comment"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Typography variant="caption">Private DM</Typography>
              <Textarea
                value={dmText}
                onChange={(event) => setDmText(event.target.value)}
                placeholder="What gets sent as a DM"
              />
            </div>
          </>
        ) : (
          <>
            {draft.response_text && (
              <div className="flex flex-col gap-1">
                <Typography variant="caption">Public reply</Typography>
                <Typography variant="small" as="p">
                  {draft.response_text}
                </Typography>
              </div>
            )}
            {draft.dm_text && (
              <div className="flex flex-col gap-1">
                <Typography variant="caption">Private DM</Typography>
                <Typography variant="small" as="p">
                  {draft.dm_text}
                </Typography>
              </div>
            )}
            {!draft.response_text && !draft.dm_text && (
              <Typography variant="caption" as="p">
                No text to send — approving runs the actions above.
              </Typography>
            )}
          </>
        )}

        {isPending ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => {
                    setResponseText(draft.response_text);
                    setDmText(draft.dm_text);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() =>
                    run("save", () =>
                      dispatch(
                        updateCommentDraft({
                          storeCode,
                          draftId: draft.id,
                          patch: {
                            response_text: responseText,
                            dm_text: dmText,
                          },
                        }),
                      ).unwrap(),
                    )
                  }
                >
                  {busy === "save" && <Spinner data-icon="inline-start" />}
                  Save Edits
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() => setIsEditing(true)}
              >
                <IconPencil data-icon="inline-start" />
                Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={busy !== null}
              onClick={() =>
                run("discard", () =>
                  dispatch(
                    discardCommentDraft({ storeCode, draftId: draft.id }),
                  ).unwrap(),
                )
              }
            >
              {busy === "discard" ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <IconTrash data-icon="inline-start" />
              )}
              Discard
            </Button>
            {/* Approving calls Meta synchronously — expect a second or three. */}
            <Button
              size="sm"
              disabled={busy !== null || isEditing}
              onClick={() =>
                run("approve", () =>
                  dispatch(
                    approveCommentDraft({ storeCode, draftId: draft.id }),
                  ).unwrap(),
                )
              }
            >
              {busy === "approve" ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <IconSend data-icon="inline-start" />
              )}
              Approve & Send
            </Button>
          </div>
        ) : (
          draft.reviewed_by_name && (
            <Typography variant="caption" as="p">
              {draft.status === "approved" ? "Approved" : "Discarded"} by{" "}
              {draft.reviewed_by_name}
              {draft.reviewed_at &&
                ` · ${formatRelativeTime(draft.reviewed_at)}`}
            </Typography>
          )
        )}
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
  const accounts =
    useAppSelector(
      (state) =>
        state.GetSocialAIReducer.FetchSocialAccountSubscriptionsState
          .FetchSocialAccountsSubscriptionsData,
    )?.results ?? [];
  const {
    FetchCommentDraftsData: draftsData,
    FetchCommentDraftsIsLoading: isLoading,
  } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchCommentDraftsState,
  );

  const [status, setStatus] = useState<CommentDraftStatus | "all">("pending");
  const [accountId, setAccountId] = useState("all");
  const pageRef = useRef(1);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (storeCode) dispatch(fetchSocialAccountsSubscriptions(storeCode));
  }, [dispatch, storeCode]);

  const loadPageOne = useCallback(() => {
    if (!storeCode) return;
    pageRef.current = 1;
    dispatch(
      fetchCommentDrafts({
        storeCode,
        status,
        accountId: accountId === "all" ? undefined : accountId,
      }),
    );
  }, [dispatch, storeCode, status, accountId]);

  useEffect(() => {
    loadPageOne();
  }, [loadPageOne]);

  // A pending draft follows the comment_tagged broadcast within seconds, so
  // refresh a beat after it — debounced, a busy post tags several at once.
  const handleSocketEvent = useCallback(
    (event: SocialSocketEvent) => {
      if (event.action_type !== "comment_tagged") return;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(loadPageOne, 3_000);
    },
    [loadPageOne],
  );
  useSocialSocket({
    storeCode,
    onEvent: handleSocketEvent,
    onReconnect: loadPageOne,
  });
  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    },
    [],
  );

  const drafts = draftsData?.results ?? [];
  const hasMore = Boolean(draftsData?.next);

  const loadMore = () => {
    if (!storeCode) return;
    pageRef.current += 1;
    dispatch(
      fetchCommentDrafts({
        storeCode,
        status,
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
          <Select
            value={status}
            onValueChange={(next) =>
              setStatus(next as CommentDraftStatus | "all")
            }
          >
            <SelectTrigger size="sm" className="w-36" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      ) : drafts.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <IconChecklist />
            </EmptyMedia>
            <EmptyTitle>
              {status === "pending" ? "Queue Clear" : "No Drafts"}
            </EmptyTitle>
            <EmptyDescription>
              {status === "pending"
                ? "Nothing is waiting for review. New drafts appear here as comments arrive under a Draft Automatically rule."
                : "Nothing matches these filters."}
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
