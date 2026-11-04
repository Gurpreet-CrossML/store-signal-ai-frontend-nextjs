import type { ComponentProps } from "react";

import MessagePan from "@/components/custom/message-pan";
import { LoadingState } from "@/components/custom/loading-state";
import { ThreadCard } from "@/components/custom/thread-card";
import type { ThreadMessage } from "@/redux/api-slice/thread-slice";

type MessagePanProps = ComponentProps<typeof MessagePan>;

export function ConversationTranscript({
  messages,
  totalMessages,
  loading,
  handlerEvents,
  customerName,
  closedAt,
  closedCartItemCount,
}: {
  messages: ThreadMessage[];
  totalMessages?: number;
  loading: boolean;
  handlerEvents: MessagePanProps["handlerEvents"];
  customerName: string;
  closedAt: MessagePanProps["closedAt"];
  closedCartItemCount: number;
}) {
  return (
    <ThreadCard
      title={
        <div className="flex items-center justify-between gap-3">
          <span>Conversation</span>
          <span className="text-sm font-normal text-muted-foreground">
            {totalMessages ?? messages.length} messages · full transcript
          </span>
        </div>
      }
    >
      {loading ? (
        <LoadingState label="Loading conversation…" />
      ) : messages.length ? (
        <div className="p-3">
          <MessagePan
            messages={messages}
            handlerEvents={handlerEvents}
            customerName={customerName}
            closedAt={closedAt}
            closedCartItemCount={closedCartItemCount}
          />
        </div>
      ) : (
        <div className="p-10 text-center text-sm text-muted-foreground">
          No messages in this conversation
        </div>
      )}
    </ThreadCard>
  );
}

export default ConversationTranscript;
