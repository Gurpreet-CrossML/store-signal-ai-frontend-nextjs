"use client";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { IconMoodSmile, IconPhoto, IconSend } from "@tabler/icons-react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import {
  COMPOSER_ACCEPT,
  ComposerAttachmentPreview,
  pickComposerAttachment,
  releaseComposerAttachment,
  type ComposerAttachment,
} from "./composer-attachments";

/**
 * The reply composer, built to match Live Support's: a bordered card
 * holding an auto-growing textarea above a toolbar (emoji, optional
 * attach, keyboard hint, and a labelled Send button).
 *
 * `allowAttachments` turns on the media picker — DMs support sending
 * photos, video and audio; comment replies are text-only at Meta's end,
 * so they leave it off.
 */
export function ReplyBox({
  replyingTo,
  onSubmit,
  textareaId,
  placeholder,
  disabled = false,
  allowAttachments = false,
}: {
  replyingTo: string;
  onSubmit: (text: string, attachment: File | null) => void;
  textareaId?: string;
  placeholder?: string;
  disabled?: boolean;
  allowAttachments?: boolean;
}) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<ComposerAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow like a chat app, capped at a few lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  // Text is required; an image rides along with it.
  const canSend = !disabled && text.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSubmit(text.trim(), attachment?.file ?? null);
    setText("");
    releaseComposerAttachment(attachment);
    setAttachment(null);
    setShowEmojiPicker(false);
  };

  const handleFilesPicked = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = pickComposerAttachment(event.target.files);
    if (picked) {
      releaseComposerAttachment(attachment);
      setAttachment(picked);
    }
    // Clearing lets the same file be chosen again after being removed.
    event.target.value = "";
  };

  const removeAttachment = (id: string) => {
    if (attachment?.id === id) {
      releaseComposerAttachment(attachment);
      setAttachment(null);
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-background shadow-xs transition-shadow focus-within:border-primary/50 focus-within:shadow-sm">
      {showEmojiPicker && (
        <div className="border-b border-border/50 p-2">
          <EmojiPicker
            onEmojiClick={(emoji: EmojiClickData) =>
              setText((prev) => prev + emoji.emoji)
            }
            width="100%"
            height={320}
            theme={Theme.AUTO}
            previewConfig={{ showPreview: false }}
            searchPlaceholder="Search emoji…"
          />
        </div>
      )}

      {attachment && (
        <div className="border-b border-border/50 p-2">
          <ComposerAttachmentPreview
            attachment={attachment}
            onRemove={removeAttachment}
            disabled={disabled}
          />
        </div>
      )}

      <div className="px-3 pt-3">
        <textarea
          ref={textareaRef}
          id={textareaId}
          rows={1}
          placeholder={placeholder ?? `Reply to ${replyingTo}…`}
          value={text}
          disabled={disabled}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          className="max-h-30 w-full resize-none bg-transparent py-1 text-sm leading-6 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* Toolbar: emoji + attach + hint on the left, send on the right */}
      <div className="flex items-center gap-1 p-2">
        <button
          type="button"
          disabled={disabled}
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 ${
            showEmojiPicker
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Add emoji"
        >
          <IconMoodSmile className="size-4" />
        </button>
        {allowAttachments && (
          <>
            <button
              type="button"
              disabled={disabled}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => fileInputRef.current?.click()}
              title="Attach photo"
            >
              <IconPhoto className="size-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={COMPOSER_ACCEPT}
              disabled={disabled}
              onChange={handleFilesPicked}
              className="hidden"
            />
          </>
        )}
        <Typography
          variant="muted"
          as="span"
          className="ml-2 hidden truncate sm:inline"
        >
          Enter to send · Shift + Enter for a new line
        </Typography>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {attachment && (
            <Typography variant="muted" as="span">
              1 attached
            </Typography>
          )}
          <Button type="button" size="sm" onClick={submit} disabled={!canSend}>
            <IconSend className="size-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
