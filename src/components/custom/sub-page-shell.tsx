import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

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
  backHref: string;
  backLabel: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon-sm" asChild aria-label={backLabel}>
          <Link href={backHref}>
            <IconArrowLeft />
          </Link>
        </Button>
        <div>
          <Typography variant="h4" as="h2">
            {title}
          </Typography>
          <Typography variant="muted">{description}</Typography>
        </div>
      </div>
      {children}
    </div>
  );
}
