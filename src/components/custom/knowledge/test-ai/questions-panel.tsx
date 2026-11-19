"use client";

import { TestQuestionsTab } from "@/components/custom/knowledge/test-ai/test-questions-tab";
import { UnansweredQuestionsTab } from "@/components/custom/knowledge/test-ai/unanswered-questions-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KNOWLEDGE_TEST_AI_TABS, type KnowledgeTestAiTab } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/hooks";

/** How many questions a tab holds; left out until its list has loaded. */
function TabCount({ count }: { count: number | undefined }) {
  if (count === undefined) return null;
  return (
    <span className="rounded-full bg-muted-foreground/15 px-1.5 py-px text-xs leading-4 font-medium tabular-nums">
      {count}
    </span>
  );
}

/**
 * The questions to ask the AI, in two tabs: "Test Questions" and "Unanswered
 * Questions", each with how many it holds. Both lists are kept mounted so both
 * counts show at once; the one not selected is hidden. It sits in the right
 * column on a wide screen and in the right drawer on a phone or tablet.
 */
export function QuestionsPanel({
  tab,
  onTabChange,
  onAsk,
  isAsking,
  className,
}: {
  tab: KnowledgeTestAiTab;
  onTabChange: (tab: KnowledgeTestAiTab) => void;
  /** Asks the AI a question in the chat. */
  onAsk: (question: string) => void;
  /** True while the AI is answering a question. */
  isAsking: boolean;
  className?: string;
}) {
  const { FetchTestQuestionsData: testQuestions } = useAppSelector(
    (state) => state.GetKnowledgeTestAiReducer.FetchTestQuestionsState,
  );
  const { FetchUnansweredQuestionsData: unanswered } = useAppSelector(
    (state) => state.GetKnowledgeTestAiReducer.FetchUnansweredQuestionsState,
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => onTabChange(value as KnowledgeTestAiTab)}
      className={cn("min-w-0 gap-0 overflow-hidden bg-card", className)}
    >
      <div className="border-b p-3">
        <TabsList className="w-full">
          <TabsTrigger
            value={KNOWLEDGE_TEST_AI_TABS.questions}
            className="min-w-0 gap-1.5"
          >
            <span className="truncate">Test Questions</span>
            <TabCount count={testQuestions?.count} />
          </TabsTrigger>
          <TabsTrigger
            value={KNOWLEDGE_TEST_AI_TABS.unanswered}
            className="min-w-0 gap-1.5"
          >
            <span className="truncate">Unanswered Questions</span>
            <TabCount count={unanswered?.count} />
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        forceMount
        value={KNOWLEDGE_TEST_AI_TABS.questions}
        className="min-h-0 flex-1 overflow-y-auto p-3 data-[state=inactive]:hidden"
      >
        <TestQuestionsTab onAsk={onAsk} isAsking={isAsking} />
      </TabsContent>
      <TabsContent
        forceMount
        value={KNOWLEDGE_TEST_AI_TABS.unanswered}
        className="min-h-0 flex-1 overflow-y-auto p-3 data-[state=inactive]:hidden"
      >
        <UnansweredQuestionsTab onAsk={onAsk} isAsking={isAsking} />
      </TabsContent>
    </Tabs>
  );
}
