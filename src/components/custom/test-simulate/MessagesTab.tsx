import { useEffect } from "react";
import { useTestChatbotContext } from "@/clients/test-simulate";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "../MessageInput";
import { FeedbackCard } from "./FeedbackCard";

const DEFAULT_GREETING_MESSAGE = "Hi there! How can I help you today?";
const DEFAULT_SUGGESTIONS = [
  "Which products you sell?",
  "Can you check my order status?",
  "What's in my cart?",
];

export function MessagesTab() {
  const {
    messages,
    sendMessage,
    responseLoading,
    messageContainerRef,
    handleScroll,
    isStreaming,
    resetChat,
  } = useTestChatbotContext();

  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const feedbackAssistant = [...messages]
    .reverse()
    .find(
      (message) =>
        message.role === "assistant" &&
        message.json_content?.is_feedback_flow === true &&
        message.json_content?.feedback_step === "awaiting_rating",
    );

  const isFeedbackFlow =
    latestAssistant?.json_content?.is_feedback_flow === true;
  const feedbackStep = latestAssistant?.json_content?.feedback_step;
  const showFeedback = Boolean(feedbackAssistant);
  const showGreeting = messages.length === 0;
  const suggestions = showGreeting
    ? DEFAULT_SUGGESTIONS
    : latestAssistant?.show_suggestions
      ? latestAssistant?.json_content?.suggestions
      : [];

  useEffect(() => {
    if (isFeedbackFlow && feedbackStep === "done") {
      const timer = window.setTimeout(() => {
        void resetChat();
      }, 2000);
      return () => window.clearTimeout(timer);
    }
  }, [feedbackStep, isFeedbackFlow, resetChat]);

  useEffect(() => {
    handleScroll();
  }, [handleScroll, messages, showFeedback]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        id="chat-container"
        ref={messageContainerRef}
        className="min-h-0 flex-1 overflow-y-auto pr-1"
      >
        <div className="space-y-0">
          {showGreeting && (
            <MessageBubble
              message={{
                id: "greeting",
                role: "assistant",
                message: DEFAULT_GREETING_MESSAGE,
                created_at: new Date(),
              }}
            />
          )}

          {messages.map((message, index) =>
            message.chat_hanlder ? (
              <div
                key={`${message.id}-${message.role}-${index}`}
                className="flex items-center gap-3 py-1 text-xs text-muted-foreground"
              >
                <span className="h-px flex-1 bg-border" />
                <span>{message.message}</span>
                <span className="h-px flex-1 bg-border" />
              </div>
            ) : (
              <MessageBubble
                key={`${message.id}-${message.role}-${index}`}
                message={message}
              />
            ),
          )}

          {suggestions &&
          suggestions.length > 0 &&
          !responseLoading &&
          !showFeedback ? (
            <div className="flex flex-wrap gap-2 pl-0">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full border-primary px-3 text-xs text-primary hover:bg-primary/5 hover:text-primary"
                  onClick={() => sendMessage(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          ) : null}

          {responseLoading && !isStreaming ? (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-md px-3 py-2">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
              </div>
            </div>
          ) : null}

        </div>
      </div>

      {!showFeedback && <MessageInput />}

      {showFeedback ? (
         <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
          <FeedbackCard
            ratingChoices={feedbackAssistant?.json_content?.rating_choices}
            onDone={resetChat}
          />
        </div>
      ) : null}
    </div>
  );
}
