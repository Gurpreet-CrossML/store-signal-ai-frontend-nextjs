import Link from "next/link";
import { IconMessage2, IconPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

/** The buttons beside the Knowledge heading: test the AI, and add knowledge. */
export function KnowledgeHeadingActions({
  showTest,
  canEdit,
}: {
  /** Hidden while the library is empty. */
  showTest: boolean;
  canEdit: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Placeholder: not wired to anything yet. */}
      {showTest && (
        <Button type="button" variant="outline" size="sm">
          <IconMessage2 className="size-4" />
          <span className="sm:hidden">Test</span>
          <span className="max-sm:hidden">Test Your AI</span>
        </Button>
      )}
      {canEdit && (
        <Button size="sm" asChild>
          <Link href="/knowledge/new">
            <IconPlus className="size-4" />
            <span className="sm:hidden">Add</span>
            <span className="max-sm:hidden">Add Knowledge</span>
          </Link>
        </Button>
      )}
    </div>
  );
}
