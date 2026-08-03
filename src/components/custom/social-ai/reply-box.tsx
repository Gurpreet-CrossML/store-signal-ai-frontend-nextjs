"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconMoodSmile } from "@tabler/icons-react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useState } from "react";

import { useAccountIdentity } from "./channel-context";

// Compact reply composer: page avatar + auto-growing textarea with an emoji
// popover and a Reply button. Enter submits, Shift+Enter inserts a newline.
export function ReplyBox({
  replyingTo,
  onSubmit,
}: {
  replyingTo: string;
  onSubmit: (text: string) => void;
}) {
  const account = useAccountIdentity();
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText("");
    setShowEmojiPicker(false);
  };

  return (
    <div className="mt-2 flex items-start gap-2">
      <Avatar size="sm">
        {account.profilePictureUrl ? (
          <AvatarImage src={account.profilePictureUrl} alt={account.name} />
        ) : (
          <AvatarFallback className="font-medium">
            {account.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="min-w-0 flex-1">
        <InputGroup className="rounded-lg">
          <InputGroupTextarea
            placeholder={`Reply to ${replyingTo}…`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            rows={1}
            className="min-h-0 text-sm"
          />
          <InputGroupAddon align="block-end">
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <InputGroupButton size="icon-xs" aria-label="Add emoji">
                  <IconMoodSmile />
                </InputGroupButton>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <EmojiPicker
                  onEmojiClick={(emoji: EmojiClickData) =>
                    setText((prev) => prev + emoji.emoji)
                  }
                  width={300}
                  height={320}
                  theme={Theme.AUTO}
                  previewConfig={{ showPreview: false }}
                  searchPlaceholder="Search emoji…"
                />
              </PopoverContent>
            </Popover>
            <InputGroupButton
              variant="default"
              className="ml-auto"
              onClick={submit}
              disabled={!text.trim()}
            >
              Reply
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}
