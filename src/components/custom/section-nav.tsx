import Link from "next/link";
import { IconChevronRight, type Icon } from "@tabler/icons-react";

import { Typography } from "@/components/ui/typography";

export type SectionNavItem = {
  href: string;
  title: string;
  description: string;
  icon: Icon;
};

/**
 * The landing menu for a multi-screen area (Settings, Knowledge): full-width
 * rows with an icon, title + description, and a chevron. One component so
 * every area's menu looks identical.
 */
export function SectionNav({
  items,
  ariaLabel,
}: {
  items: SectionNavItem[];
  ariaLabel: string;
}) {
  return (
    <nav aria-label={ariaLabel} className="flex flex-col gap-3">
      {items.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className="group flex w-full items-center gap-4 rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/10 transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <section.icon className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Typography variant="h6" as="h3">
              {section.title}
            </Typography>
            <Typography variant="muted" className="truncate">
              {section.description}
            </Typography>
          </div>
          <IconChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}
    </nav>
  );
}
