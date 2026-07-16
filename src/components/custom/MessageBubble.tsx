import { useState } from "react";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatTimestamp,
  submitMessageFeedback,
  type Message,
  useTestChatbotContext,
} from "@/clients/test-simulate";
import { cn } from "@/lib/utils";
import { MessageAttachments } from "./MessageAttachments";

const SYNTHETIC_IMAGE_PATTERN = /\[Images? uploaded by user:[^\]]*\]/gi;

export function MessageBubble({ message }: { message: Message }) {
  const { session } = useTestChatbotContext();
  const isUser = message.role === "user";
  const isGreeting = message.id === "greeting";
  const displayMessage = message.message
    .replace(SYNTHETIC_IMAGE_PATTERN, "")
    .trim();
  const hasContent = displayMessage.length > 0;

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dislikeModalOpen, setDislikeModalOpen] = useState(false);
  const [dislikeComment, setDislikeComment] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(displayMessage);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    try {
      if (!liked) {
        void submitMessageFeedback(
          "good",
          session?.session_id || "",
          message.id,
        );
        toast.success("Thanks for your feedback!");
      }
    } catch (error) {
      console.error("Message feedback failed, Error:", error);
    } finally {
      setLiked(!liked);
      if (disliked) setDisliked(false);
    }
  };

  const handleDislikeSubmit = async () => {
    try {
      await submitMessageFeedback(
        "bad",
        session?.session_id || "",
        message.id,
        dislikeComment,
      );
    } catch (error) {
      console.error("Message feedback failed, Error:", error);
    } finally {
      toast("Thanks for your feedback. We'll improve.");
      setDisliked(true);
      if (liked) setLiked(false);
      setDislikeModalOpen(false);
      setDislikeComment("");
    }
  };

  const showActionButtons = !isGreeting && hasContent;
  const showAllButtons = showActionButtons && !isUser && !message.streaming;
  const showCopyOnly = showActionButtons && isUser;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[82%] space-y-2", isUser && "items-end")}>
        {message.image_url ? (
          <div className={cn("flex flex-wrap gap-2", isUser && "justify-end")}>
            {(Array.isArray(message.image_url)
              ? message.image_url
              : [message.image_url]
            ).map((url, index) => (
              <img
                key={`${url}-${index}`}
                src={url}
                alt=""
                className="h-24 w-24 rounded-md border bg-muted object-cover"
              />
            ))}
          </div>
        ) : null}

        {!isUser &&
        !message.streaming &&
        !message.json_content?.cart_details ? (
          <MessageAttachments json={message.json_content} />
        ) : null}

        {hasContent ? (
          <div
            id="markdown-message-bubble"
            className={cn(
              "rounded-md border px-3 py-2 text-sm leading-relaxed shadow-xs",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-foreground",
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayMessage}
            </ReactMarkdown>
          </div>
        ) : null}

        {!isUser && !message.streaming && message.json_content?.cart_details ? (
          <MessageAttachments json={message.json_content} />
        ) : null}

        <div
          className={cn(
            "flex items-center gap-1 text-xs text-muted-foreground",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          {(showAllButtons || showCopyOnly) && (
            <span className="mr-1">{formatTimestamp(message.created_at)}</span>
          )}

          {showAllButtons ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={cn("size-7", liked && "text-primary")}
                onClick={handleLike}
                title="Like this message"
              >
                <ThumbsUp className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={cn("size-7", disliked && "text-destructive")}
                onClick={() =>
                  disliked ? setDisliked(false) : setDislikeModalOpen(true)
                }
                title="Dislike this message"
              >
                <ThumbsDown className="size-3.5" />
              </Button>
            </>
          ) : null}

          {(showAllButtons || showCopyOnly) && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn("size-7", copied && "text-primary")}
              onClick={handleCopy}
              title="Copy message"
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
          )}
        </div>

        {dislikeModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
            <div className="w-full max-w-sm rounded-md border bg-background p-4 shadow-lg">
              <h3 className="text-sm font-semibold">Tell us how to improve</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your message is optional, but it helps improve future answers.
              </p>
              <textarea
                className="mt-3 min-h-24 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={dislikeComment}
                onChange={(event) => setDislikeComment(event.target.value)}
                placeholder="Share your suggestion"
              />
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDislikeModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleDislikeSubmit()}
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
