import { Skeleton } from "@/components/ui/skeleton";
import type {
  KnowledgeCounts,
  KnowledgeVectorStorage,
} from "@/redux/api-slice/knowledge-rag-slice";

type Segment = {
  key: keyof KnowledgeVectorStorage & keyof KnowledgeCounts;
  label: string;
  /** Tailwind background colour of the bar segment and legend dot. */
  color: string;
  /** Shown even at 0 bytes; the rest only appear once they use storage. */
  alwaysShow?: boolean;
};

// Order is the order along the bar.
const SEGMENTS: Segment[] = [
  {
    key: "products",
    label: "Shopify Products",
    color: "bg-green-600",
    alwaysShow: true,
  },
  {
    key: "documents",
    label: "Documents",
    color: "bg-violet-600",
    alwaysShow: true,
  },
  {
    key: "urls",
    label: "Website Pages",
    color: "bg-blue-600",
    alwaysShow: true,
  },
  { key: "faqs", label: "Q&A", color: "bg-orange-500", alwaysShow: true },
  {
    key: "articles",
    label: "Articles",
    color: "bg-teal-500",
    alwaysShow: true,
  },
];

/**
 * A size such as "13.9 MB", without a trailing ".0" ("100 MB", not "100.0 MB").
 * It rounds down, so a store with a little space left never reads "14 MB of
 * 14 MB used", and it agrees with a percentage that is also rounded down.
 */
export function formatSize(bytes: number) {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = Math.floor((bytes / Math.pow(1024, exponent)) * 10) / 10;
  return `${exponent === 0 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, "")} ${units[exponent]}`;
}

/**
 * How much of the plan's vector storage this store has used, as a bar split
 * by kind of knowledge, with what is left over shown as "Free". Each kind
 * also shows how many items it has, e.g. "Shopify Products 11.6 MB (1,175)".
 */
export function KnowledgeStorageCard({
  storage,
  counts,
}: {
  storage: KnowledgeVectorStorage | null;
  counts: KnowledgeCounts | null;
}) {
  if (!storage) {
    return <Skeleton className="h-[88px] w-full rounded-xl" />;
  }

  // Never let the bar overflow if usage has gone past the limit.
  const scale = Math.max(storage.limit, storage.total, 1);
  const segments = SEGMENTS.filter(
    ({ key, alwaysShow }) => alwaysShow || storage[key] > 0,
  );

  return (
    <section
      aria-label="Knowledge storage"
      className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold">Knowledge Storage</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {formatSize(storage.total)}
          </span>{" "}
          of {formatSize(storage.limit)} used
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={storage.limit}
        aria-valuenow={Math.min(storage.total, storage.limit)}
        className="flex h-2 w-full gap-px overflow-hidden rounded-full bg-muted"
      >
        {segments.map(({ key, color }) =>
          storage[key] > 0 ? (
            <div
              key={key}
              className={color}
              style={{ width: `${(storage[key] / scale) * 100}%` }}
            />
          ) : null,
        )}
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:flex sm:flex-wrap sm:items-center sm:gap-y-1">
        {segments.map(({ key, label, color }) => (
          <li key={key} className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${color}`} />
            {label}
            <span>
              {formatSize(storage[key])}
              {counts && ` (${counts[key].toLocaleString()})`}
            </span>
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground/25" />
          Free
          <span>{formatSize(storage.remaining)}</span>
        </li>
      </ul>
    </section>
  );
}
