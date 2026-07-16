import type { Product } from "@/clients/test-simulate";
import { ProductCard } from "./ProductCard";

interface ProductCarouselProps {
  products: Product[];
  showDescription?: boolean;
  viewDetail?: boolean;
  addCart?: boolean;
}

export function ProductCarousel({
  products,
  showDescription = false,
  viewDetail = false,
  addCart = false,
}: ProductCarouselProps) {
  if (products.length === 0) return null;

  return (
    <div className="max-w-full overflow-x-auto pb-2">
      <div className="flex w-max max-w-full gap-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            showDescription={showDescription}
            viewDetail={viewDetail}
            addCart={addCart}
            showVariants={addCart}
          />
        ))}
      </div>
    </div>
  );
}
