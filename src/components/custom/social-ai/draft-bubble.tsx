"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IconPencil,
  IconSend,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { ACTIONS } from "@/lib/comment-handling-data";
import { formatRelativeTime } from "@/lib/helpers";
import { useAppDispatch } from "@/redux/hooks";
import {
  approveCommentDraft,
  discardCommentDraft,
  fetchUserCommentDraft,
  fetchUserMessageDraft,
  updateCommentDraft,
  type CommentDraft,
} from "@/redux/api-slice/social-ai-slice";

import { useSocialSocket, type SocialSocketEvent } from "./use-social-socket";

/** How a reviewed draft left the screen — "stale" means someone else handled it. */
export type DraftOutcome = "approved" | "discarded" | "stale";

// Meta allows a private reply to a comment only within 7 days of it, once.
const PRIVATE_REPLY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * A pending AI draft reviewed in context — under its source comment, pinned
 * at the bottom of a DM thread, or in the review queue. One draft can hold
 * a public reply and a private DM at once ("Reply Publicly + Move to DM"
 * rules); one approval sends everything it holds, so both texts show.
 *
 * Display is driven by the `draft` prop, so a comment_draft_updated
 * broadcast the parent applies shows up immediately; the edit fields are
 * seeded when editing starts, not at mount, for the same reason. A save
 * reports the server's version through `onSaved` for parents that hold the
 * draft themselves (the queue's redux row updates on its own).
 */
export function DraftBubble({
  draft,
  storeCode,
  onSaved,
  onResolved,
}: {
  draft: CommentDraft;
  storeCode: string;
  onSaved?: (draft: CommentDraft) => void;
  onResolved: (outcome: DraftOutcome) => void;
}) {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [dmText, setDmText] = useState("");
  const [busy, setBusy] = useState<"approve" | "discard" | "save" | null>(null);

  // A snapshot, not a ticking clock — minute drift is noise on a 7-day rule.
  const [now] = useState(() => Date.now());
  const commentAt = draft.message.external_created_at;
  const privateReplyLate =
    Boolean(draft.dm_text && commentAt) &&
    now - new Date(commentAt).getTime() > PRIVATE_REPLY_WINDOW_MS;

  const startEditing = () => {
    setResponseText(draft.response_text);
    setDmText(draft.dm_text);
    setIsEditing(true);
  };

  const run = async (
    kind: "approve" | "discard" | "save",
    action: () => Promise<unknown>,
  ) => {
    setBusy(kind);
    try {
      await action();
    } catch {
      // The thunk toasted; a refusal means the draft left pending state.
      onResolved("stale");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
      <div className="flex flex-wrap items-center gap-2">
        <IconSparkles className="size-4 shrink-0 text-muted-foreground" />
        <Typography variant="small" as="span">
          AI draft
        </Typography>
        <Badge variant="secondary">Awaiting approval</Badge>
        <Typography variant="caption" as="span" className="ml-auto">
          Drafted {formatRelativeTime(draft.created_at)} · {draft.rule_source}
        </Typography>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Typography variant="caption">Will do:</Typography>
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
          {draft.response_text && (
            <div className="flex flex-col gap-1">
              <Typography variant="caption">Public reply</Typography>
              <Textarea
                value={responseText}
                onChange={(event) => setResponseText(event.target.value)}
              />
            </div>
          )}
          {draft.dm_text && (
            <div className="flex flex-col gap-1">
              <Typography variant="caption">Private DM</Typography>
              <Textarea
                value={dmText}
                onChange={(event) => setDmText(event.target.value)}
              />
            </div>
          )}
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

      {draft.dm_text && commentAt && (
        <Typography
          variant="caption"
          as="p"
          className={
            privateReplyLate ? "text-amber-600 dark:text-amber-400" : undefined
          }
        >
          {privateReplyLate
            ? `The comment is from ${formatRelativeTime(commentAt)} — Meta only allows the private DM within 7 days, so approving will likely fail.`
            : `Comment from ${formatRelativeTime(commentAt)} — Meta allows the private DM only within 7 days of the comment.`}
        </Typography>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {isEditing ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy !== null}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() =>
                run("save", async () => {
                  const saved = await dispatch(
                    updateCommentDraft({
                      storeCode,
                      draftId: draft.id,
                      patch: { response_text: responseText, dm_text: dmText },
                    }),
                  ).unwrap();
                  onSaved?.(saved);
                  setIsEditing(false);
                })
              }
            >
              {busy === "save" && <Spinner data-icon="inline-start" />}
              Save Edits
            </Button>
          </>
        ) : (
          (draft.response_text || draft.dm_text) && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={startEditing}
            >
              <IconPencil data-icon="inline-start" />
              Edit
            </Button>
          )
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={busy !== null}
          onClick={() =>
            run("discard", async () => {
              await dispatch(
                discardCommentDraft({ storeCode, draftId: draft.id }),
              ).unwrap();
              onResolved("discarded");
            })
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
            run("approve", async () => {
              await dispatch(
                approveCommentDraft({ storeCode, draftId: draft.id }),
              ).unwrap();
              onResolved("approved");
            })
          }
        >
          {busy === "approve" ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <IconSend data-icon="inline-start" />
          )}
          Approve &amp; Send
        </Button>
      </div>
    </div>
  );
}

/**
 * Applies a draft broadcast to one slot's held draft: an update while
 * pending refreshes it, one that left pending state clears it and reports
 * the outcome (someone else handled it), and a created event fills an
 * empty slot without a fetch.
 */
function applyDraftBroadcast(
  event: Extract<
    SocialSocketEvent,
    { action_type: "comment_draft_created" | "comment_draft_updated" }
  >,
  setDraft: React.Dispatch<React.SetStateAction<CommentDraft | null>>,
  onResolved: (outcome: DraftOutcome) => void,
) {
  const incoming = event.data.draft;
  if (event.action_type === "comment_draft_created") {
    setDraft((prev) => prev ?? incoming);
    return;
  }
  if (incoming.status === "pending") {
    setDraft(incoming);
    return;
  }
  setDraft(null);
  onResolved(incoming.status === "approved" ? "approved" : "discarded");
}

/**
 * Fetches a contact's pending comment draft on a post and shows it under
 * the source comment, then keeps it live off the draft broadcasts. The
 * endpoint returns every pending draft the contact has on the post, so the
 * row is matched back by its source comment id.
 */
export function CommentDraftSlot({
  storeCode,
  postId,
  commentId,
  userId,
  onResolved,
}: {
  storeCode: string;
  /** The post's external Graph id. */
  postId: string;
  commentId: number;
  /** The commenter's SocialUser id. */
  userId: number;
  onResolved: (outcome: DraftOutcome) => void;
}) {
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState<CommentDraft | null>(null);

  useEffect(() => {
    let cancelled = false;
    dispatch(fetchUserCommentDraft({ storeCode, postId, userId }))
      .unwrap()
      .then((data) => {
        if (cancelled) return;
        setDraft(
          (data.results ?? []).find(
            (row) => row.message.id === commentId && row.status === "pending",
          ) ?? null,
        );
      })
      .catch(() => {
        // The thunk already toasts; the comment just shows no bubble.
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, storeCode, postId, userId, commentId]);

  const handleDraftEvent = useCallback(
    (event: SocialSocketEvent) => {
      if (
        event.action_type !== "comment_draft_created" &&
        event.action_type !== "comment_draft_updated"
      )
        return;
      if (event.data.draft.message.id !== commentId) return;
      applyDraftBroadcast(event, setDraft, onResolved);
    },
    [commentId, onResolved],
  );
  useSocialSocket({ storeCode, onEvent: handleDraftEvent });

  if (!draft) return null;
  return (
    <DraftBubble
      draft={draft}
      storeCode={storeCode}
      onSaved={setDraft}
      onResolved={(outcome) => {
        setDraft(null);
        onResolved(outcome);
      }}
    />
  );
}

/** Fetches a contact's pending drafted DM, for pinning under the thread. */
export function MessageDraftSlot({
  storeCode,
  pageId,
  userId,
  onResolved,
}: {
  storeCode: string;
  /** The connected account's external Graph id. */
  pageId: string;
  /** The conversation contact's SocialUser id. */
  userId: number;
  onResolved: (outcome: DraftOutcome) => void;
}) {
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState<CommentDraft | null>(null);

  useEffect(() => {
    let cancelled = false;
    dispatch(fetchUserMessageDraft({ storeCode, pageId, userId }))
      .unwrap()
      .then((data) => {
        if (cancelled) return;
        setDraft(
          (data.results ?? []).find((row) => row.status === "pending") ?? null,
        );
      })
      .catch(() => {
        // The thunk already toasts; the thread just shows no pinned draft.
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, storeCode, pageId, userId]);

  const handleDraftEvent = useCallback(
    (event: SocialSocketEvent) => {
      if (
        event.action_type !== "comment_draft_created" &&
        event.action_type !== "comment_draft_updated"
      )
        return;
      const { account_external_id, draft: incoming } = event.data;
      if (account_external_id && account_external_id !== pageId) return;
      if (incoming.message.social_user?.id !== userId) return;
      // Only a draft that would send a DM belongs in the thread.
      if (event.action_type === "comment_draft_created" && !incoming.dm_text)
        return;
      // A contact can hold several drafts (one per comment) — an update to
      // one that isn't pinned here must not clobber the one that is.
      if (
        event.action_type === "comment_draft_updated" &&
        draft &&
        draft.id !== incoming.id
      )
        return;
      applyDraftBroadcast(event, setDraft, onResolved);
    },
    [pageId, userId, onResolved, draft],
  );
  useSocialSocket({ storeCode, onEvent: handleDraftEvent });

  if (!draft) return null;
  return (
    <DraftBubble
      draft={draft}
      storeCode={storeCode}
      onSaved={setDraft}
      onResolved={(outcome) => {
        setDraft(null);
        onResolved(outcome);
      }}
    />
  );
}
