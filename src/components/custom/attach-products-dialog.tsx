"use client";

import { useCallback, useEffect, useState } from "react";
import { IconSearch, IconShoppingBag, IconX } from "@tabler/icons-react";
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
import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "@/redux/axios-config";
import { ProductData } from "@/redux/api-slice/thread-slice";

interface ApiProductResult {
  id: string | number;
  name: string;
  external_id?: number | string;
  price?: string | number | null;
  sale_price?: string | number | null;
  url?: string;
  image?: string;
  images?: Array<{ url: string }>;
}

interface AttachProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeCode: string;
  selectedProducts: ProductData[];
  onApplyProducts: (products: ProductData[]) => void;
  maxProducts?: number;
}

export function AttachProductsDialog({
  open,
  onOpenChange,
  storeCode,
  selectedProducts,
  onApplyProducts,
  maxProducts = 10,
}: AttachProductsDialogProps) {
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [currentSelected, setCurrentSelected] =
    useState<ProductData[]>(selectedProducts);

  useEffect(() => {
    if (open) {
      setCurrentSelected(selectedProducts);
    }
  }, [open, selectedProducts]);

  const fetchProducts = useCallback(
    async (query: string) => {
      if (!storeCode) return;
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ store_code: storeCode });
        if (query.trim()) params.set("search", query.trim());

        const response = await axiosInstance.get(
          `${ENDPOINTS.searchProducts()}?${params.toString()}`,
          { useBackend: true },
        );
        const data: ApiProductResult[] = response.data?.data ?? [];
        const seenIds = new Set<string>();
        const mapped: ProductData[] = [];
        for (const p of data) {
          const id = String(p.id);
          if (seenIds.has(id)) continue;
          seenIds.add(id);

          const imgUrl =
            p.image ||
            (Array.isArray(p.images) && p.images[0]?.url) ||
            "";
          const rawPrice = p.sale_price ?? p.price;
          const formattedPrice = rawPrice != null && rawPrice !== ""
            ? typeof rawPrice === "number" || !String(rawPrice).startsWith("$")
              ? `$${rawPrice}`
              : String(rawPrice)
            : "";

          mapped.push({
            id,
            name: p.name,
            image: imgUrl,
            price: formattedPrice,
            product_url: p.url || "",
            description: "",
            available_for_sale: true,
          });
        }
        setProducts(mapped);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [storeCode],
  );

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      fetchProducts(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProducts, open, search]);

  const toggleProduct = (product: ProductData) => {
    const isAlreadySelected = currentSelected.some((p) => p.id === product.id);
    if (isAlreadySelected) {
      setCurrentSelected((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      if (currentSelected.length >= maxProducts) {
        toast.error(`Limit reached`, {
          description: `You can attach up to ${maxProducts} products at once.`,
        });
        return;
      }
      setCurrentSelected((prev) => [...prev, product]);
    }
  };

  const handleApply = () => {
    const unique = Array.from(
      new Map(currentSelected.map((p) => [p.id, p])).values(),
    );
    onApplyProducts(unique);
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
              const checked = currentSelected.some((p) => p.id === product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => toggleProduct(product)}
                  className={`flex items-center gap-3 p-3 transition-colors cursor-pointer hover:bg-muted/50 ${
                    checked ? "bg-primary/5" : ""
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleProduct(product)}
                    className="shrink-0"
                  />
                  {product.image ? (
                    <Image
                      src={product.image}
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
                      ID: {product.id}
                    </p>
                  </div>
                  {product.price && (
                    <span className="text-xs font-semibold text-primary shrink-0">
                      {product.price}
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
