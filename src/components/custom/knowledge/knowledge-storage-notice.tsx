import { IconAlertTriangle, IconAlertOctagon } from "@tabler/icons-react";

import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type { KnowledgeVectorStorage } from "@/redux/api-slice/knowledge-rag-slice";
import { formatSize } from "@/components/custom/knowledge/knowledge-storage-card";

/** Storage used, as a share of the plan's limit, from which a warning shows. */
const WARNING_SHARE = 0.9;

/**
 * A banner for a store that is running out of vector storage: yellow from 90%
 * used, red once it is full. Shows nothing below 90%.
 */
export function KnowledgeStorageNotice({
  storage,
  className,
}: {
  storage: KnowledgeVectorStorage | null;
  className?: string;
}) {
  if (!storage || storage.limit <= 0) return null;

  const share = storage.total / storage.limit;
  if (share < WARNING_SHARE) return null;

  const isFull = storage.total >= storage.limit;
  const Icon = isFull ? IconAlertOctagon : IconAlertTriangle;
  const used = `${formatSize(storage.total)} of ${formatSize(storage.limit)}`;

  return (
    <div
      role={isFull ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        BADGE_TONE_STYLES[isFull ? "danger" : "warning"],
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-semibold">
          {isFull
            ? "Your knowledge storage is full"
            : `You've used ${Math.floor(share * 100)}% of your knowledge storage`}
        </p>
        <p className="text-xs opacity-90">
          {isFull
            ? `${used} used. New knowledge is saved as a draft and can't go live until you free up space or upgrade your plan.`
            : `${used} used. New knowledge may not fit. Remove some knowledge or upgrade your plan.`}
        </p>
      </div>
    </div>
  );
}
