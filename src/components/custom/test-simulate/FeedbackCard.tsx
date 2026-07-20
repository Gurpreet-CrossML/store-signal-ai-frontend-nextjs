import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { uid, useTestChatbotContext } from "@/clients/test-simulate";
import { cn } from "@/lib/utils";
import {
  SubmitThreadFeedback,
  RatingChoice,
} from "@/redux/api-slice/thread-slice";
import { useAppDispatch } from "@/redux/hooks";

type FeedbackCardProps = {
  ratingChoices?: RatingChoice[];
  onDone: () => Promise<void> | void;
};

const FALLBACK_RATING_OPTIONS: RatingChoice[] = [
  { value: "very_bad", label: "Very Bad", emoji: "😞" },
  { value: "bad", label: "Bad", emoji: "😕" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "good", label: "Good", emoji: "😊" },
  { value: "excellent", label: "Excellent", emoji: "😄" },
];

const MAX_FEEDBACK_LENGTH = 500;

export function FeedbackCard({ ratingChoices, onDone }: FeedbackCardProps) {
  const dispatch = useAppDispatch();
  const { session, addMessage } = useTestChatbotContext();
  const [selectedOption, setSelectedOption] = useState<RatingChoice | null>(
    null,
  );
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const options =
    Array.isArray(ratingChoices) && ratingChoices.length > 0
      ? ratingChoices
      : FALLBACK_RATING_OPTIONS;

  const handleSubmit = async () => {
    if (!session?.session_id || submitted || !selectedOption) return;

    try {
      setLoading(true);
      addMessage({
        id: uid(),
        role: "user",
        message: `${selectedOption.emoji} ${selectedOption.label}`,
        created_at: new Date(),
      });

      const result = await dispatch(
        SubmitThreadFeedback({
          rating: selectedOption.value,
          thread_id: session.session_id,
          feedback_message: feedbackMessage.trim() || undefined,
        }),
      ).unwrap();

      setSubmitted(true);
      toast.success(result?.message ?? "Thank you for your feedback!");
      addMessage({
        id: result?.message_id ?? uid(),
        role: "assistant",
        message: "",
        created_at: new Date(),
        json_content: {
          is_feedback_flow: true,
          feedback_step: "done",
        },
      });
      await onDone();
    } catch (error) {
      console.error("Failed to save feedback", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-48 w-full max-w-md flex-col items-center justify-center gap-4 rounded-md border bg-background p-4 shadow-xs">
        <Spinner className="size-8 text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">
          Saving your feedback
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-md border bg-background p-4 shadow-xs">
      <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>Chat has ended</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <p className="text-center text-sm font-semibold">
        How was your experience with us?
      </p>

      <div className="mt-3 flex justify-center gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "flex size-10 items-center justify-center rounded-md border text-xl transition hover:bg-muted",
              selectedOption?.value === option.value &&
                "border-primary bg-primary/10",
            )}
            onClick={() => !submitted && !loading && setSelectedOption(option)}
            disabled={submitted || loading}
            title={option.label}
          >
            {option.emoji}
          </button>
        ))}
      </div>

      {!submitted ? (
        <>
          <textarea
            className="mt-3 min-h-20 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={feedbackMessage}
            onChange={(event) => setFeedbackMessage(event.target.value)}
            placeholder="Tell us more... (optional)"
            maxLength={MAX_FEEDBACK_LENGTH}
            rows={3}
            disabled={loading}
          />
          <div className="mt-1 text-right text-xs text-muted-foreground">
            {feedbackMessage.length} / {MAX_FEEDBACK_LENGTH}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onDone}
              disabled={loading}
            >
              Restart Chat
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={loading || !selectedOption}
            >
              Submit
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
