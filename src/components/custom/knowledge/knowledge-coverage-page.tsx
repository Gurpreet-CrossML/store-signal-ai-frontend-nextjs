"use client";

import { useEffect } from "react";
import Link from "next/link";
import { IconArrowLeft, IconMessageCheck } from "@tabler/icons-react";

import { CategoryCoverageChip } from "@/components/custom/knowledge/category-coverage-chip";
import { CoverageRangeFilter } from "@/components/custom/knowledge/coverage-range-filter";
import { CoverageHeadline } from "@/components/custom/knowledge/knowledge-coverage-card";
import { QuestionsDataTablePagination } from "@/components/custom/knowledge/test-ai/questions-data-table-pagination";
import { QuestionsSearchInput } from "@/components/custom/knowledge/test-ai/questions-search-input";
import { useUnansweredQuestionList } from "@/components/custom/knowledge/test-ai/use-unanswered-question-list";
import { useAnswerCoverage } from "@/components/custom/knowledge/use-answer-coverage";
import { LoadingState } from "@/components/custom/loading-state";
import { PageHeading } from "@/components/custom/page-heading";
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
import { KNOWLEDGE_UNCATEGORIZED_NAME } from "@/lib/config";
import { capitalizeText, formatDateTime, getThreadHref } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { FetchKnowledgeCategories } from "@/redux/api-slice/knowledge-rag-slice";
import {
  ResetUnansweredQuestions,
  type AnswerCoverage,
  type CategoryCoverage,
} from "@/redux/api-slice/knowledge-test-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/** A block of the page: a heading, what it shows, and its content. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

/** One row of the category list: its name, its coverage and how many questions it is from. */
function CategoryRow({
  name,
  entry,
  hasKnowledge,
}: {
  name: string;
  entry: CategoryCoverage | undefined;
  hasKnowledge?: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
      <span className="w-52 shrink-0 text-sm font-medium">{name}</span>
      <span className="min-w-56 flex-1">
        <CategoryCoverageChip entry={entry} hasKnowledge={hasKnowledge} />
      </span>
      <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">
        {entry
          ? `${entry.total} ${entry.total === 1 ? "question" : "questions"}`
          : "No questions"}
      </span>
    </li>
  );
}

/**
 * Every knowledge category with its coverage, the weakest first so the topics
 * that need knowledge most are at the top, then the ones with too few
 * questions to say. Questions that belong to no category come last.
 */
function CategoryCoverageList({ data }: { data: AnswerCoverage }) {
  const { FetchKnowledgeCategoriesData: categoriesData } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.FetchKnowledgeCategoriesState,
  );
  const rows = (categoriesData?.categories ?? [])
    .map((category) => ({
      key: category.slug,
      name: category.name,
      hasKnowledge: category.count > 0,
      entry: data.categories.find((entry) => entry.slug === category.slug),
    }))
    // A share sorts before "not enough data"; shares go lowest first.
    .sort(
      (a, b) =>
        (a.entry?.coverage ?? Infinity) - (b.entry?.coverage ?? Infinity),
    );

  return (
    <ul className="flex flex-col divide-y">
      {rows.map((row) => (
        <CategoryRow
          key={row.key}
          name={row.name}
          entry={row.entry}
          hasKnowledge={row.hasKnowledge}
        />
      ))}
      {data.uncategorized && (
        <CategoryRow
          name={KNOWLEDGE_UNCATEGORIZED_NAME}
          entry={data.uncategorized}
        />
      )}
    </ul>
  );
}

/** Every question the AI couldn't answer in the period, searchable and paginated. */
function NotAnsweredQuestions({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
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
  } = useUnansweredQuestionList({ dateFrom, dateTo, trackedOnly: true });

  return (
    <Section
      title={`Not Answered Questions${data ? ` (${data.count})` : ""}`}
      description="Everything customers asked in this period that your knowledge couldn't answer."
    >
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
                : "Nothing was left unanswered"}
            </EmptyTitle>
            <EmptyDescription>
              {hasSearch
                ? "Try a different search."
                : "Your knowledge answered every question in this period."}
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
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead>Asked</TableHead>
                <TableHead>Chat</TableHead>
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
                    {capitalizeText(item.workflow ?? "")}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
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
    </Section>
  );
}

/**
 * The details behind the KB Coverage card: the overall coverage for a period
 * the user picks, how each knowledge category does (weakest first), and every
 * question the AI couldn't answer, searchable and paginated, each with a way
 * to add the missing answer.
 */
export function KnowledgeCoveragePage() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { data, isLoading, isError, filters, setFilters, range } =
    useAnswerCoverage();

  useEffect(() => {
    if (storeCode) dispatch(FetchKnowledgeCategories({ storeCode }));
  }, [dispatch, storeCode]);

  // The unanswered list is shared with the Test AI screen: leave it empty, so
  // that screen never shows this one's questions while it loads its own.
  useEffect(() => {
    return () => {
      dispatch(ResetUnansweredQuestions());
    };
  }, [dispatch]);

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex flex-col gap-2 sm:gap-3">
        <Link
          href="/knowledge"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="size-4" />
          Knowledge
        </Link>
        <PageHeading
          title="KB Coverage"
          description="How well your knowledge answers customers, and what to add next."
          action={
            <CoverageRangeFilter filters={filters} onChange={setFilters} />
          }
        />
      </div>

      {data === null ? (
        isLoading ? (
          <LoadingState label="Loading coverage…" />
        ) : isError ? (
          <p className="text-sm text-destructive">
            Couldn&apos;t load the coverage. Please try again later.
          </p>
        ) : null
      ) : (
        <div
          className={cn(
            "flex flex-col gap-5",
            isLoading && "opacity-60 transition-opacity",
          )}
        >
          <Section
            title="Overall Coverage"
            description="The share of customer questions your knowledge answered."
          >
            {data.total === 0 ? (
              <p className="text-sm text-muted-foreground">
                No customer questions were checked in this period yet.
              </p>
            ) : (
              <CoverageHeadline data={data} />
            )}
          </Section>

          <Section
            title="Coverage By Category"
            description="Weakest first. A category shows a percentage once customers asked it enough questions."
          >
            <CategoryCoverageList data={data} />
          </Section>
        </div>
      )}

      <NotAnsweredQuestions dateFrom={range.from} dateTo={range.to} />
    </div>
  );
}
