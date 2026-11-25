import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const typographyVariants = cva("", {
  variants: {
    variant: {
      h1: "scroll-m-20 font-heading text-4xl font-extrabold tracking-tight text-balance",
      h2: "scroll-m-20 font-heading text-3xl font-semibold tracking-tight",
      h3: "scroll-m-20 font-heading text-2xl font-semibold tracking-tight",
      h4: "scroll-m-20 font-heading text-xl font-semibold tracking-tight",
      h5: "scroll-m-20 font-heading text-lg font-semibold tracking-tight",
      h6: "scroll-m-20 font-heading text-base font-semibold tracking-tight",
      p: "text-base leading-7",
      lead: "text-md text-muted-foreground",
      large: "text-lg font-semibold",
      medium: "text-md font-medium",
      small: "text-sm leading-none font-medium",
      muted: "text-sm text-muted-foreground",
      // The smallest step in the scale, for the text that annotates
      // something else: timestamps, counts, a field's units. Added because
      // its absence was pushing every one of those onto a raw
      // `text-xs text-muted-foreground` span.
      caption: "text-xs text-muted-foreground",
      code: "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
      blockquote: "border-l-2 pl-6 italic",
      list: "ml-6 list-disc [&>li]:mt-2",
    },
  },
  defaultVariants: {
    variant: "p",
  },
});

type TypographyVariant = NonNullable<
  VariantProps<typeof typographyVariants>["variant"]
>;

const defaultElements: Record<TypographyVariant, React.ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  p: "p",
  lead: "p",
  large: "div",
  medium: "span",
  small: "small",
  muted: "p",
  caption: "span",
  code: "code",
  blockquote: "blockquote",
  list: "ul",
};

function Typography({
  className,
  variant = "p",
  as,
  asChild = false,
  ...props
}: React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof typographyVariants> & {
    as?: React.ElementType;
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : (as ?? defaultElements[variant ?? "p"]);

  return (
    <Comp
      data-slot="typography"
      data-variant={variant}
      className={cn(typographyVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Typography, typographyVariants };
