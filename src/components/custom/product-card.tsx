import Image from "next/image";

import type { ProductData } from "@/redux/api-slice/thread-slice";

export function ProductCard({ product }: { product: ProductData }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border bg-background">
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
          {product.price}
        </span>
      </div>
    </div>
  );
}
