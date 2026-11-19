import { IconSend } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

/** The Ask button beside a question: asks the AI that question in the chat. */
export function AskQuestionButton({
  question,
  onAsk,
  disabled,
}: {
  question: string;
  onAsk: (question: string) => void;
  /** True while the AI is answering another question. */
  disabled: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="shrink-0"
      disabled={disabled}
      onClick={() => onAsk(question)}
      aria-label={`Ask: ${question}`}
    >
      <IconSend className="size-3.5" />
      Ask
    </Button>
  );
}
