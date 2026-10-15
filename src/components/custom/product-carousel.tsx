import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { ProductData } from "@/redux/api-slice/thread-slice";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { SupportProductCard } from "@/components/custom/product-card";

export function SupportProductCarousel({
  products,
}: {
  products: ProductData[];
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    const updateSelectedIndex = () => {
      setSelectedIndex(api.selectedScrollSnap());
    };

    updateSelectedIndex();
    api.on("select", updateSelectedIndex);
    api.on("reInit", updateSelectedIndex);

    return () => {
      api.off("select", updateSelectedIndex);
      api.off("reInit", updateSelectedIndex);
    };
  }, [api]);

  if (products.length === 0) return null;

  const snapCount = api?.scrollSnapList().length ?? 1;
  const canScrollPrev = selectedIndex > 0;
  const canScrollNext = selectedIndex < snapCount - 1;

  return (
    <div className="mt-2 w-full">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", containScroll: "trimSnaps" }}
      >
        <CarouselContent className="-ml-2">
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="basis-[42%] pl-2 sm:basis-1/4"
            >
              <SupportProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {products.length > 3 && (
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
            {selectedIndex + 1} / {snapCount}
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
