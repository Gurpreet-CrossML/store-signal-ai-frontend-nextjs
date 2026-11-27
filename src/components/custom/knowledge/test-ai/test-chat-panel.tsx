"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCircleCheck,
  IconCoin,
  IconGauge,
  IconRefresh,
  IconSparkles,
  IconThumbDown,
  IconThumbUp,
} from "@tabler/icons-react";

import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { ProductCarousel } from "@/components/custom/product-carousel";
import { TestChatInput } from "@/components/custom/knowledge/test-ai/test-chat-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import {
  KNOWLEDGE_TEST_ANSWER_CREDITS,
  KNOWLEDGE_TEST_CHAT_NOTICE,
  KNOWLEDGE_TEST_PRODUCT_SOURCE_LABEL,
  KNOWLEDGE_TEST_SENDERS,
} from "@/lib/config";
import { getKnowledgeItemHref } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import {
  SetTestAnswerFeedback,
  type TestFeedback,
  type TestMessage,
} from "@/redux/api-slice/knowledge-test-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/** What the user asked, on the right like a sent message, with their profile icon (their initials). */
function QuestionBubble({ children }: { children: string }) {
  const { data: session } = useSession();
  const { name, email } = session?.user ?? {};
  return (
    <div className="ml-auto flex max-w-[85%] items-start gap-2">
      <div className="rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-sm break-words text-primary-foreground">
        {children}
      </div>
      <CustomerAvatar name={name || email} size="h-7 w-7" />
    </div>
  );
}

/** The AI's side of the chat: its avatar and a bubble holding the reply. */
function AnswerBubble({
  children,
  className,
  role,
}: {
  children: React.ReactNode;
  className?: string;
  role?: "status" | "alert";
}) {
  return (
    <div className="flex max-w-[92%] items-start gap-2">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <IconSparkles className="size-4" />
      </span>
      <div
        role={role}
        className={cn(
          "min-w-0 rounded-2xl rounded-tl-sm border bg-muted/40 px-3.5 py-2.5 text-sm",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** The AI credits an answer cost, shown on answers that were found in the knowledge. */
function CreditChip() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <IconCoin className="size-3.5" />
      {KNOWLEDGE_TEST_ANSWER_CREDITS} AI{" "}
      {KNOWLEDGE_TEST_ANSWER_CREDITS === 1 ? "credit" : "credits"} used
    </span>
  );
}

/** How confident the answer is, as a percentage (the backend works it out from how closely the knowledge matched). */
function ConfidenceChip({ confidence }: { confidence: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <IconGauge className="size-3.5" />
      Confidence: {Math.round(confidence * 100)}%
    </span>
  );
}

/** Whether the AI found an answer in the knowledge. */
function AnswerStatusChip({ found }: { found: boolean }) {
  return found ? (
    <Badge variant="outline" className={BADGE_TONE_STYLES.success}>
      <IconCircleCheck />
      Status: Answered
    </Badge>
  ) : (
    <Badge variant="outline" className={BADGE_TONE_STYLES.danger}>
      <IconAlertCircle />
      Status: Not found
    </Badge>
  );
}

/**
 * The thumbs up and down under an answer to a test question. Pressing the
 * rating already given takes it back.
 */
function FeedbackButtons({ item }: { item: TestMessage }) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  if (item.testQuestionId === null || !storeCode) return null;
  const testQuestionId = item.testQuestionId;

  const rate = (rating: TestFeedback) =>
    dispatch(
      SetTestAnswerFeedback({
        storeCode,
        messageId: item.id,
        testQuestionId,
        feedback: item.feedback === rating ? null : rating,
        previous: item.feedback,
      }),
    );

  return (
    <span className="ml-auto flex items-center gap-1">
      {(
        [
          { rating: "good", label: "Good answer", Icon: IconThumbUp },
          { rating: "bad", label: "Bad answer", Icon: IconThumbDown },
        ] as const
      ).map(({ rating, label, Icon }) => (
        <Button
          key={rating}
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-pressed={item.feedback === rating}
          onClick={() => rate(rating)}
          className={cn(
            item.feedback === rating
              ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              : "text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </Button>
      ))}
    </span>
  );
}

/** One saved AI answer: its text, the products it used, whether anything was found, the credit it cost and its sources. */
function AnswerMessage({ item }: { item: TestMessage }) {
  const hasProducts = item.products.length > 0;
  // The AI answered from the knowledge or the products, or found nothing.
  const found = item.citations.length > 0 || hasProducts;
  // Several passages can come from one knowledge item: list each item once.
  const sources = [
    ...new Map(
      item.citations
        .filter((citation) => citation.id !== null)
        .map((citation) => [citation.id, citation]),
    ).values(),
  ];
  return (
    <AnswerBubble className={hasProducts ? "flex-1" : undefined}>
      <p className="leading-relaxed whitespace-pre-wrap">{item.message}</p>
      {hasProducts && <ProductCarousel products={item.products} alignStart />}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t pt-2.5">
        <AnswerStatusChip found={found} />
        {found && item.confidence !== null && (
          <ConfidenceChip confidence={item.confidence} />
        )}
        {found && <CreditChip />}
        {/* Nothing to rate when the AI found no answer. */}
        {found && <FeedbackButtons item={item} />}
      </div>
      {(sources.length > 0 || hasProducts) && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Source:{" "}
          {[
            ...sources.map((source) => (
              <Link
                key={source.id}
                href={getKnowledgeItemHref(source.id as number)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                {source.title || "Knowledge Item"}
              </Link>
            )),
            ...(hasProducts ? [KNOWLEDGE_TEST_PRODUCT_SOURCE_LABEL] : []),
          ].map((part, index) => (
            <span key={index}>
              {index > 0 && ", "}
              {part}
            </span>
          ))}
        </p>
      )}
    </AnswerBubble>
  );
}

/**
 * The Test AI chat: the questions the user tried, each followed by the answer the AI
 * gave from the store's knowledge, the credits it cost, and what it was based
 * on. The question being answered shows a loading bubble, and a failed one the
 * error with a retry.
 */
export function TestChatPanel({
  onAsk,
  isAsking,
}: {
  /** Asks the AI a question: one the user typed, or a failed one again. */
  onAsk: (question: string) => void;
  /** True while the AI is answering a question. */
  isAsking: boolean;
}) {
  const {
    TestChatItems: messages,
    TestChatPendingQuestion: pendingQuestion,
    TestChatError: error,
  } = useAppSelector((state) => state.GetKnowledgeTestAiReducer.TestChatState);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest exchange in view as it is added.
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages.length, pendingQuestion, error]);

  const isEmpty = messages.length === 0 && pendingQuestion === null;

  return (
    <section
      aria-label="AI Test Chat"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-card"
    >
      <header className="flex flex-col gap-0.5 border-b px-3 py-2.5 sm:px-4 sm:py-3">
        <h3 className="text-sm font-semibold">AI Test Chat</h3>
        <p className="text-xs text-muted-foreground">
          Answers come from your knowledge and products.{" "}
          {KNOWLEDGE_TEST_CHAT_NOTICE}
        </p>
      </header>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3 sm:gap-5 sm:p-4"
      >
        {isEmpty ? (
          <Empty className="my-auto">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconSparkles />
              </EmptyMedia>
              <EmptyTitle>Test Your AI</EmptyTitle>
              <EmptyDescription>
                Pick a question from the list, or type your own below, to see
                how your AI answers it from your knowledge and products.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {messages.map((item) =>
              item.sender === KNOWLEDGE_TEST_SENDERS.user ? (
                <QuestionBubble key={item.id}>{item.message}</QuestionBubble>
              ) : (
                <AnswerMessage key={item.id} item={item} />
              ),
            )}

            {pendingQuestion !== null && (
              <div className="flex flex-col gap-2">
                <QuestionBubble>{pendingQuestion}</QuestionBubble>
                {error ? (
                  <AnswerBubble
                    role="alert"
                    className="border-destructive/30 bg-destructive/5"
                  >
                    <span className="flex items-start gap-2 text-destructive">
                      <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
                      {error}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => onAsk(pendingQuestion)}
                    >
                      <IconRefresh className="size-4" />
                      Try again
                    </Button>
                  </AnswerBubble>
                ) : (
                  <AnswerBubble role="status" className="w-72 max-w-full">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Spinner />
                      Generating answer…
                    </span>
                  </AnswerBubble>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <TestChatInput onAsk={onAsk} isAsking={isAsking} />
    </section>
  );
}
