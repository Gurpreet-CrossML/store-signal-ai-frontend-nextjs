import { useState } from "react";
import { SocialMessage, SocialContact } from "@/lib/mock-social-data";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { cn } from "@/lib/utils";
import { IconCheck, IconChecks, IconMoodSmile } from "@tabler/icons-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EmojiPicker from "emoji-picker-react";

interface SocialChatMessageProps {
  message: SocialMessage;
  contact: SocialContact;
}

export function SocialChatMessage({
  message,
  contact,
}: SocialChatMessageProps) {
  const isAgent = message.sender === "agent";
  const [reaction, setReaction] = useState<string | null>(
    message.reaction || null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isAgent ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex gap-3 max-w-[80%]",
          isAgent ? "flex-row-reverse" : "flex-row",
        )}
      >
        {!isAgent && (
          <CustomerAvatar
            name={contact.name}
            src={contact.avatar}
            size="w-8 h-8"
          />
        )}

        <div
          className={cn(
            "flex flex-col gap-1 relative group",
            isAgent ? "items-end" : "items-start",
          )}
        >
          <div className="flex items-center gap-2">
            {isAgent && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="React"
                    >
                      <IconMoodSmile className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 border-none shadow-none bg-transparent"
                    align="end"
                    side="top"
                  >
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setReaction(emojiData.emoji);
                        setPickerOpen(false);
                      }}
                      lazyLoadEmojis={true}
                      width={300}
                      height={400}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="relative">
              <div
                className={cn(
                  "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                  isAgent
                    ? "bg-[#F3E8FF] text-[#5B21B6] rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm",
                )}
              >
                {message.content}
              </div>

              {reaction && (
                <div
                  className={cn(
                    "absolute -bottom-3 bg-background border rounded-full px-1.5 py-0.5 text-xs shadow-sm cursor-pointer hover:scale-110 transition-transform z-10",
                    isAgent ? "left-2" : "right-2",
                  )}
                  onClick={() => setReaction(null)}
                >
                  {reaction}
                </div>
              )}
            </div>

            {!isAgent && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="React"
                    >
                      <IconMoodSmile className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 border-none shadow-none bg-transparent"
                    align="start"
                    side="top"
                  >
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setReaction(emojiData.emoji);
                        setPickerOpen(false);
                      }}
                      lazyLoadEmojis={true}
                      width={300}
                      height={400}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 px-1 relative">
            <span className="text-[11px] text-muted-foreground mr-1">
              {message.time}
            </span>

            {isAgent && (
              <div className="ml-1">
                {message.isRead ? (
                  <IconChecks className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <IconCheck className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
