"use client";

import { IconFilter } from "@tabler/icons-react";

import { TestQuestionsTab } from "@/components/custom/knowledge/test-ai/test-questions-tab";
import { UnansweredQuestionsTab } from "@/components/custom/knowledge/test-ai/unanswered-questions-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KNOWLEDGE_TEST_AI_TABS, type KnowledgeTestAiTab } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/hooks";

/**
 * A tab drawn as a button, so it reads as clickable: bordered, with a hover
 * state, and as wide as its name. The name is followed by how many questions
 * the tab holds, in brackets (left out until its list has loaded). The
 * selected one is tinted and outlined in the app colour, with a filter icon
 * before its name.
 */
function PanelTab({
  value,
  label,
  count,
  active,
}: {
  value: KnowledgeTestAiTab;
  label: string;
  count: number | undefined;
  active: boolean;
}) {
  return (
    <TabsTrigger
      value={value}
      className="h-10 min-w-0 flex-none cursor-pointer justify-center gap-2 border-border bg-background px-4 text-foreground shadow-xs transition-colors hover:border-foreground/25 hover:bg-muted data-active:border-primary/40 data-active:bg-primary/10 data-active:font-medium data-active:text-primary data-active:shadow-none data-active:hover:bg-primary/10 group-data-[variant=default]/tabs-list:data-active:shadow-none dark:border-input dark:bg-transparent dark:data-active:border-primary/40 dark:data-active:bg-primary/10 dark:data-active:text-primary"
    >
      {active && <IconFilter aria-hidden className="size-4 shrink-0" />}
      <span className="truncate">
        {label}
        {count !== undefined && ` (${count})`}
      </span>
    </TabsTrigger>
  );
}

/**
 * The questions to ask the AI, in two tabs: "Test Questions" and "Unanswered
 * Questions", each with how many it holds. The tabs sit side by side at the
 * start of the panel, and wrap onto a second line when it is too narrow for
 * both. Both lists are kept mounted so both counts show at once; the one not
 * selected is hidden. It sits in the right column on a wide screen and in the
 * right drawer on a phone or tablet.
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
  const { FetchUnansweredWorkflowsData: workflows } = useAppSelector(
    (state) => state.GetKnowledgeTestAiReducer.FetchUnansweredWorkflowsState,
  );
  // Every unanswered question, across all workflows; left out until loaded.
  const unansweredCount = workflows?.reduce(
    (total, workflow) => total + workflow.count,
    0,
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => onTabChange(value as KnowledgeTestAiTab)}
      className={cn(
        "@container/tabs min-w-0 gap-0 overflow-hidden bg-card",
        className,
      )}
    >
      <div className="border-b p-3">
        <TabsList className="h-auto w-full flex-row flex-wrap justify-start gap-2 bg-transparent p-0 group-data-horizontal/tabs:h-auto">
          <PanelTab
            value={KNOWLEDGE_TEST_AI_TABS.questions}
            label="Test Questions"
            count={testQuestions?.count}
            active={tab === KNOWLEDGE_TEST_AI_TABS.questions}
          />
          <PanelTab
            value={KNOWLEDGE_TEST_AI_TABS.unanswered}
            label="Unanswered Questions"
            count={unansweredCount}
            active={tab === KNOWLEDGE_TEST_AI_TABS.unanswered}
          />
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
