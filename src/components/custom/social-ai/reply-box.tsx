"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IconMoodSmile, IconSend2 } from "@tabler/icons-react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useState } from "react";

import { useAccountIdentity } from "./channel-context";

// Compact reply composer: page avatar + pill-shaped input with an emoji
// popover (left) and an icon send button (right, disabled while empty).
// Enter submits, Shift+Enter inserts a newline.
export function ReplyBox({
    replyingTo,
    onSubmit,
    textareaId,
    placeholder,
    disabled = false,
}: {
    replyingTo: string;
    onSubmit: (text: string) => void;
    textareaId?: string;
    placeholder?: string;
    disabled?: boolean;
}) {
    const account = useAccountIdentity();
    const [text, setText] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const canSend = !disabled && text.trim().length > 0;

    const submit = () => {
        if (!canSend) return;
        onSubmit(text.trim());
        setText("");
        setShowEmojiPicker(false);
    };

    return (
        <div className="flex items-center gap-2">
            <Avatar size="sm">
                {account.profilePictureUrl ? (
                    <AvatarImage src={account.profilePictureUrl} alt={account.name} />
                ) : (
                    <AvatarFallback className="font-medium">
                        {account.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                )}
            </Avatar>
            <InputGroup className="flex-1 rounded-full">
                <InputGroupAddon align="inline-start">
                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                        <PopoverTrigger asChild>
                            <InputGroupButton
                                size="icon-xs"
                                className="rounded-full"
                                aria-label="Add emoji"
                                disabled={disabled}
                            >
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
                                theme={Theme.LIGHT}
                                previewConfig={{ showPreview: false }}
                                searchPlaceholder="Search emoji…"
                            />
                        </PopoverContent>
                    </Popover>
                </InputGroupAddon>
                <InputGroupTextarea
                    id={textareaId}
                    placeholder={placeholder ?? `Reply to ${replyingTo}…`}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            submit();
                        }
                    }}
                    rows={1}
                    disabled={disabled}
                    className="min-h-0 text-sm"
                />
                <InputGroupAddon align="inline-end">
                    <InputGroupButton
                        size="icon-xs"
                        className="rounded-full"
                        variant={canSend ? "default" : "ghost"}
                        onClick={submit}
                        disabled={!canSend}
                        aria-label="Send"
                    >
                        <IconSend2 />
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
        </div>
    );
}
