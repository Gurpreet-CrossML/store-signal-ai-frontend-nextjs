"use client";

import { useEffect, useRef, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { MessageReactionPicker } from "@/components/custom/message-reaction-picker";
import type { MetaDm } from "@/redux/api-slice/social-ai-slice";
import {
  reactToMetaMessage,
  replyToMetaMessage,
} from "@/redux/api-slice/social-ai-slice";
import type { SocialConversation } from "@/lib/social-dm";
import { formatRelativeTime } from "@/lib/helpers";
import { useAppDispatch } from "@/redux/hooks";
import {
  IconArrowBackUp,
  IconMessage2,
  IconMoodSmile,
  IconSend,
  IconX,
} from "@tabler/icons-react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

// Local-only annotation on an optimistically-appended reply — the backend
// doesn't persist which message a DM reply targeted (unlike comment replies),
// so "Replying to X" only survives for the length of this chat session.
type RenderedDm = MetaDm & {
  replyToName?: string;
  replyToContent?: string;
};

type ReplyTarget = { id: number; name: string; content: string };

// Callers key this component by `conversation.contactKey`, so React remounts
// it (and re-seeds `localMessages`/`draft` from scratch) on every conversation
// switch — no reset effect needed.
export function SocialChatWindow({
  conversation,
}: {
  conversation: SocialConversation | null;
}) {
  const dispatch = useAppDispatch();
  const [localMessages, setLocalMessages] = useState<RenderedDm[]>(
    conversation?.messages ?? [],
  );
  const [draft, setDraft] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [reactingMessageId, setReactingMessageId] = useState<number | null>(
    null,
  );
  const [insertEmojiOpen, setInsertEmojiOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [localMessages]);

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Select a conversation to view the chat.
      </div>
    );
  }

  // Reactions target an existing message directly, so we already have its
  // real id — set it in place, no refetch needed. Optimistic; the thunk
  // itself toasts on failure.
  const handleReact = (messageId: number, emoji: string) => {
    setLocalMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, owner_reaction: emoji } : m,
      ),
    );
    dispatch(
      reactToMetaMessage({ messageId: String(messageId), reaction: emoji }),
    );
  };

  // The reply endpoint is also the only "send" endpoint — every message needs
  // an existing message on the thread to anchor the recipient, so a plain
  // send (no explicit reply target) anchors on the most recent message.
  const handleSend = () => {
    const text = draft.trim();
    const anchor =
      replyTarget?.id ?? localMessages[localMessages.length - 1]?.id;
    if (!text || !anchor) return;

    dispatch(replyToMetaMessage({ messageId: String(anchor), message: text }))
      .unwrap()
      .then(() => {
        setLocalMessages((prev) => [
          ...prev,
          {
            id: -Date.now(),
            external_message_id: `local-${Date.now()}`,
            sender_type: "agent",
            message_direction: "outgoing",
            content: text,
            external_created_at: new Date().toISOString(),
            social_user_id: null,
            contact_external_id: null,
            contact_name: null,
            contact_username: null,
            contact_avatar: null,
            owner_reaction: null,
            contact_reaction: null,
            replyToName: replyTarget?.name,
            replyToContent: replyTarget?.content,
          },
        ]);
        setDraft("");
        setReplyTarget(null);
      })
      .catch(() => {
        // Failure is already surfaced by the thunk's own toast.
      });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CardHeader className="border-b border-border/50 bg-background/95 py-3.5">
        <div className="flex items-center gap-2.5">
          <CustomerAvatar name={conversation.contactName} />
          <div>
            <CardTitle className="text-base leading-tight">
              {conversation.contactName}
            </CardTitle>
            {conversation.contactUsername && (
              <span className="text-xs text-muted-foreground">
                @{conversation.contactUsername}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div
          ref={containerRef}
          className="flex-1 min-h-0 space-y-3 overflow-y-auto p-4"
        >
          {localMessages.length > 0 ? (
            localMessages.map((message) => {
              const outgoing = message.message_direction === "outgoing";
              const reactions = [
                message.owner_reaction
                  ? { emoji: message.owner_reaction, mine: true }
                  : null,
                message.contact_reaction
                  ? { emoji: message.contact_reaction, mine: false }
                  : null,
              ].filter(
                (r): r is { emoji: string; mine: boolean } => r !== null,
              );

              return (
                <div
                  key={message.id}
                  className={`group flex ${outgoing ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[75%] items-center gap-1 ${outgoing ? "flex-row-reverse" : ""}`}
                  >
                    <div className="flex flex-col gap-1">
                      {message.replyToName && (
                        <div
                          className={`rounded-lg border-l-2 border-primary/40 bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground ${outgoing ? "text-right" : ""}`}
                        >
                          <span className="font-medium text-foreground">
                            Replying to {message.replyToName}
                          </span>
                          <p className="truncate">{message.replyToContent}</p>
                        </div>
                      )}

                      <div className="relative">
                        <div
                          className={`rounded-xl px-3 py-2 text-sm wrap-break-word ${
                            outgoing
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-secondary border border-border rounded-tl-none"
                          }`}
                        >
                          {message.content || "[Attachment]"}
                        </div>
                        {reactions.length > 0 && (
                          <div
                            className={`absolute -bottom-2.5 flex gap-0.5 ${outgoing ? "left-2" : "right-2"}`}
                          >
                            {reactions.map((r) => (
                              <span
                                key={`${r.emoji}-${r.mine}`}
                                title={
                                  r.mine
                                    ? "You reacted"
                                    : `${conversation.contactName} reacted`
                                }
                                className="flex h-5 items-center rounded-full border border-border bg-background px-1 text-xs shadow-sm"
                              >
                                {r.emoji}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <span
                        className={`text-[11px] text-muted-foreground ${outgoing ? "text-right" : "text-left"} ${reactions.length > 0 ? "mt-1.5" : ""}`}
                      >
                        {formatRelativeTime(message.external_created_at)}
                      </span>
                    </div>

                    {/* Hover actions — emoji reaction + reply, shown on the
                        inner side of the bubble (toward center) for both
                        directions. */}
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <MessageReactionPicker
                        open={reactingMessageId === message.id}
                        onOpenChange={(open) =>
                          setReactingMessageId(open ? message.id : null)
                        }
                        onReact={(emoji) => handleReact(message.id, emoji)}
                        align={outgoing ? "end" : "start"}
                      >
                        <button
                          type="button"
                          title="React"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <IconMoodSmile className="h-4 w-4" />
                        </button>
                      </MessageReactionPicker>
                      <button
                        type="button"
                        title="Reply"
                        onClick={() =>
                          setReplyTarget({
                            id: message.id,
                            name: outgoing ? "You" : conversation.contactName,
                            content: message.content || "[Attachment]",
                          })
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <IconArrowBackUp className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
              <IconMessage2 className="mb-1 h-6 w-6 opacity-40" />
              <p className="font-medium text-foreground">Nothing here yet</p>
              <p>Messages for this conversation will show up here.</p>
            </div>
          )}
        </div>

        <div className="border-t border-border/50 p-3">
          {replyTarget && (
            <div className="mb-2 flex items-start justify-between gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs">
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  Replying to {replyTarget.name}
                </p>
                <p className="truncate text-muted-foreground">
                  {replyTarget.content}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                title="Cancel reply"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-1.5 shadow-sm transition-shadow focus-within:border-primary/50 focus-within:shadow-md">
            <Popover open={insertEmojiOpen} onOpenChange={setInsertEmojiOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title="Add emoji"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                >
                  <IconMoodSmile className="h-4.5 w-4.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-auto border-none bg-transparent p-0 shadow-none ring-0"
              >
                <EmojiPicker
                  onEmojiClick={(emojiData: EmojiClickData) => {
                    setDraft((prev) => `${prev}${emojiData.emoji}`);
                    setInsertEmojiOpen(false);
                  }}
                  theme={Theme.LIGHT}
                  previewConfig={{ showPreview: false }}
                  searchPlaceholder="Search emoji…"
                  width={320}
                  height={380}
                />
              </PopoverContent>
            </Popover>

            <input
              type="text"
              value={draft}
              placeholder="Message..."
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!draft.trim()}
              title="Send message"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all disabled:cursor-not-allowed ${
                draft.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <IconSend className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </div>
  );
}
