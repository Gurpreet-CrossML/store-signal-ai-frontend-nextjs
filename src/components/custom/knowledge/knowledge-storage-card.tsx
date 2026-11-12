import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes } from "@/components/custom/knowledge/file-upload-dropzone";
import type { KnowledgeVectorStorage } from "@/redux/api-slice/knowledge-rag-slice";

type Segment = {
  key: keyof KnowledgeVectorStorage;
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
    label: "Shopify products",
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
    label: "Website pages",
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

/** `formatBytes` without a trailing ".0" ("100 MB", not "100.0 MB"). */
function formatSize(bytes: number) {
  return formatBytes(bytes).replace(".0 ", " ");
}

/**
 * How much of the plan's vector storage this store has used, as a bar split
 * by kind of knowledge, with what is left over shown as "Free".
 */
export function KnowledgeStorageCard({
  storage,
}: {
  storage: KnowledgeVectorStorage | null;
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
        <h2 className="text-sm font-semibold">Knowledge storage</h2>
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

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map(({ key, label, color }) => (
          <li key={key} className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${color}`} />
            {label}
            <span>{formatSize(storage[key])}</span>
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
