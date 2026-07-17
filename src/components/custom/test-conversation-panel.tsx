import { IconMaximize, IconSpeakerphone } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useTestChatbotContext } from "@/clients/test-simulate";
import { MessagesTab } from "./MessagesTab";

export function TestConversationPanel() {
  const {
    store,
    messages,
    loading,
    reInitializing,
    isSoundEnabled,
    toggleSound,
  } = useTestChatbotContext();

  return (
    <Card className="h-[780px] gap-0 overflow-hidden py-0">
      <CardHeader className="flex min-h-14 flex-row items-center justify-between border-b-2 px-5">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg font-semibold">
            StoreSignal AI
          </CardTitle>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {reInitializing ? "Refreshing" : "Active"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle sound"
            onClick={toggleSound}
            className={!isSoundEnabled ? "opacity-50" : undefined}
          >
            <IconSpeakerphone className="size-5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Expand chat">
            <IconMaximize className="size-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col px-5 py-5">
        {loading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="size-5" />
          </div>
        ) : (
          <MessagesTab />
        )}
      </CardContent>
    </Card>
  );
}
