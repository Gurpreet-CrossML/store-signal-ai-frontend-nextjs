import Link from "next/link";
import {
  IconArrowRight,
  IconArticle,
  IconFileText,
  IconGlobe,
  IconMessageQuestion,
  IconShoppingBag,
  type Icon,
} from "@tabler/icons-react";

import { Skeleton } from "@/components/ui/skeleton";
import { KNOWLEDGE_ALL_ROUTE } from "@/lib/config";
import { cn } from "@/lib/utils";
import type {
  KnowledgeCounts,
  KnowledgeSource,
} from "@/redux/api-slice/knowledge-rag-slice";

type Tile = {
  key: keyof KnowledgeCounts;
  label: string;
  icon: Icon;
  /** Colours of the icon tile; the same hues as the storage card's legend. */
  tone: string;
  /** The kind of knowledge a tile opens the list of; none for products. */
  source?: KnowledgeSource;
  hint?: string;
};

const TILES: Tile[] = [
  {
    key: "urls",
    label: "Website Pages",
    icon: IconGlobe,
    tone: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    source: "url",
  },
  {
    key: "documents",
    label: "Documents",
    icon: IconFileText,
    tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    source: "file",
  },
  {
    key: "faqs",
    label: "Questions And Answers",
    icon: IconMessageQuestion,
    tone: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    source: "faq",
  },
  {
    key: "articles",
    label: "Articles",
    icon: IconArticle,
    tone: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
    source: "article",
  },
  {
    key: "products",
    label: "Shopify Products",
    icon: IconShoppingBag,
    tone: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
    hint: "Synced from Shopify",
  },
];

const TILE_CLASS =
  "flex min-w-0 items-center gap-3 rounded-xl border bg-card px-4 py-3";

/**
 * What the store already has, one tile per kind of knowledge with its count.
 * A tile opens the list of that kind; Shopify products are synced, not
 * managed here, so theirs doesn't.
 */
export function KnowledgeSummary({
  counts,
}: {
  counts: KnowledgeCounts | null;
}) {
  return (
    <section
      aria-label="Already in your knowledge"
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold">Already In Your Knowledge</h3>
          <p className="text-xs text-muted-foreground">
            Everything your assistant can use today, by kind.
          </p>
        </div>
        <Link
          href={`/knowledge/categories/${KNOWLEDGE_ALL_ROUTE}`}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View All
          <IconArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TILES.map(({ key, label, icon: TileIcon, tone, source, hint }) => {
          if (!counts) {
            return <Skeleton key={key} className="h-[72px] rounded-xl" />;
          }
          const content = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  tone,
                )}
              >
                <TileIcon className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-lg leading-tight font-semibold tabular-nums">
                  {counts[key].toLocaleString()}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {label}
                </span>
              </span>
            </>
          );
          return source ? (
            <Link
              key={key}
              href={`/knowledge/categories/${KNOWLEDGE_ALL_ROUTE}?source=${source}`}
              className={cn(
                TILE_CLASS,
                "transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              )}
            >
              {content}
            </Link>
          ) : (
            <div key={key} className={TILE_CLASS} title={hint}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
