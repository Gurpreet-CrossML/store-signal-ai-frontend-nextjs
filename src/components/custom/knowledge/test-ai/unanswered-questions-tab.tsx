"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconChevronRight,
  IconMessageCheck,
} from "@tabler/icons-react";

import {
  DashboardRangeFilter,
  DEFAULT_DASHBOARD_FILTERS,
  resolveDashboardRange,
  type DashboardFilterState,
} from "@/components/custom/dashboard-filters";
import { LoadingState } from "@/components/custom/loading-state";
import { useUnansweredQuestionList } from "@/components/custom/knowledge/test-ai/use-unanswered-question-list";
import { QuestionsDataTablePagination } from "@/components/custom/knowledge/test-ai/questions-data-table-pagination";
import { QuestionsSearchInput } from "@/components/custom/knowledge/test-ai/questions-search-input";
import { AskQuestionButton } from "@/components/custom/knowledge/test-ai/ask-question-button";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsBelowLg } from "@/hooks/use-narrow-viewport";
import { formatDateTime, getThreadHref } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import {
  FetchUnansweredWorkflows,
  ResetUnansweredQuestions,
  type UnansweredWorkflow,
} from "@/redux/api-slice/knowledge-test-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

type AskProps = {
  /** Asks the AI this question in the chat. */
  onAsk: (question: string) => void;
  /** True while the AI is answering a question. */
  isAsking: boolean;
};

/** The days the unanswered questions are limited to, as yyyy-MM-dd. */
type DateRangeValue = { from: string; to: string };

/** The dashboard's period choices, starting on the last 30 days. */
const DEFAULT_FILTERS: DashboardFilterState = {
  ...DEFAULT_DASHBOARD_FILTERS,
  range: "30d",
};

/** The workflows that left questions unanswered; picking one lists its questions. */
function WorkflowRows({
  onSelect,
}: {
  onSelect: (workflow: UnansweredWorkflow) => void;
}) {
  const { FetchUnansweredWorkflowsData: workflows } = useAppSelector(
    (state) => state.GetKnowledgeTestAiReducer.FetchUnansweredWorkflowsState,
  );

  if (workflows === null) {
    return <LoadingState label="Loading workflows…" />;
  }

  if (workflows.length === 0) {
    return (
      <Empty className="rounded-lg border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconMessageCheck />
          </EmptyMedia>
          <EmptyTitle>No unanswered questions</EmptyTitle>
          <EmptyDescription>
            Questions your AI couldn&apos;t answer will show up here, grouped by
            workflow.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {workflows.map((workflow) => (
        <li key={workflow.code}>
          <button
            type="button"
            onClick={() => onSelect(workflow)}
            className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
          >
            <span className="min-w-0 truncate font-medium">
              {workflow.name}
            </span>
            <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
              <span className="rounded-full bg-muted-foreground/15 px-2 py-px text-xs font-medium tabular-nums">
                {workflow.count}
              </span>
              <IconChevronRight className="size-4" />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** The workflows, under a heading row that ends with the date range filter. */
function WorkflowList({
  onSelect,
  rangePicker,
}: {
  onSelect: (workflow: UnansweredWorkflow) => void;
  rangePicker: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Workflows</h4>
        {rangePicker}
      </div>
      <WorkflowRows onSelect={onSelect} />
    </div>
  );
}

/**
 * The unanswered questions of one workflow: searchable and paginated, each
 * with an Ask button and a link to its conversation.
 */
function WorkflowQuestions({
  workflow,
  range,
  rangePicker,
  onBack,
  onAsk,
  isAsking,
}: AskProps & {
  workflow: UnansweredWorkflow;
  /** Only the questions asked in these days are listed. */
  range: DateRangeValue;
  /** The date range filter, shown at the end of the heading row. */
  rangePicker: React.ReactNode;
  /** Goes back to the list of workflows. */
  onBack: () => void;
}) {
  const {
    data,
    questions,
    page,
    pageSize,
    search,
    showLoading,
    isRefreshing,
    hasSearch,
    changeSearch,
    changePagination,
  } = useUnansweredQuestionList({
    workflow: workflow.code,
    dateFrom: range.from,
    dateTo: range.to,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            aria-label="Back to workflows"
          >
            <IconArrowLeft className="size-4" />
          </Button>
          <h4 className="min-w-0 truncate text-sm font-semibold">
            {workflow.name}
          </h4>
        </div>
        {rangePicker}
      </div>

      <QuestionsSearchInput
        value={search}
        onChange={changeSearch}
        placeholder="Search questions"
        isRefreshing={isRefreshing}
      />

      {showLoading ? (
        <LoadingState label="Loading questions…" />
      ) : questions.length === 0 ? (
        <Empty className="rounded-lg border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconMessageCheck />
            </EmptyMedia>
            <EmptyTitle>
              {hasSearch
                ? "No questions match your search"
                : "No unanswered questions"}
            </EmptyTitle>
            <EmptyDescription>
              {hasSearch
                ? "Try a different search."
                : "This workflow has no unanswered questions in these dates."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div
          aria-busy={isRefreshing}
          className={cn(
            "rounded-lg border transition-opacity",
            isRefreshing && "opacity-60",
          )}
        >
          {/* Narrow panel (phone or tablet drawer): a card per question. */}
          <ul className="divide-y @3xl/tabs:hidden">
            {questions.map((item, index) => (
              <li key={item.id} className="flex flex-col gap-2 p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 w-6 shrink-0 text-sm text-muted-foreground tabular-nums">
                    {(page - 1) * pageSize + index + 1}.
                  </span>
                  <p className="min-w-0 flex-1 text-sm leading-snug font-medium break-words">
                    {item.question}
                  </p>
                  <AskQuestionButton
                    question={item.question}
                    onAsk={onAsk}
                    disabled={isAsking}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-8 text-xs">
                  <span className="text-muted-foreground">
                    {formatDateTime(item.askedAt)}
                  </span>
                  <Link
                    href={getThreadHref(item.threadId, item.threadIsActive)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    View Chat
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <Table containerClassName="hidden @3xl/tabs:block">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Asked</TableHead>
                <TableHead>Chat</TableHead>
                <TableHead className="w-24 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {(page - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="font-medium whitespace-normal">
                    {item.question}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(item.askedAt)}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Link
                      href={getThreadHref(item.threadId, item.threadIsActive)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      View Chat
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <AskQuestionButton
                      question={item.question}
                      onAsk={onAsk}
                      disabled={isAsking}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <QuestionsDataTablePagination
        totalCount={data?.count ?? 0}
        pageSize={pageSize}
        page={page}
        onPaginationChange={changePagination}
      />
    </div>
  );
}

/**
 * The "Unanswered Questions" tab: the workflows that left customer questions
 * unanswered, each with how many. Picking one shows that workflow's questions,
 * searchable and paginated, with a way back to the workflows. A period
 * (today, last 7 or 30 days, or a custom range; the last 30 days to start
 * with) limits both the counts and the questions.
 */
export function UnansweredQuestionsTab({ onAsk, isAsking }: AskProps) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  // The picked workflow belongs to the store it was picked in, so another
  // store starts back at its list of workflows.
  const [pick, setPick] = useState<{
    storeCode: string | null;
    workflow: UnansweredWorkflow | null;
  }>({ storeCode: null, workflow: null });
  const selected = pick.storeCode === storeCode ? pick.workflow : null;

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  // A preset (today, 7 or 30 days) counts back from today; custom is as picked.
  const range = resolveDashboardRange(filters);
  // The calendar is narrower on a phone or tablet, where it sits in a drawer.
  const isBelowLg = useIsBelowLg();

  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      FetchUnansweredWorkflows({
        storeCode,
        dateFrom: range.from,
        dateTo: range.to,
      }),
    );
  }, [dispatch, storeCode, range.from, range.to]);

  // Another workflow's questions (or none) must not show while a list loads.
  const select = (workflow: UnansweredWorkflow | null) => {
    dispatch(ResetUnansweredQuestions());
    setPick({ storeCode, workflow });
  };

  const rangePicker = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <DashboardRangeFilter
        filters={filters}
        onChange={setFilters}
        numberOfMonths={isBelowLg ? 1 : 2}
      />
    </div>
  );

  return selected ? (
    <WorkflowQuestions
      // A new range starts the list again from its first page.
      key={`${selected.code}:${range.from}:${range.to}`}
      workflow={selected}
      range={range}
      rangePicker={rangePicker}
      onBack={() => select(null)}
      onAsk={onAsk}
      isAsking={isAsking}
    />
  ) : (
    <WorkflowList onSelect={select} rangePicker={rangePicker} />
  );
}
