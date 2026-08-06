"use client";

import type { ReactNode } from "react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Facebook/Messenger's classic six, in their conventional order. The library
// matches these against its internal emoji data by unified hex codepoint
// (e.g. "1f44d"), NOT the literal unicode character — passing raw emoji here
// silently matches nothing and only the "+" expand button renders.
const QUICK_REACTIONS = [
  "2764-fe0f", // ❤️
  "1f602", // 😂
  "1f62e", // 😮
  "1f622", // 😢
  "1f620", // 😠
  "1f44d", // 👍
];

export function MessageReactionPicker({
  open,
  onOpenChange,
  onReact,
  align = "start",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReact: (emoji: string) => void;
  align?: "start" | "center" | "end";
  children: ReactNode;
}) {
  const handlePick = (emojiData: EmojiClickData) => {
    onReact(emojiData.emoji);
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-auto border-none bg-transparent p-0 shadow-none ring-0"
      >
        <EmojiPicker
          reactionsDefaultOpen
          allowExpandReactions
          reactions={QUICK_REACTIONS}
          onReactionClick={handlePick}
          onEmojiClick={handlePick}
          theme={Theme.LIGHT}
          previewConfig={{ showPreview: false }}
          searchPlaceholder="Search emoji…"
          width={320}
          height={380}
        />
      </PopoverContent>
    </Popover>
  );
}
