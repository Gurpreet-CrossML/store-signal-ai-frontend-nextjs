import type { ComponentProps } from "react";

import { MessagePan } from "@/components/custom/message-pan";
import { LoadingState } from "@/components/custom/loading-state";
import { ThreadCard } from "@/components/custom/thread-card";
import type { ThreadMessage } from "@/redux/api-slice/thread-slice";

type MessagePanProps = ComponentProps<typeof MessagePan>;

export function ConversationTranscript({
  messages,
  loading,
  handlerEvents,
  customerName,
  closedAt,
  closedCartItemCount,
}: {
  messages: ThreadMessage[];
  loading: boolean;
  handlerEvents: MessagePanProps["handlerEvents"];
  customerName: string;
  closedAt: MessagePanProps["closedAt"];
  closedCartItemCount: number;
}) {
  return (
    <ThreadCard title="Conversation">
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
