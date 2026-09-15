"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconCheck,
  IconDeviceFloppy,
  IconMessageCircle,
  IconPencil,
  IconSend,
  IconSparkles,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { InfoIcon } from "@/components/custom/info-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
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
        {/* Semibold like a comment bubble's author line, so the heading
            reads as a heading next to same-size body text below. */}
        <Typography variant="small" as="span" className="font-semibold">
          AI Draft
        </Typography>
        <InfoIcon text="Meta allows a private reply to a comment only within 7 days of the comment, and only once — after that, approving the DM will fail." />
        {/* What the draft sends, at a glance — a public comment reply, a
            private DM, or both. */}
        {draft.response_text && (
          <Badge
            variant="outline"
            className={cn("gap-1", BADGE_TONE_STYLES.accent)}
          >
            <IconMessageCircle className="size-3" />
            Comment Reply
          </Badge>
        )}
        {draft.dm_text && (
          <Badge
            variant="outline"
            className={cn("gap-1", BADGE_TONE_STYLES.info)}
          >
            <IconSend className="size-3" />
            Private Reply
          </Badge>
        )}
        <Typography variant="caption" as="span" className="ml-auto">
          Drafted {formatRelativeTime(draft.created_at)}
        </Typography>
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
          {/* Each text is drawn as the message bubble it would become, so
              the draft reads apart from the heading above it. The chips
              already say what it is — a caption is only needed when both
              texts are present, to tell them apart. */}
          {draft.response_text && (
            <div className="flex flex-col gap-1">
              {draft.dm_text && (
                <Typography variant="caption">Comment reply</Typography>
              )}
              <div className="inline-block max-w-full self-start rounded-lg bg-muted px-3 py-2">
                <Typography variant="small" as="p">
                  {draft.response_text}
                </Typography>
              </div>
            </div>
          )}
          {draft.dm_text && (
            <div className="flex flex-col gap-1">
              {draft.response_text && (
                <Typography variant="caption">Private DM</Typography>
              )}
              <div className="inline-block max-w-full self-start rounded-lg bg-muted px-3 py-2">
                <Typography variant="small" as="p">
                  {draft.dm_text}
                </Typography>
              </div>
            </div>
          )}
          {!draft.response_text && !draft.dm_text && (
            <Typography variant="caption" as="p">
              No text to send — approving runs the drafted actions.
            </Typography>
          )}
        </>
      )}

      {/* The 7-day policy lives in the ⓘ; this only speaks up once the
          window has actually passed, because then approving will fail. */}
      {privateReplyLate && (
        <Typography
          variant="caption"
          as="p"
          className="text-amber-600 dark:text-amber-400"
        >
          The comment is from {formatRelativeTime(commentAt)} — Meta&apos;s
          7-day private-reply window has passed, so approving will likely fail.
        </Typography>
      )}

      {/* Icon buttons — the labels live in tooltips (and aria-labels). */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Discard"
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
                <Spinner className="size-4" />
              ) : (
                <IconTrash className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Discard</TooltipContent>
        </Tooltip>
        {isEditing ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Cancel Editing"
                  disabled={busy !== null}
                  onClick={() => setIsEditing(false)}
                >
                  <IconX className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cancel Editing</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Save Edits"
                  disabled={busy !== null}
                  onClick={() =>
                    run("save", async () => {
                      const saved = await dispatch(
                        updateCommentDraft({
                          storeCode,
                          draftId: draft.id,
                          patch: {
                            response_text: responseText,
                            dm_text: dmText,
                          },
                        }),
                      ).unwrap();
                      onSaved?.(saved);
                      setIsEditing(false);
                    })
                  }
                >
                  {busy === "save" ? (
                    <Spinner className="size-4" />
                  ) : (
                    <IconDeviceFloppy className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Edits</TooltipContent>
            </Tooltip>
          </>
        ) : (
          (draft.response_text || draft.dm_text) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Edit"
                  disabled={busy !== null}
                  onClick={startEditing}
                >
                  <IconPencil className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
          )
        )}
        {/* Approving calls Meta synchronously — expect a second or three.
            Mid-edit it saves first, so editing and sending is one click. */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              aria-label={isEditing ? "Save & Send" : "Approve & Send"}
              disabled={busy !== null}
              onClick={() =>
                run("approve", async () => {
                  if (
                    isEditing &&
                    (responseText !== draft.response_text ||
                      dmText !== draft.dm_text)
                  ) {
                    const saved = await dispatch(
                      updateCommentDraft({
                        storeCode,
                        draftId: draft.id,
                        patch: {
                          response_text: responseText,
                          dm_text: dmText,
                        },
                        silent: true,
                      }),
                    ).unwrap();
                    onSaved?.(saved);
                  }
                  await dispatch(
                    approveCommentDraft({ storeCode, draftId: draft.id }),
                  ).unwrap();
                  onResolved("approved");
                })
              }
            >
              {busy === "approve" ? (
                <Spinner className="size-4" />
              ) : (
                <IconCheck className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isEditing ? "Save & Send" : "Approve & Send"}
          </TooltipContent>
        </Tooltip>
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
  initialDraft = null,
  onResolved,
}: {
  storeCode: string;
  /** The post's external Graph id. */
  postId: string;
  commentId: number;
  /** The commenter's SocialUser id. */
  userId: number;
  /** A draft the broadcast already delivered — skips the fetch entirely. */
  initialDraft?: CommentDraft | null;
  onResolved: (outcome: DraftOutcome) => void;
}) {
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState<CommentDraft | null>(initialDraft);
  // Ref-held so the fetch effect doesn't re-run when the parent passes a
  // fresh arrow each render.
  const onResolvedRef = useRef(onResolved);
  useEffect(() => {
    onResolvedRef.current = onResolved;
  }, [onResolved]);

  useEffect(() => {
    // The broadcast handed the draft over; only a flag from the comments
    // list API (page load) leaves something to fetch.
    if (initialDraft) return;
    let cancelled = false;
    dispatch(fetchUserCommentDraft({ storeCode, postId, userId }))
      .unwrap()
      .then((data) => {
        if (cancelled) return;
        const pending = (data.results ?? []).filter(
          (row) => row.status === "pending",
        );
        const match =
          pending.find(
            (row) => String(row.message?.id) === String(commentId),
          ) ??
          // The endpoint is already scoped to this contact on this post —
          // a single pending draft is unambiguous even when the nested
          // message shape drifts from the comments-list row.
          (pending.length === 1 ? pending[0] : null);
        setDraft(match);
        // The list flagged a pending draft but none exists any more —
        // clear the badge rather than advertise a draft nobody can see.
        if (!match) onResolvedRef.current("stale");
      })
      .catch(() => {
        // The thunk already toasts; the comment just shows no bubble.
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, storeCode, postId, userId, commentId, initialDraft]);

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
  const onResolvedRef = useRef(onResolved);
  useEffect(() => {
    onResolvedRef.current = onResolved;
  }, [onResolved]);

  useEffect(() => {
    let cancelled = false;
    dispatch(fetchUserMessageDraft({ storeCode, pageId, userId }))
      .unwrap()
      .then((data) => {
        if (cancelled) return;
        const match =
          (data.results ?? []).find((row) => row.status === "pending") ?? null;
        setDraft(match);
        // Flagged pending, nothing found — clear the badge, don't lie.
        if (!match) onResolvedRef.current("stale");
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
