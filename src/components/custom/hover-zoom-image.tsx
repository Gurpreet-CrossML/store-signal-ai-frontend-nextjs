"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { cn } from "@/lib/utils";

const LENS_SIZE = 80; // size of the square lens drawn over the thumbnail (px)

type Point = { x: number; y: number };

/**
 * Flipkart-style hover-to-zoom image. Renders a thumbnail; while hovered, a
 * lens follows the cursor over the thumbnail and a magnified panel is shown
 * beside it (flips to the other side when there isn't room on the right).
 *
 * The magnified panel is portaled to <body> so it can escape clipped/scrolled
 * containers such as the thread drawer.
 */
export default function HoverZoomImage({
  src,
  alt,
  className,
  zoom = 2.5,
  panelSize = 340,
}: {
  src: string;
  alt: string;
  className?: string;
  /** Magnification factor for the preview panel. */
  zoom?: number;
  /** Width/height of the square preview panel in px. */
  panelSize?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [bg, setBg] = useState<Point>({ x: 50, y: 50 }); // background-position %
  const [lens, setLens] = useState<Point>({ x: 0, y: 0 }); // lens top-left (px)

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setRect(r);

    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    setBg({
      x: Math.max(0, Math.min(100, (x / r.width) * 100)),
      y: Math.max(0, Math.min(100, (y / r.height) * 100)),
    });
    setLens({
      x: Math.max(0, Math.min(r.width - LENS_SIZE, x - LENS_SIZE / 2)),
      y: Math.max(0, Math.min(r.height - LENS_SIZE, y - LENS_SIZE / 2)),
    });
  };

  // Position the magnified panel beside the thumbnail, flipping sides if the
  // viewport doesn't have room on the right.
  const panelStyle: React.CSSProperties | null = rect
    ? (() => {
        const hasRoomRight = window.innerWidth - rect.right > panelSize + 16;
        const left = hasRoomRight
          ? rect.right + 12
          : rect.left - panelSize - 12;
        const top = Math.max(
          8,
          Math.min(window.innerHeight - panelSize - 8, rect.top),
        );
        return {
          left,
          top,
          width: panelSize,
          height: panelSize,
          backgroundImage: `url("${src}")`,
          backgroundSize: `${zoom * 100}%`,
          backgroundPosition: `${bg.x}% ${bg.y}%`,
        };
      })()
    : null;

  return (
    <div
      ref={ref}
      className={cn(
        "relative cursor-zoom-in overflow-hidden bg-muted",
        className,
      )}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={handleMove}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 33vw, 160px"
        className="object-cover"
      />

      {active && (
        <div
          className="pointer-events-none absolute z-10 rounded-sm border border-primary/60 bg-primary/10"
          style={{
            width: LENS_SIZE,
            height: LENS_SIZE,
            left: lens.x,
            top: lens.y,
          }}
        />
      )}

      {active &&
        panelStyle &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[100] rounded-md border bg-background bg-no-repeat shadow-xl"
            style={panelStyle}
          />,
          document.body,
        )}
    </div>
  );
}
