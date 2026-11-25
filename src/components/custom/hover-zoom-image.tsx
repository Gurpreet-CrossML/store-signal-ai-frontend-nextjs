"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * A message image's thumbnail. A click opens the whole image in a pop-up.
 */
export default function HoverZoomImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Open ${alt}`}
          className={cn(
            "relative cursor-zoom-in overflow-hidden bg-muted",
            className,
          )}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 33vw, 160px"
            className="object-cover"
            // Product images come from arbitrary, untrusted
            // store hostnames (Magento/Shopify/etc.) we can't
            // enumerate. unoptimized renders a direct <img> so
            // we skip the remotePatterns allowlist and avoid
            // proxying third-party bandwidth through our optimizer.
            unoptimized
          />
        </button>
      </DialogTrigger>
      <DialogContent className="p-2 sm:max-w-xl" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={900}
          unoptimized
          className="max-h-[60vh] w-full rounded-md object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
