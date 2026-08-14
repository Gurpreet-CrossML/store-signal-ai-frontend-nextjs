"use client";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { SocialPost } from "@/redux/api-slice/social-ai-slice";
import Image from "next/image";
import { useEffect, useState } from "react";

// Layout hint when the API returns no dimensions (Instagram images) — the
// rendered size is CSS-driven (w-full h-auto), so this only prevents next/image
// from rejecting a null width/height and sets the pre-load aspect ratio.
export const DEFAULT_MEDIA_SIZE = 1080;

// Full-bleed media carousel with overlaid prev/next buttons and an IG-style
// "current/total" counter pill (both only when there is more than one slide).
export function MediaCarousel({
  mediaEntries,
}: {
  mediaEntries: SocialPost["media_entries"];
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(1);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap() + 1);
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <Carousel setApi={setApi}>
      {/* Each slide caps its own height and centres, so the carousel is as
          tall as its tallest slide and never taller. Capping the container
          instead left the viewport at one height while the slides kept
          their natural one — the gap and the overflowing image. */}
      <CarouselContent className="ml-0 items-center">
        {mediaEntries.map((media, index) => (
          <CarouselItem key={index} className="pl-0">
            {media.media_type === "image" && (
              <Image
                src={media.url}
                alt="Post media"
                width={media.width ?? DEFAULT_MEDIA_SIZE}
                height={media.height ?? DEFAULT_MEDIA_SIZE}
                unoptimized
                className="mx-auto max-h-112 w-auto object-contain"
              />
            )}
            {media.media_type === "video" && (
              <video
                controls
                src={media.url}
                className="mx-auto max-h-112 w-auto"
              />
            )}
          </CarouselItem>
        ))}
      </CarouselContent>
      {mediaEntries.length > 1 && (
        <>
          <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
            {current}/{mediaEntries.length}
          </span>
          <CarouselPrevious className="left-3 border-none bg-white/80 text-black shadow-md hover:bg-white disabled:opacity-0" />
          <CarouselNext className="right-3 border-none bg-white/80 text-black shadow-md hover:bg-white disabled:opacity-0" />
        </>
      )}
    </Carousel>
  );
}
