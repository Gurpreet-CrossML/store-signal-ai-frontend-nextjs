import {
  IconMaximize,
  IconMicrophone,
  IconMoodSmile,
  IconPaperclip,
  IconSend,
  IconSpeakerphone,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiDisclaimerNotice } from "./test-Ai-disclaimer-modal";

const quickReplies = [
  "Which products you sell?",
  "Can you check my order status?",
  "What's in my cart?",
];

export function TestConversationPanel() {
  return (
    <Card className="min-h-[620px] gap-0 overflow-hidden py-0">
      <CardHeader className="flex min-h-14 flex-row items-center justify-between border-b-2 px-5">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg font-semibold">
            StoreSignal AI
          </CardTitle>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Active
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Button variant="ghost" size="icon-sm" aria-label="Toggle sound">
            <IconSpeakerphone className="size-5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Expand chat">
            <IconMaximize className="size-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-[540px] flex-1 flex-col px-5 py-5">
        <div className="flex gap-4">
          <div className="min-w-0">
            <div className="w-fit max-w-full rounded-md border bg-muted/50 px-3 py-3 text-sm font-medium shadow-xs">
              Hi there! How can I help you today?
            </div>
            <p className="mt-1 text-xs text-muted-foreground">6:56 PM</p>
          </div>
        </div>

        <div className="mt-1 flex flex-wrap gap-3 pl-0 md:pl-0">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              className="h-9 rounded-full border border-primary px-3 text-sm font-medium text-primary transition hover:bg-primary/5"
              type="button"
            >
              {reply}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <div className="rounded-md border bg-background px-4 py-3 shadow-xs">
            <textarea
              className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Message..."
              rows={1}
            />
            <div className="mt-0.5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Button variant="ghost" size="icon-sm" aria-label="Emoji">
                  <IconMoodSmile className="size-5" />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Attach file">
                  <IconPaperclip className="size-5" />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Voice input">
                  <IconMicrophone className="size-5" />
                </Button>
              </div>
              <Button size="icon-lg" className="rounded-full">
                <IconSend className="size-5" />
              </Button>
            </div>
          </div>
          <AiDisclaimerNotice />
        </div>
      </CardContent>
    </Card>
  );
}
