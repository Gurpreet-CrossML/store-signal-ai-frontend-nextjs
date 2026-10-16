import {
  IconAlertCircle,
  IconClock,
  IconFileText,
  IconLink,
  IconMessageQuestion,
  IconTag,
  IconCircleCheck,
  IconShieldCheck,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import type {
  AIScope,
  KnowledgeItem,
  KnowledgeSource,
  KnowledgeStatus,
  KnowledgeType,
  PolicyType,
} from "@/redux/api-slice/knowledge-rag-slice";
import {
  AI_SCOPE_META,
  KNOWLEDGE_SOURCE_ICON,
  KNOWLEDGE_STATUS_META,
  KNOWLEDGE_TYPE_META,
  POLICY_TYPE_OPTIONS,
} from "@/components/custom/knowledge/knowledge-meta";

const STATUS_ICON: Record<KnowledgeStatus, React.ReactNode> = {
  completed: <IconCircleCheck className="size-3.5" />,
  pending: <IconClock className="size-3.5" />,
  processing: <Spinner className="size-3.5" />,
  failed: <IconAlertCircle className="size-3.5" />,
};

export function KnowledgeStatusBadge({ status }: { status: KnowledgeStatus }) {
  const { label, variant } = KNOWLEDGE_STATUS_META[status];

  return (
    <Badge
      variant={variant}
      className={cn(
        "gap-1 rounded-full font-normal",
        status === "completed" && BADGE_TONE_STYLES.success,
      )}
    >
      {STATUS_ICON[status]}
      {label}
    </Badge>
  );
}

export function PolicyTypeBadge({ policyType }: { policyType: PolicyType }) {
  const label =
    POLICY_TYPE_OPTIONS.find((option) => option.value === policyType)?.label ??
    policyType;

  return (
    <Badge variant="outline" className="gap-1 font-normal">
      <IconShieldCheck className="size-3.5" />
      {label}
    </Badge>
  );
}

export function AIScopeBadges({ scope }: { scope: AIScope[] }) {
  if (scope.length === 0) {
    return <span className="text-xs text-muted-foreground">No AI scope</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {scope.map((entry) => (
        <Badge
          key={entry}
          variant="outline"
          className={cn(
            "font-normal",
            BADGE_TONE_STYLES[AI_SCOPE_META[entry].tone],
          )}
        >
          {AI_SCOPE_META[entry].label}
        </Badge>
      ))}
    </div>
  );
}

export function KnowledgeSourceIcon({
  source,
  className,
}: {
  source: KnowledgeSource;
  className?: string;
}) {
  const Icon = KNOWLEDGE_SOURCE_ICON[source];
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-4.5" />
    </div>
  );
}

export function KnowledgeTypeIcon({
  type,
  className,
}: {
  type: KnowledgeType;
  className?: string;
}) {
  const meta = KNOWLEDGE_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg",
        BADGE_TONE_STYLES[meta.tone],
        className,
      )}
    >
      <Icon className="size-4.5" />
    </div>
  );
}

const EXTENSION_COLORS: Record<string, string> = {
  pdf: "bg-red-600",
  doc: "bg-blue-600",
  docx: "bg-blue-600",
  xls: "bg-green-600",
  xlsx: "bg-green-600",
  ods: "bg-green-600",
  csv: "bg-emerald-600",
  ppt: "bg-orange-600",
  pptx: "bg-orange-600",
  json: "bg-slate-600",
  txt: "bg-slate-500",
  png: "bg-violet-600",
  jpg: "bg-violet-600",
  jpeg: "bg-violet-600",
};

/** Uppercase-able file extension of an uploaded item, from its name, URL or MIME type. */
function fileExtension(item: KnowledgeItem): string | null {
  const fromName = (value?: string) => {
    const path = value?.split(/[?#]/)[0] ?? "";
    const match = /\.([a-z0-9]{1,5})$/i.exec(path);
    return match ? match[1].toLowerCase() : null;
  };
  return (
    fromName(item.fileName) ??
    fromName(item.fileUrl) ??
    fromName(item.title) ??
    (item.fileType?.includes("/")
      ? (item.fileType.split("/").pop()?.split(/[.+]/).pop() ?? null)
      : (item.fileType?.toLowerCase() ?? null))
  );
}

/**
 * Icon for a knowledge item by its source: a document for uploads (with a
 * coloured file-extension tag on the corner), a link for URLs, a question
 * mark for FAQs.
 */
export function KnowledgeItemIcon({ item }: { item: KnowledgeItem }) {
  const isFile = item.source === "file";
  const extension = isFile ? fileExtension(item) : null;
  const Icon =
    item.source === "url"
      ? IconLink
      : item.source === "faq"
        ? IconMessageQuestion
        : IconFileText;
  const tone =
    item.source === "url"
      ? "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300"
      : item.source === "faq"
        ? "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300"
        : "bg-muted text-muted-foreground";

  return (
    <div
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center rounded-xl",
        tone,
      )}
    >
      <Icon className="size-5" />
      {extension && (
        <span
          className={cn(
            "absolute -bottom-1.5 -right-1.5 rounded px-1 text-[9px] font-semibold uppercase leading-4 text-white",
            EXTENSION_COLORS[extension] ?? "bg-slate-500",
          )}
        >
          {extension}
        </span>
      )}
    </div>
  );
}

export function ProductTag({ name }: { name: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
      <IconTag className="size-3 shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  );
}
