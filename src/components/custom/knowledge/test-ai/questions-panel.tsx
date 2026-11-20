"use client";

import { TestQuestionsTab } from "@/components/custom/knowledge/test-ai/test-questions-tab";
import { UnansweredQuestionsTab } from "@/components/custom/knowledge/test-ai/unanswered-questions-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KNOWLEDGE_TEST_AI_TABS, type KnowledgeTestAiTab } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/hooks";

/** How many questions a tab holds; left out until its list has loaded. */
function TabCount({
  count,
  active,
}: {
  count: number | undefined;
  active: boolean;
}) {
  if (count === undefined) return null;
  return (
    <span
      className={cn(
        "ml-auto text-xs tabular-nums",
        active ? "font-semibold text-primary" : "text-muted-foreground",
      )}
    >
      {count}
    </span>
  );
}

/**
 * A tab drawn as a button, so it reads as clickable: bordered, with a hover
 * state. The selected one is drawn like a selected row of the help desk's
 * inbox list: tinted, with a dot before its name and its count at the end in
 * the app colour.
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
      className="h-10 min-w-0 flex-none cursor-pointer justify-start gap-2.5 border-border bg-background px-3 text-foreground shadow-xs transition-colors hover:border-foreground/25 hover:bg-muted @lg/tabs:flex-1 data-active:border-primary/40 data-active:bg-primary/10 data-active:font-medium data-active:text-primary data-active:shadow-none data-active:hover:bg-primary/10 group-data-[variant=default]/tabs-list:data-active:shadow-none dark:border-input dark:bg-transparent dark:data-active:border-primary/40 dark:data-active:bg-primary/10 dark:data-active:text-primary"
    >
      {active && (
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-primary" />
      )}
      <span className="truncate">{label}</span>
      <TabCount count={count} active={active} />
    </TabsTrigger>
  );
}

/**
 * The questions to ask the AI, in two tabs: "Test Questions" and "Unanswered
 * Questions", each with how many it holds. The tabs sit side by side when
 * the panel is wide enough to show both names in full, and stacked when it is
 * not. Both lists are kept mounted so both counts show at once; the one not
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
        <TabsList className="h-auto w-full group-data-horizontal/tabs:h-auto flex-col items-stretch gap-1 bg-transparent p-0 @lg/tabs:flex-row">
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
