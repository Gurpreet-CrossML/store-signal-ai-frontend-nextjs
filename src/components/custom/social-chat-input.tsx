"use client";

import { useState, useRef, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconSparkles,
  IconMoodSmile,
  IconPaperclip,
  IconSend,
} from "@tabler/icons-react";
import EmojiPicker, { Theme } from "emoji-picker-react";

export interface SocialChatInputProps {
  onSend?: (text: string) => void;
}

export function SocialChatInput({ onSend }: SocialChatInputProps = {}) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow the composer
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [message]);

  const handleSend = () => {
    if (message.trim() && onSend) {
      onSend(message);
      setMessage("");
    }
  };

  const canSend = message.trim().length > 0;

  return (
    <div className="relative border-t border-border/50 bg-background/95 p-4">
      <div className="rounded-2xl border border-border/60 bg-background shadow-sm transition-shadow focus-within:border-primary/50 focus-within:shadow-md">
        {/* Text input row */}
        <div className="px-3 pt-2">
          <textarea
            id="chat-input"
            ref={textareaRef}
            rows={1}
            placeholder="Type your reply…"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="max-h-[120px] w-full resize-none bg-transparent py-1 text-sm leading-6 outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Controls row: emoji + attach on the left, send on the right */}
        <div className="flex items-center justify-between gap-2 p-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
              title="Generate with AI"
            >
              <IconSparkles className="h-4 w-4" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
                  title="Add emoji"
                >
                  <IconMoodSmile className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-auto p-0 border-none shadow-none"
              >
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    setMessage((prev) => prev + emojiData.emoji);
                  }}
                  width={300}
                  height={400}
                  theme={Theme.LIGHT}
                  previewConfig={{ showPreview: false }}
                  searchPlaceholder="Search emoji…"
                />
              </DropdownMenuContent>
            </DropdownMenu>

            <input
              type="file"
              id="file-upload-dms"
              className="hidden"
              accept="image/*"
            />
            <button
              type="button"
              onClick={() =>
                document.getElementById("file-upload-dms")?.click()
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
              title="Attach image or file"
            >
              <IconPaperclip className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all disabled:cursor-not-allowed ${
              canSend
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                : "bg-muted text-muted-foreground"
            }`}
            title="Send message"
          >
            <IconSend className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-border/50 px-3 py-1.5 text-[11px] text-muted-foreground">
          <span>Enter to send · Shift + Enter for a new line</span>
        </div>
      </div>
    </div>
  );
}
