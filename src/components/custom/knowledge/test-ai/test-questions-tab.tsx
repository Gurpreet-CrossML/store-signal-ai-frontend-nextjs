"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconAlertCircle,
  IconCircleCheck,
  IconFilterOff,
  IconPlus,
  IconTestPipe,
} from "@tabler/icons-react";

import { AskQuestionButton } from "@/components/custom/knowledge/test-ai/ask-question-button";
import { LoadingState } from "@/components/custom/loading-state";
import { QuestionsDataTablePagination } from "@/components/custom/knowledge/test-ai/questions-data-table-pagination";
import { QuestionsSearchInput } from "@/components/custom/knowledge/test-ai/questions-search-input";
import { TestCoverageCard } from "@/components/custom/knowledge/test-ai/test-coverage-card";
import { getKnowledgeCategoryIcon } from "@/components/custom/knowledge/knowledge-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import {
  ACTIVE_FILTER_STYLE,
  KNOWLEDGE_TEST_QUESTIONS_PAGE_SIZE,
  KNOWLEDGE_TEST_STATUS_NOT_ASKED,
} from "@/lib/config";
import { cn } from "@/lib/utils";
import { FetchKnowledgeCategories } from "@/redux/api-slice/knowledge-rag-slice";
import {
  FetchTestQuestions,
  type TestQuestion,
} from "@/redux/api-slice/knowledge-test-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

// What a filter says when it is not narrowing the list (a select cannot hold "").
const ALL = "all";

const STATUS_OPTIONS = [
  { value: ALL, label: "All statuses" },
  { value: "answered", label: "Answered" },
  { value: "unanswered", label: "Unanswered" },
  { value: KNOWLEDGE_TEST_STATUS_NOT_ASKED, label: "Not asked" },
];

/** The question's category with its icon, or a dash when it has none. */
function CategoryCell({ category }: { category: TestQuestion["category"] }) {
  if (!category) return <span className="text-muted-foreground">—</span>;
  const { icon: CategoryIcon, className } = getKnowledgeCategoryIcon(
    category.slug,
  );
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md",
          className,
        )}
      >
        <CategoryIcon className="size-3.5" />
      </span>
      <span>{category.name}</span>
    </span>
  );
}

/** Whether the AI answered the question when it was last asked; "Not asked" before that. */
function StatusBadge({ status }: { status: TestQuestion["status"] }) {
  if (status === "answered") {
    return (
      <Badge variant="outline" className={BADGE_TONE_STYLES.success}>
        <IconCircleCheck />
        Answered
      </Badge>
    );
  }
  if (status === "unanswered") {
    return (
      <Badge variant="outline" className={BADGE_TONE_STYLES.danger}>
        <IconAlertCircle />
        Unanswered
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={BADGE_TONE_STYLES.neutral}>
      Not asked
    </Badge>
  );
}

/** The latest answer's confidence as a percentage and a bar, or a dash when it has none. */
function ConfidenceCell({
  confidence,
}: {
  confidence: TestQuestion["confidence"];
}) {
  if (confidence === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const percent = Math.round(confidence * 100);
  return (
    <span className="flex items-center gap-2">
      <span className="w-9 text-sm tabular-nums">{percent}%</span>
      <Progress value={percent} className="w-16" aria-label="Confidence" />
    </span>
  );
}

/**
 * The "Test Questions" tab: the sample customer questions for the selected
 * store, each with its category, whether the AI answered it and how confident
 * its latest answer was. Searchable, filterable by category and status, and
 * paginated. Ask puts a question to the AI in the chat, and the row then shows
 * how that try went.
 */
export function TestQuestionsTab({
  onAsk,
  isAsking,
}: {
  /** Asks the AI this question in the chat. */
  onAsk: (question: string) => void;
  /** True while the AI is answering a question. */
  isAsking: boolean;
}) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchTestQuestionsData: questions, FetchTestQuestionsIsLoading } =
    useAppSelector(
      (state) => state.GetKnowledgeTestAiReducer.FetchTestQuestionsState,
    );
  const { FetchKnowledgeCategoriesData: categoriesData } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.FetchKnowledgeCategoriesState,
  );
  const categories = categoriesData?.categories ?? [];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(KNOWLEDGE_TEST_QUESTIONS_PAGE_SIZE);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    if (storeCode) dispatch(FetchKnowledgeCategories({ storeCode }));
  }, [dispatch, storeCode]);

  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      FetchTestQuestions({
        storeCode,
        page,
        pageSize,
        search: debouncedSearch,
        status: status === ALL ? "" : status,
        category: category === ALL ? "" : category,
      }),
    );
  }, [dispatch, storeCode, page, pageSize, debouncedSearch, status, category]);

  // Before the first answer there is nothing to say "no questions" about.
  const isLoading = FetchTestQuestionsIsLoading && questions === null;
  // Also true while the debounce waits to send what was just typed, so the
  // list never looks settled while a new search is on its way.
  const isRefreshing =
    FetchTestQuestionsIsLoading || search !== debouncedSearch;
  const items = questions?.results ?? [];
  const isFiltered =
    debouncedSearch.trim() !== "" || category !== ALL || status !== ALL;
  // Counts what was just typed too, so Clear shows as soon as the user types.
  const hasFilters = search.trim() !== "" || category !== ALL || status !== ALL;

  const clearFilters = () => {
    setSearch("");
    setCategory(ALL);
    setStatus(ALL);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-3">
      <TestCoverageCard />
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-48 flex-1">
          <QuestionsSearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search questions"
            isRefreshing={isRefreshing}
          />
        </div>
        <Select
          value={category}
          onValueChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
        >
          <SelectTrigger
            aria-label="Category"
            className={cn("min-w-36", category !== ALL && ACTIVE_FILTER_STYLE)}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.map((item) => (
              <SelectItem key={item.id} value={item.slug}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger
            aria-label="Status"
            className={cn("min-w-32", status !== ALL && ACTIVE_FILTER_STYLE)}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <IconFilterOff className="size-4" />
            Clear filters
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/knowledge/new">
            <IconPlus className="size-4" />
            Add Knowledge
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <LoadingState label="Loading questions…" />
      ) : items.length === 0 ? (
        <Empty className="rounded-lg border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconTestPipe />
            </EmptyMedia>
            <EmptyTitle>No questions found</EmptyTitle>
            <EmptyDescription>
              {isFiltered
                ? "No question matches your search or filters."
                : "There are no test questions yet."}
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
          {/* Narrow panel (phone or tablet drawer): a card per question, since six columns do not fit. */}
          <ul className="divide-y @3xl/tabs:hidden">
            {items.map((item, index) => (
              <li key={item.id} className="flex flex-col gap-2.5 p-3">
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
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-8 text-sm">
                  <CategoryCell category={item.category} />
                  <StatusBadge status={item.status} />
                  <ConfidenceCell confidence={item.confidence} />
                </div>
              </li>
            ))}
          </ul>
          <Table containerClassName="hidden @3xl/tabs:block">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead className="w-24 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {(page - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {item.question}
                  </TableCell>
                  <TableCell>
                    <CategoryCell category={item.category} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    <ConfidenceCell confidence={item.confidence} />
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
        totalCount={questions?.count ?? 0}
        pageSize={pageSize}
        page={page}
        onPaginationChange={(next) => {
          setPage(next.page);
          setPageSize(next.pageSize);
        }}
      />
    </div>
  );
}
