import { useState } from "react";
import Image from "next/image";
import {
  IconChevronDown,
  IconChevronUp,
  IconLayoutList,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import type {
  ProductComparisonBlock,
  ProductData,
} from "@/redux/api-slice/thread-slice";

const VISIBLE_COUNT = 3;

/**
 * Compact, read-only product strip for the thread transcript: one bordered box
 * with a header ("AI sent N products as a carousel"), a row of the first few
 * products, and a "View all" toggle that expands the box in place into a
 * numbered grid of every product the customer could swipe through.
 *
 * Separate from `ProductCarousel`, which the chatbot keeps using unchanged.
 */
export function ProductStrip({
  products,
  sourceLabel = "Shopify catalog",
}: {
  products: ProductData[];
  /** Accepted for caller compatibility; the compact view doesn't render it. */
  comparisonBlock?: ProductComparisonBlock[] | null;
  sourceLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (products.length === 0) return null;

  const canExpand = products.length > VISIBLE_COUNT;
  const shown = expanded ? products : products.slice(0, VISIBLE_COUNT);

  return (
    <div className="mt-3 w-full min-w-0 max-w-full overflow-hidden rounded-xl border bg-background">
      <div className="flex items-center justify-between gap-3 px-4 pt-3 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-2">
          <IconLayoutList className="size-4 shrink-0" />
          <span className="truncate">
            AI sent{" "}
            <span className="font-semibold text-foreground">
              {products.length} {products.length === 1 ? "product" : "products"}
            </span>{" "}
            as a carousel · from {sourceLabel}
          </span>
        </span>
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5"
          >
            {expanded ? "Show less" : `View all ${products.length}`}
            {expanded ? (
              <IconChevronUp className="size-4" />
            ) : (
              <IconChevronDown className="size-4" />
            )}
          </button>
        )}
      </div>

      {expanded ? (
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 xl:grid-cols-5">
          {shown.map((product, index) => (
            <a
              key={product.id}
              href={product.product_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${product.name}`}
              className="flex min-w-0 flex-col gap-2 rounded-lg border p-2 transition-colors hover:border-primary"
            >
              <span className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-md bg-muted">
                <span
                  className={cn(
                    "absolute left-1.5 top-1.5 z-10 flex size-5 items-center justify-center rounded-full text-[11px] font-semibold text-white",
                    index < VISIBLE_COUNT
                      ? "bg-foreground"
                      : "bg-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                {product.image ? (
                  <Image
                    src={product.image}
                    alt=""
                    width={160}
                    height={120}
                    unoptimized
                    className="size-full object-contain"
                  />
                ) : null}
              </span>
              <span
                className="line-clamp-2 min-h-8 text-xs font-medium text-foreground"
                title={product.name}
              >
                {product.name}
              </span>
              <span className="text-sm font-semibold text-primary">
                {product.price}
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div className="grid auto-cols-[minmax(190px,1fr)] grid-flow-col gap-4 overflow-x-auto px-4 pb-4 pt-3">
          {shown.map((product) => (
            <a
              key={product.id}
              href={product.product_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${product.name}`}
              className="flex min-w-0 items-center gap-3"
            >
              <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt=""
                    width={44}
                    height={44}
                    unoptimized
                    className="size-full object-contain"
                  />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {product.name}
                </span>
                <span className="block text-sm font-semibold text-primary">
                  {product.price}
                </span>
              </span>
            </a>
          ))}
        </div>
      )}

      {expanded && (
        <p className="px-4 pb-3 text-xs text-muted-foreground">
          Numbers show the order the customer swiped through. Click a product to
          open it.
        </p>
      )}
    </div>
  );
}

export default ProductStrip;
