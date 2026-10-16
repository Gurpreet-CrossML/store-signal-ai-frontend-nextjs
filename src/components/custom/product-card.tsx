import { useState } from "react";
import Image from "next/image";

import type { ProductData } from "@/redux/api-slice/thread-slice";

const EMPTY_VARIANTS: NonNullable<ProductData["variants"]> = [];

export function ProductCard({ product }: { product: ProductData }) {
  const variants = product.variants ?? EMPTY_VARIANTS;
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    () =>
      variants.find((variant) => variant.available_for_sale !== false)
        ?.variant_id ?? null,
  );

  const selectedVariant =
    variants.find((variant) => variant.variant_id === selectedVariantId) ??
    variants.find((variant) => variant.available_for_sale !== false);
  const displayPrice = selectedVariant?.variant_price ?? product.price;

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

      <div className="flex flex-1 flex-col gap-0.5 p-1.5">
        <a
          href={product.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-1 text-xs font-medium text-foreground hover:text-primary"
          title={product.name}
        >
          {product.name}
        </a>
        <span className="text-xs font-semibold text-primary">
          {displayPrice}
        </span>
        {variants.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {variants.map((variant) => (
              <button
                type="button"
                key={variant.variant_id}
                disabled={variant.available_for_sale === false}
                onClick={() => setSelectedVariantId(variant.variant_id)}
                className={`max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                  selectedVariantId === variant.variant_id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                } ${variant.available_for_sale === false ? "cursor-not-allowed opacity-50 line-through" : "hover:border-primary hover:text-primary"}`}
                title={variant.variant_name}
              >
                {variant.variant_name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
