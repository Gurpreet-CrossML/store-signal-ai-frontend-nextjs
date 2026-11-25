import Link from "next/link";
import { IconMessage2, IconPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { KNOWLEDGE_TEST_AI_HREF } from "@/lib/config";

/** The buttons beside the Knowledge heading: open the Test AI page, and add knowledge. */
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
      {showTest && (
        <Button variant="outline" size="sm" asChild>
          <Link href={KNOWLEDGE_TEST_AI_HREF}>
            <IconMessage2 className="size-4" />
            Test AI
          </Link>
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
