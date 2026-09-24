import {
  IconAlertCircle,
  IconClock,
  IconCircleCheck,
  IconShieldCheck,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import type {
  AIScope,
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
    <Badge variant={variant} className="gap-1 font-normal">
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
