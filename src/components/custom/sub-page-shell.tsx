import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

import { PageHeading } from "@/components/custom/page-heading";
import { Button } from "@/components/ui/button";

/**
 * Shared shell for sub-pages of a multi-screen area: back navigation to the
 * area's menu and a consistent page header. Used by /settings/* and
 * /knowledge/* so both areas feel identical.
 */
export default function SubPageShell({
  backHref,
  backLabel,
  title,
  description,
  children,
}: {
  /**
   * Back link to the area's menu. Omit it in areas that have a sub-sidebar
   * — the sibling pages are already listed there, so the arrow is a second
   * way to do something the nav is doing better.
   */
  backHref?: string;
  backLabel?: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-start gap-3">
        {backHref && (
          <Button variant="ghost" size="icon-sm" asChild aria-label={backLabel}>
            <Link href={backHref}>
              <IconArrowLeft />
            </Link>
          </Button>
        )}
        <PageHeading title={title} description={description} />
      </div>
      {children}
    </div>
  );
}
