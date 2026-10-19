import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type {
  ProductComparisonBlock,
  ProductData,
} from "@/redux/api-slice/thread-slice";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/custom/product-card";

export function ProductCarousel({
  products,
  comparisonBlock,
}: {
  products: ProductData[];
  comparisonBlock?: ProductComparisonBlock[] | null;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inView, setInView] = useState<number[]>([]);

  useEffect(() => {
    if (!api) return;

    const updateSelectedIndex = () => {
      setSelectedIndex(api.selectedScrollSnap());
      setInView(api.slidesInView());
    };

    updateSelectedIndex();
    api.on("select", updateSelectedIndex);
    api.on("reInit", updateSelectedIndex);
    api.on("slidesInView", updateSelectedIndex);

    return () => {
      api.off("select", updateSelectedIndex);
      api.off("reInit", updateSelectedIndex);
      api.off("slidesInView", updateSelectedIndex);
    };
  }, [api]);

  if (products.length === 0) return null;

  const snapCount = api?.scrollSnapList().length ?? 1;
  const canScrollPrev = selectedIndex > 0;
  const canScrollNext = selectedIndex < snapCount - 1;
  // Count the cards actually on screen, not scroll positions.
  const firstVisible = inView.length ? Math.min(...inView) + 1 : 1;
  const lastVisible = inView.length ? Math.max(...inView) + 1 : 1;

  return (
    <div className="mt-2 w-full min-w-0 max-w-full">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          containScroll: "trimSnaps",
          // Arrows move a full page of cards (1–3 → 4–6), not one card.
          slidesToScroll: "auto",
          inViewThreshold: 0.6,
        }}
      >
        <CarouselContent className="-ml-2">
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="basis-1/2 pl-2 sm:basis-1/3"
            >
              <ProductCard
                product={product}
                comparisonBlock={comparisonBlock?.find(
                  (b) => String(b.product_id) === String(product.id),
                )}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {snapCount > 1 && (
        <div className="mt-2 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous products"
            onClick={() => api?.scrollPrev()}
            disabled={!canScrollPrev}
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-12 text-center text-xs text-muted-foreground">
            {firstVisible === lastVisible
              ? firstVisible
              : `${firstVisible}–${lastVisible}`}{" "}
            of {products.length}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next products"
            onClick={() => api?.scrollNext()}
            disabled={!canScrollNext}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
