import Link from "next/link";
import {
  IconAlertTriangle,
  IconArticle,
  IconFileText,
  IconGlobe,
  IconInbox,
  IconMessageQuestion,
  IconPencil,
} from "@tabler/icons-react";

import { CategoryCoverageChip } from "@/components/custom/knowledge/category-coverage-chip";
import { getKnowledgeCategoryIcon } from "@/components/custom/knowledge/knowledge-meta";
import type { KnowledgeCategoryIcon } from "@/components/custom/knowledge/knowledge-meta";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  KNOWLEDGE_SOURCE_COUNT_LABELS,
  KNOWLEDGE_UNCATEGORIZED_DESCRIPTION,
  KNOWLEDGE_UNCATEGORIZED_NAME,
  KNOWLEDGE_UNCATEGORIZED_ROUTE,
} from "@/lib/config";
import { cn } from "@/lib/utils";
import type {
  KnowledgeCategories,
  KnowledgeSourceCounts,
} from "@/redux/api-slice/knowledge-rag-slice";
import { useAppSelector } from "@/redux/hooks";

/** "2 drafts", or "1 draft". */
function draftCountLabel(count: number) {
  return `${count} ${count === 1 ? "draft" : "drafts"}`;
}

/** "12 items", or "1 item". */
export function itemCountLabel(count: number) {
  return `${count} ${count === 1 ? "Item" : "Items"}`;
}

// The icon and colour of each kind of knowledge in a card's breakdown, by the
// keys of `KNOWLEDGE_SOURCE_COUNT_LABELS` (the same hues as the summary tiles).
const SOURCE_ICONS: Record<keyof KnowledgeSourceCounts, CategoryIcon> = {
  urls: { icon: IconGlobe, className: "text-blue-600 dark:text-blue-400" },
  documents: {
    icon: IconFileText,
    className: "text-violet-600 dark:text-violet-400",
  },
  articles: {
    icon: IconArticle,
    className: "text-teal-600 dark:text-teal-400",
  },
  faqs: {
    icon: IconMessageQuestion,
    className: "text-orange-600 dark:text-orange-400",
  },
};

/** One icon and count per kind of knowledge in the category, none for the kinds
 * it has none of. The words ("3 website pages") are the tooltip and what a
 * screen reader hears. */
function SourceCounts({ counts }: { counts: KnowledgeSourceCounts }) {
  const present = KNOWLEDGE_SOURCE_COUNT_LABELS.filter(
    ({ key }) => counts[key] > 0,
  );
  if (present.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {present.map(({ key, one, many }) => {
        const { icon: KindIcon, className } = SOURCE_ICONS[key];
        const label = `${counts[key]} ${counts[key] === 1 ? one : many}`;
        return (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <li className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-xs font-semibold tabular-nums">
                <KindIcon
                  aria-hidden="true"
                  className={cn("size-3.5", className)}
                />
                {counts[key]}
                <span className="sr-only">
                  {counts[key] === 1 ? one : many}
                </span>
              </li>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </ul>
  );
}

type CategoryIcon = KnowledgeCategoryIcon;

const UNCATEGORIZED_ICON: CategoryIcon = {
  icon: IconInbox,
  className: "bg-muted text-muted-foreground",
};

const GRID_CLASS =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

function CategoryCard({
  href,
  icon: { icon: CardIcon, className: iconClassName },
  name,
  description,
  count,
  draftCount,
  failedCount,
  sourceCounts,
  coverage,
  dashed = false,
}: {
  href: string;
  icon: CategoryIcon;
  name: string;
  description: string;
  count: number;
  /** Of `count`, the drafts. */
  draftCount: number;
  /** Of `count`, the ones that failed to process. */
  failedCount: number;
  /** Of `count`, how many of each kind. */
  sourceCounts: KnowledgeSourceCounts;
  /** How well the knowledge answers customers here; left out until known. */
  coverage?: React.ReactNode;
  /** A dashed outline sets the card apart from the real categories. */
  dashed?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-0 items-start gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        dashed && "border-dashed",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          iconClassName,
        )}
      >
        <CardIcon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-sm font-semibold break-words">{name}</h3>
          <span
            className={cn(
              "shrink-0 text-sm font-semibold tabular-nums",
              count === 0 && "text-muted-foreground",
            )}
          >
            {itemCountLabel(count)}
          </span>
        </div>
        {description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {/* What kinds of knowledge are in it. */}
        {count > 0 && <SourceCounts counts={sourceCounts} />}
        {coverage}
        {/* What needs the user's attention, once there is something. */}
        {(failedCount > 0 || draftCount > 0) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
            {failedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-destructive">
                <IconAlertTriangle className="size-3.5" />
                {failedCount} Failed
              </span>
            )}
            {draftCount > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <IconPencil className="size-3.5" />
                {draftCountLabel(draftCount)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * Every knowledge category as a card with how many items are filed under it,
 * each opening that category's own list. A last card gathers the knowledge
 * that has no category, once there is some.
 */
export function KnowledgeCategoriesGrid({
  data,
  isLoading,
}: {
  data: KnowledgeCategories | null;
  isLoading: boolean;
}) {
  // The coverage the KB Coverage card loaded for its period; each card shows
  // its own category's share once that is known.
  const { FetchAnswerCoverageData: coverage } = useAppSelector(
    (state) => state.GetKnowledgeTestAiReducer.FetchAnswerCoverageState,
  );
  const coverageOf = (slug: string) =>
    coverage?.categories.find((entry) => entry.slug === slug);

  if (!data) {
    return isLoading ? (
      <div className={GRID_CLASS} aria-busy="true">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-[84px] rounded-xl" />
        ))}
      </div>
    ) : (
      <p className="rounded-xl border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
        Couldn&apos;t load the categories. Please try again later.
      </p>
    );
  }

  if (data.categories.length === 0 && data.uncategorized_count === 0) {
    return (
      <p className="rounded-xl border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
        No categories yet.
      </p>
    );
  }

  return (
    <section aria-label="Knowledge categories" className={GRID_CLASS}>
      {data.categories.map((category) => (
        <CategoryCard
          key={category.id}
          href={`/knowledge/categories/${encodeURIComponent(category.slug)}`}
          icon={getKnowledgeCategoryIcon(category.slug)}
          name={category.name}
          description={category.description}
          count={category.count}
          draftCount={category.draft_count}
          failedCount={category.failed_count}
          sourceCounts={category.source_counts}
          coverage={
            coverage && (
              <CategoryCoverageChip
                entry={coverageOf(category.slug)}
                hasKnowledge={category.count > 0}
              />
            )
          }
        />
      ))}
      {/* Also when only customer questions have no category, so those gaps show. */}
      {(data.uncategorized_count > 0 || coverage?.uncategorized) && (
        <CategoryCard
          href={`/knowledge/categories/${KNOWLEDGE_UNCATEGORIZED_ROUTE}`}
          icon={UNCATEGORIZED_ICON}
          name={KNOWLEDGE_UNCATEGORIZED_NAME}
          description={KNOWLEDGE_UNCATEGORIZED_DESCRIPTION}
          count={data.uncategorized_count}
          draftCount={data.uncategorized_draft_count}
          failedCount={data.uncategorized_failed_count}
          sourceCounts={data.uncategorized_source_counts}
          coverage={
            coverage && <CategoryCoverageChip entry={coverage.uncategorized} />
          }
          dashed
        />
      )}
    </section>
  );
}
