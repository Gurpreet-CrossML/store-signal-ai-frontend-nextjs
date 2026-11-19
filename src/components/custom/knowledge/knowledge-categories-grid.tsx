import Link from "next/link";
import {
  IconAlertTriangle,
  IconArticle,
  IconBuildingStore,
  IconCreditCard,
  IconFileText,
  IconFolder,
  IconGlobe,
  IconHeadset,
  IconInbox,
  IconLock,
  IconMessageQuestion,
  IconPencil,
  IconReceiptRefund,
  IconRulerMeasure,
  IconShieldCheck,
  IconShirt,
  IconShoppingBag,
  IconTool,
  IconTruckDelivery,
  IconWash,
  type Icon,
} from "@tabler/icons-react";

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

type CategoryIcon = { icon: Icon; className: string };

// The icon and colour of each category's tile, by its slug. A category added
// later (no entry here) gets the folder icon.
const CATEGORY_ICONS: Record<string, CategoryIcon> = {
  "shipping-and-delivery": {
    icon: IconTruckDelivery,
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  "returns-refunds-and-exchanges": {
    icon: IconReceiptRefund,
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  "orders-and-payments": {
    icon: IconShoppingBag,
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  },
  "products-and-usage": {
    icon: IconShirt,
    className:
      "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
  },
  "safety-and-suitability": {
    icon: IconShieldCheck,
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
  "account-privacy-and-legal": {
    icon: IconLock,
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  },
  "store-and-brand": {
    icon: IconBuildingStore,
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
  "warranty-and-repairs": {
    icon: IconTool,
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  "customer-support-and-contact": {
    icon: IconHeadset,
    className:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  },
  "payments-and-billing": {
    icon: IconCreditCard,
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  },
  "product-care-and-maintenance": {
    icon: IconWash,
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  },
  "sizing-and-fit": {
    icon: IconRulerMeasure,
    className:
      "bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300",
  },
};

const DEFAULT_CATEGORY_ICON: CategoryIcon = {
  icon: IconFolder,
  className: "bg-muted text-muted-foreground",
};

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
          icon={CATEGORY_ICONS[category.slug] ?? DEFAULT_CATEGORY_ICON}
          name={category.name}
          description={category.description}
          count={category.count}
          draftCount={category.draft_count}
          failedCount={category.failed_count}
          sourceCounts={category.source_counts}
        />
      ))}
      {data.uncategorized_count > 0 && (
        <CategoryCard
          href={`/knowledge/categories/${KNOWLEDGE_UNCATEGORIZED_ROUTE}`}
          icon={UNCATEGORIZED_ICON}
          name={KNOWLEDGE_UNCATEGORIZED_NAME}
          description={KNOWLEDGE_UNCATEGORIZED_DESCRIPTION}
          count={data.uncategorized_count}
          draftCount={data.uncategorized_draft_count}
          failedCount={data.uncategorized_failed_count}
          sourceCounts={data.uncategorized_source_counts}
          dashed
        />
      )}
    </section>
  );
}
