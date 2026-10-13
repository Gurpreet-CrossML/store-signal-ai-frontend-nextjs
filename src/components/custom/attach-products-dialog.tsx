"use client";

import { useEffect, useState } from "react";
import { IconSearch, IconShoppingBag } from "@tabler/icons-react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { formatPrice } from "@/lib/helpers";
import {
  SearchProducts,
  type ProductData,
  type ProductSearchResult,
} from "@/redux/api-slice/thread-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

interface AttachProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeCode: string;
  selectedProducts: ProductData[];
  onApplyProducts: (products: ProductData[]) => void;
  maxProducts?: number;
  currency?: string;
}

export function AttachProductsDialog({
  open,
  onOpenChange,
  storeCode,
  selectedProducts,
  onApplyProducts,
  maxProducts = 10,
  currency,
}: AttachProductsDialogProps) {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentSelected, setCurrentSelected] =
    useState<ProductData[]>(selectedProducts);

  const { SearchProductsData, SearchProductsIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.SearchProductsState,
  );

  // Reopening starts with latest selectedProducts. Adjusted during render
  // against a sentinel to avoid cascading renders from useEffect.
  const [lastOpen, setLastOpen] = useState(open);
  if (lastOpen !== open) {
    setLastOpen(open);
    if (open) {
      setCurrentSelected(selectedProducts);
      setSearch("");
      setDebouncedSearch("");
    }
  }

  // Debounce search input to avoid hitting the API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Dispatch search through Redux
  useEffect(() => {
    if (!open || !storeCode) return;
    dispatch(SearchProducts({ storeCode, search: debouncedSearch }));
  }, [dispatch, open, storeCode, debouncedSearch]);

  const products = SearchProductsData ?? [];
  const isLoading = SearchProductsIsLoading;

  const toggleProduct = (product: ProductSearchResult) => {
    const id = String(product.id);
    setCurrentSelected((prev) => {
      const isAlreadySelected = prev.some((p) => p.id === id);
      if (isAlreadySelected) {
        return prev.filter((p) => p.id !== id);
      }
      if (prev.length >= maxProducts) {
        toast.error("Limit reached", {
          description: `You can attach up to ${maxProducts} products at once.`,
        });
        return prev;
      }
      const rawPrice = product.sale_price ?? product.price;
      const formattedPrice =
        rawPrice != null && rawPrice !== ""
          ? formatPrice(rawPrice, currency)
          : "";
      const imgUrl =
        product.image ||
        (Array.isArray(product.images) && product.images[0]?.url) ||
        "";

      const mapped: ProductData = {
        id,
        name: product.name,
        image: imgUrl,
        price: formattedPrice,
        product_url: product.url || "",
        description: "",
        available_for_sale: true,
      };
      return [...prev, mapped];
    });
  };

  const handleApply = () => {
    onApplyProducts(currentSelected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconShoppingBag className="size-4" />
            </div>
            <div>
              <DialogTitle>Attach Products</DialogTitle>
              <DialogDescription className="text-xs">
                Select up to {maxProducts} products to share with the customer.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative my-2">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name…"
            className="pl-9 pr-4"
          />
        </div>

        {/* Selected count bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Selected:{" "}
            <strong className="text-foreground">
              {currentSelected.length}/{maxProducts}
            </strong>
          </span>
          {currentSelected.length > 0 && (
            <button
              type="button"
              onClick={() => setCurrentSelected([])}
              className="text-primary hover:underline"
            >
              Clear selection
            </button>
          )}
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto min-h-[260px] max-h-[360px] divide-y border rounded-lg">
          {isLoading ? (
            <div className="flex h-full min-h-[240px] items-center justify-center">
              <Spinner className="size-6 text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center p-4 text-center">
              <Typography variant="muted">No products found.</Typography>
            </div>
          ) : (
            products.map((product) => {
              const productId = String(product.id);
              const checked = currentSelected.some((p) => p.id === productId);
              const imgUrl =
                product.image ||
                (Array.isArray(product.images) && product.images[0]?.url) ||
                "";
              const rawPrice = product.sale_price ?? product.price;
              const displayPrice =
                rawPrice != null && rawPrice !== ""
                  ? formatPrice(rawPrice, currency)
                  : "";

              return (
                <div
                  key={productId}
                  onClick={() => toggleProduct(product)}
                  className={`flex items-center gap-3 p-3 transition-colors cursor-pointer hover:bg-muted/50 ${
                    checked ? "bg-primary/5" : ""
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    tabIndex={-1}
                    className="shrink-0 pointer-events-none"
                  />
                  {imgUrl ? (
                    <Image
                      src={imgUrl}
                      alt={product.name}
                      width={40}
                      height={40}
                      unoptimized
                      className="size-10 rounded object-contain bg-muted shrink-0"
                    />
                  ) : (
                    <div className="size-10 rounded bg-muted shrink-0 flex items-center justify-center text-[10px] text-muted-foreground">
                      No img
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {product.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      ID: {productId}
                    </p>
                  </div>
                  {displayPrice && (
                    <span className="text-xs font-semibold text-primary shrink-0">
                      {displayPrice}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="mt-3 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleApply}>
            Done ({currentSelected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
