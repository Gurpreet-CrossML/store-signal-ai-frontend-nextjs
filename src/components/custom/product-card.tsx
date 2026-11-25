import { useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";
import type {
  ProductComparisonBlock,
  ProductData,
  ProductVariant,
} from "@/redux/api-slice/thread-slice";

// Shows the same details as the widget's ProductCard (store-signal-widget), in
// Live Chat's own card size, minus the customer-only "Add to Cart" action.

const variantTitle = (v: ProductVariant) =>
  v.variant_name || v.options?.map((o) => o.value).join(" / ");

export function ProductCard({
  product,
  comparisonBlock,
}: {
  product: ProductData;
  comparisonBlock?: ProductComparisonBlock;
}) {
  const variants = product.variants ?? [];
  // Same default as the widget: only a single in-stock variant is pre-selected.
  const [selectedId, setSelectedId] = useState<number | null>(() =>
    variants.length === 1 && variants[0].available_for_sale !== false
      ? variants[0].variant_id
      : null,
  );
  const [showAll, setShowAll] = useState(false);

  const selected =
    variants.find((v) => v.variant_id === selectedId) ?? variants[0];
  const visibleVariants = showAll ? variants : variants.slice(0, 3);
  const displayPrice = selected?.variant_price ?? product.price;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-background">
      <a
        href={product.product_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View ${product.name}`}
        className="block bg-white"
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            width={240}
            height={144}
            unoptimized
            className="h-40 w-full object-contain p-2"
          />
        ) : (
          <div className="flex h-32 items-center justify-center bg-muted text-xs text-muted-foreground">
            No image
          </div>
        )}
      </a>

      <div className="flex flex-col gap-0.5 p-1.5">
        <a
          href={product.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-1 text-xs font-medium text-foreground hover:text-primary"
          title={product.name}
        >
          {product.name}
        </a>

        <div className="flex items-center gap-0.5 text-xs font-semibold text-primary">
          {displayPrice}
          {product.discount_percentage ? (
            <span className="text-[11px]">
              ({Math.round(product.discount_percentage)}% off)
            </span>
          ) : null}
        </div>

        {variants.length > 0 && (
          <div className="mt-1 mb-0.5 flex flex-wrap content-start gap-1.5">
            {visibleVariants.map((v) => {
              const disabled = v.available_for_sale === false;
              return (
                <button
                  key={v.variant_id}
                  type="button"
                  title={variantTitle(v)}
                  disabled={disabled}
                  onClick={() => setSelectedId(v.variant_id)}
                  className={cn(
                    "h-[22px] max-w-[90px] min-w-8 truncate rounded-full border border-border bg-background px-2.5 text-[10px] font-semibold whitespace-nowrap text-foreground transition-colors",
                    selectedId === v.variant_id &&
                      "border-primary text-primary",
                    disabled && "cursor-not-allowed line-through opacity-45",
                  )}
                >
                  {variantTitle(v)}
                </button>
              );
            })}
            {!showAll && variants.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="h-[22px] rounded-full border border-border bg-background px-2.5 text-[10px] font-semibold whitespace-nowrap text-foreground"
              >
                +{variants.length - 3} more
              </button>
            )}
          </div>
        )}
      </div>

      {comparisonBlock && (
        <div className="p-1.5 text-xs [&_li]:ml-4 [&_ul]:list-disc">
          <ReactMarkdown>{comparisonBlock.comparison_message}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
