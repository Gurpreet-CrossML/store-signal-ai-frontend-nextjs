import {
  IconAlertCircle,
  IconArticle,
  IconClock,
  IconFileText,
  IconLink,
  IconMessageQuestion,
  IconCircleCheck,
  IconFilePencil,
  IconShieldCheck,
  type Icon,
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
  draft: <IconFilePencil className="size-3.5" />,
  published: <IconCircleCheck className="size-3.5" />,
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
        status === "published" && BADGE_TONE_STYLES.success,
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

function AIScopeBadge({ entry, nowrap }: { entry: AIScope; nowrap: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-normal",
        nowrap && "shrink-0 whitespace-nowrap",
        BADGE_TONE_STYLES[AI_SCOPE_META[entry].tone],
      )}
    >
      {AI_SCOPE_META[entry].label}
    </Badge>
  );
}

/** `nowrap` keeps every chip on one line, for a table cell that scrolls sideways. */
export function AIScopeBadges({
  scope,
  nowrap = false,
}: {
  scope: AIScope[];
  nowrap?: boolean;
}) {
  if (scope.length === 0) {
    return <span className="text-xs text-muted-foreground">No AI scope</span>;
  }
  return (
    <div className={cn("flex gap-1", nowrap ? "flex-nowrap" : "flex-wrap")}>
      {scope.map((entry) => (
        <AIScopeBadge key={entry} entry={entry} nowrap={nowrap} />
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

/** Lower-case file extension of an uploaded item, from its name, URL or MIME type. */
export function fileExtension(item: KnowledgeItem): string | null {
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

/** Icon and colours for each kind of knowledge item, shown at the start of its list row. */
const ITEM_ICON: Record<string, { Icon: Icon; tone: string }> = {
  article: {
    Icon: IconArticle,
    tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  },
  file: {
    Icon: IconFileText,
    tone: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  },
  url: {
    Icon: IconLink,
    tone: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
  },
  faq: {
    Icon: IconMessageQuestion,
    tone: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
  },
};

/** Icon for a knowledge item by its source: article, document, link or question mark. */
export function KnowledgeItemIcon({ item }: { item: KnowledgeItem }) {
  const { Icon, tone } = ITEM_ICON[item.source] ?? {
    Icon: IconFileText,
    tone: "bg-muted text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg",
        tone,
      )}
    >
      <Icon className="size-4.5" />
    </div>
  );
}
