"use client";

import Image from "next/image";
import {
  IconArrowRight,
  IconChevronLeft,
  IconCopy,
  IconExternalLink,
  IconFileText,
  IconPhone,
  IconRosetteDiscountCheckFilled,
  IconVideo,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { WhatsAppTemplateComponent } from "@/redux/api-slice/social-ai-slice";
import { getComponent, previewBodyText } from "./whatsapp-template-helpers";

// public/iPhone-outline.png is a full-height phone-frame overlay with a
// genuinely transparent screen cutout — used whole, at its own aspect
// ratio, with real content sitting behind it in that cutout. Bounds
// measured off its alpha channel (1024x1536 canvas, screen cutout from
// (164,148) to (859,1498)), as percentages so they hold at any render
// width. A phone's screen doesn't grow to fit content, it scrolls — so the
// content pane scrolls internally rather than the mockup stretching taller
// for a long template.
const PHONE_WIDTH = 280;
const PHONE_ASPECT_RATIO = 1024 / 1536;
const SCREEN_INSET = {
  left: "16.02%",
  right: "16.11%",
  top: "9.64%",
  bottom: "2.47%",
};

function buttonIcon(type: string) {
  switch (type) {
    case "URL":
      return IconExternalLink;
    case "PHONE_NUMBER":
      return IconPhone;
    case "COPY_CODE":
      return IconCopy;
    default:
      return IconArrowRight;
  }
}

/**
 * The WhatsApp phone-frame mockup: chat header + one message bubble
 * (header/body/footer/buttons) rendered from a template's own `components`.
 * Shared by the templates list's read-only preview and the create screen's
 * live preview — same rendering either way, only the `components` (and
 * whether they're Meta's real data or an in-progress draft) differ.
 */
export function WhatsAppPhoneMockup({
  accountName,
  isVerified,
  components,
  maxWidth = PHONE_WIDTH,
}: {
  accountName: string;
  isVerified: boolean;
  components: WhatsAppTemplateComponent[];
  // Overridable per caller — the create/edit page's sidebar column stays at
  // the default, the standalone preview dialog sizes up (more room to
  // spare than a 360px sidebar).
  maxWidth?: number;
}) {
  const header = getComponent(components, "HEADER");
  const body = getComponent(components, "BODY");
  const footer = getComponent(components, "FOOTER");
  const buttons = getComponent(components, "BUTTONS");
  const headerImageUrl = header?.example?.header_handle?.[0];
  // Illustrative only — a template has no real send time until it's
  // actually sent. Showing "now" keeps the bubble honest rather than
  // inventing a fake sent timestamp.
  const previewTime = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const buttonClassName =
    "flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium text-primary hover:bg-muted/60";

  return (
    <div
      className="relative mx-auto w-full overflow-hidden"
      style={{ maxWidth, aspectRatio: PHONE_ASPECT_RATIO }}
    >
      {/* Screen content — sits behind the frame, inset to the cutout's
          measured bounds, scrolling internally rather than growing the
          mockup for a long template. */}
      <div
        className="absolute flex flex-col overflow-y-auto bg-background"
        style={SCREEN_INSET}
      >
        {/* WhatsApp's own chat header for this contact. Sized well below
            the app's normal type scale — at the mockup's actual rendered
            width (~190px of screen), the smallest shared Typography step
            still reads oversized for a phone UI. */}
        <div className="flex items-center gap-1.5 border-b px-2.5 py-1.5">
          <IconChevronLeft className="size-3.5 shrink-0 text-muted-foreground" />
          <Avatar size="sm">
            <AvatarFallback className="text-[10px] font-medium">
              {(accountName || "W").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-[11px] leading-tight font-semibold">
                {accountName || "WhatsApp Business"}
              </span>
              {isVerified && (
                <IconRosetteDiscountCheckFilled className="size-3 shrink-0 text-emerald-500" />
              )}
            </div>
            <span className="block text-[9px] leading-tight text-muted-foreground">
              Business Account
            </span>
          </div>
        </div>

        {/* Message bubble. */}
        <div className="bg-muted/40 p-3">
          <div className="overflow-hidden rounded-lg border bg-background shadow-xs">
            {header?.format === "IMAGE" && headerImageUrl ? (
              <div className="relative aspect-video w-full bg-muted">
                <Image
                  src={headerImageUrl}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : header?.format === "VIDEO" ? (
              <div className="flex aspect-video w-full items-center justify-center bg-muted">
                <IconVideo className="size-6 text-muted-foreground" />
              </div>
            ) : header?.format === "DOCUMENT" ? (
              <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
                <IconFileText className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  Document attached
                </span>
              </div>
            ) : header?.format === "TEXT" && header.text ? (
              <div className="px-3 pt-3">
                <p className="text-[11px] font-medium">{header.text}</p>
              </div>
            ) : null}

            {body?.text ? (
              <div className="flex flex-col gap-1 p-3">
                <p className="text-[11px] leading-snug whitespace-pre-wrap">
                  {previewBodyText(body)}
                </p>
                <div className="flex items-end justify-end gap-2">
                  {footer?.text ? (
                    <span className="mr-auto text-[9px] text-muted-foreground">
                      {footer.text}
                    </span>
                  ) : null}
                  <span className="shrink-0 text-[9px] text-muted-foreground">
                    {previewTime}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3">
                <p className="text-[11px] text-muted-foreground italic">
                  Body text will appear here…
                </p>
              </div>
            )}

            {buttons?.buttons?.length ? (
              <div className="flex flex-col divide-y border-t">
                {buttons.buttons.map((btn, index) => {
                  const Icon = buttonIcon(btn.type);
                  const content = (
                    <>
                      <Icon className="size-3.5" />
                      {btn.text || "Button"}
                    </>
                  );
                  if (btn.type === "URL" && btn.url) {
                    return (
                      <a
                        key={index}
                        href={btn.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClassName}
                      >
                        {content}
                      </a>
                    );
                  }
                  if (btn.type === "PHONE_NUMBER" && btn.phone_number) {
                    return (
                      <a
                        key={index}
                        href={`tel:${btn.phone_number}`}
                        className={buttonClassName}
                      >
                        {content}
                      </a>
                    );
                  }
                  return (
                    <button
                      key={index}
                      type="button"
                      disabled
                      className={cn(buttonClassName, "cursor-default")}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {/* Frame overlay — pointer-events-none so clicks/scroll pass through
          to the real content sitting behind it. */}
      <Image
        src="/iPhone-outline.png"
        alt=""
        fill
        className="pointer-events-none absolute inset-0 select-none"
      />
    </div>
  );
}
