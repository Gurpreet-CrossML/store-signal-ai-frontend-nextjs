import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  type Product,
  type ProductVariant,
  useTestChatbotContext,
} from "@/clients/test-simulate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

function getVariantId(variant: ProductVariant, index: number) {
  return variant.variant_id ?? variant.id ?? variant.variant_name ?? index;
}

function getVariantTitle(variant: ProductVariant) {
  return (
    variant.variant_name ||
    variant.title ||
    variant.options?.map((option) => option.value).join(" / ") ||
    "Default"
  );
}

function getVariantPrice(variant: ProductVariant, fallback: string | number) {
  return variant.variant_price ?? variant.price?.amount ?? fallback;
}

function getInitialVariantId(product: Product) {
  const variants = product.variants || [];
  if (!variants.length) return product.id;
  const firstAvailable =
    variants.find((variant) => variant.available_for_sale !== false) ||
    variants[0];
  return firstAvailable ? getVariantId(firstAvailable, 0) : product.id;
}

export function ProductCard({
  product,
  showDescription = false,
  viewDetail = false,
  addCart = false,
  showVariants = false,
}: {
  product: Product;
  showDescription?: boolean;
  viewDetail?: boolean;
  addCart?: boolean;
  showVariants?: boolean;
}) {
  const { sendMessage } = useTestChatbotContext();
  const productRef = useRef<HTMLDivElement | null>(null);
  const variants = product.variants || [];
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<
    string | number | null
  >(() => getInitialVariantId(product));
  const [showMoreModal, setShowMoreModal] = useState(false);

  useEffect(() => {
    window.setTimeout(() => {
      setModalRoot(productRef.current);
    }, 0);
  }, []);

  useEffect(() => {
    window.setTimeout(() => {
      setSelectedVariantId(getInitialVariantId(product));
    }, 0);
  }, [product]);

  const selectedVariant =
    variants.find(
      (variant, index) => getVariantId(variant, index) === selectedVariantId,
    ) || variants[0];
  const visibleVariants =
    variants.length > 3 &&
    selectedVariant &&
    !variants
      .slice(0, 3)
      .some(
        (variant, index) => getVariantId(variant, index) === selectedVariantId,
      )
      ? [...variants.slice(0, 2), selectedVariant]
      : variants.slice(0, 3);
  const displayPrice =
    showVariants && selectedVariant
      ? getVariantPrice(selectedVariant, product.price)
      : product.price;

  const handleAddPrompt = () => {
    if (!selectedVariantId) {
      toast.success("Please select a variant first.");
      return;
    }

    const variant = variants.find(
      (item, index) => getVariantId(item, index) === selectedVariantId,
    );
    sendMessage(
      `Add ${product.name} (${variant ? getVariantTitle(variant) : selectedVariantId}) to cart`,
    );
  };

  return (
    <Card ref={productRef} className="w-[220px] shrink-0 overflow-hidden py-0">
      <a href={product.product_url} target="_blank" rel="noopener noreferrer">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-32 w-full bg-muted object-contain p-2"
        />
      </a>
      <CardContent className="flex min-h-[180px] flex-col space-y-2 p-3">
        <a
          href={product.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <p
            className="line-clamp-2 min-h-10 text-sm font-semibold"
            title={product.name}
          >
            {product.name}
          </p>
        </a>
        {showDescription && product.description ? (
          <p
            className="line-clamp-2 text-xs text-muted-foreground"
            title={product.description}
          >
            {product.description}
          </p>
        ) : null}
        <p className="text-sm font-semibold text-primary">{displayPrice}</p>

        {showVariants && variants.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {visibleVariants.map((variant, index) => {
              const variantId = getVariantId(variant, index);
              const disabled = variant.available_for_sale === false;
              return (
                <button
                  key={String(variantId)}
                  type="button"
                  className={cn(
                    "max-w-full truncate rounded-full border px-2 py-1 text-[11px] hover:bg-muted",
                    selectedVariantId === variantId &&
                      "border-primary bg-primary/10 text-primary",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                  onClick={() => !disabled && setSelectedVariantId(variantId)}
                  disabled={disabled}
                  title={getVariantTitle(variant)}
                >
                  {getVariantTitle(variant)}
                </button>
              );
            })}
            {variants.length > 3 ? (
              <button
                type="button"
                className="rounded-full border px-2 py-1 text-[11px] hover:bg-muted"
                onClick={() => setShowMoreModal(true)}
              >
                +{variants.length - 3} more
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex gap-2">
          {viewDetail ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 flex-1"
              onClick={() =>
                sendMessage(`Give me details of "${product.name}"`)
              }
            >
              View
            </Button>
          ) : null}
          {addCart ? (
            <Button
              type="button"
              size="sm"
              className="h-8 flex-1"
              onClick={handleAddPrompt}
            >
              Add
            </Button>
          ) : null}
        </div>
      </CardContent>

      {showMoreModal && modalRoot
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
              <div className="w-full max-w-sm rounded-md border bg-background p-4 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">All Variants</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowMoreModal(false)}
                  >
                    x
                  </Button>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a variant for {product.name}
                </p>
                <div className="mt-3 space-y-2">
                  {variants.map((variant, index) => {
                    const variantId = getVariantId(variant, index);
                    const disabled = variant.available_for_sale === false;
                    return (
                      <label
                        key={String(variantId)}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-3 rounded-md border p-3 text-sm",
                          selectedVariantId === variantId &&
                            "border-primary bg-primary/10",
                          disabled && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <span>{getVariantTitle(variant)}</span>
                        <span className="text-muted-foreground">
                          {getVariantPrice(variant, product.price)}
                        </span>
                        <input
                          type="radio"
                          name={`variant-more-${product.id}`}
                          value={String(variantId)}
                          checked={selectedVariantId === variantId}
                          disabled={disabled}
                          onChange={() => {
                            setSelectedVariantId(variantId);
                            setShowMoreModal(false);
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>,
            modalRoot,
          )
        : null}
    </Card>
  );
}
