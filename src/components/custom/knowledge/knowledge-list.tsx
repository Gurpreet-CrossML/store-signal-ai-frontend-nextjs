"use client";

import {
  IconBooks,
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconPower,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Typography } from "@/components/ui/typography";
import { LoadingState } from "@/components/custom/loading-state";
import { formatRelativeTime } from "@/lib/helpers";
import type { KnowledgeItem } from "@/redux/api-slice/knowledge-rag-slice";
import {
  AIScopeBadges,
  KnowledgeStatusBadge,
  KnowledgeTypeIcon,
  PolicyTypeBadge,
} from "@/components/custom/knowledge/knowledge-badges";
import {
  KNOWLEDGE_SOURCE_LABEL,
  KNOWLEDGE_TYPE_META,
} from "@/components/custom/knowledge/knowledge-meta";

/** The short second line under an item's title, varying by knowledge type. */
function itemSubtitle(item: KnowledgeItem): string | null {
  switch (item.type) {
    case "product":
      return item.productName ?? null;
    // case "category":
    //   return item.categoryNames?.join(", ") ?? null;
    // case "policy":
    //   return item.url ?? null;
    // case "document":
    // case "google_drive":
    //   return item.fileName ?? null;
    // case "offer":
    //   return item.couponCode ? `Code: ${item.couponCode}` : null;
    default:
      return null;
  }
}

export function KnowledgeList({
  items,
  isLoading,
  onOpenItem,
  onEditItem,
  onToggleStatus,
  onRetry,
  onDelete,
  onAddKnowledge,
  hasFilters,
}: {
  items: KnowledgeItem[];
  isLoading: boolean;
  onOpenItem: (item: KnowledgeItem) => void;
  onEditItem: (item: KnowledgeItem) => void;
  onToggleStatus: (item: KnowledgeItem) => void;
  onRetry: (item: KnowledgeItem) => void;
  onDelete: (item: KnowledgeItem) => void;
  onAddKnowledge: () => void;
  hasFilters: boolean;
}) {
  if (isLoading) {
    return <LoadingState label="Loading knowledge…" />;
  }

  if (items.length === 0) {
    return (
      <Empty className="rounded-xl border border-dashed border-border/70">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconBooks />
          </EmptyMedia>
          <EmptyTitle>
            {hasFilters
              ? "No knowledge matches your filters"
              : "No knowledge yet"}
          </EmptyTitle>
          <EmptyDescription>
            {hasFilters
              ? "Try clearing a filter or searching for something else."
              : "Add general info, product & category knowledge, FAQs, policies, documents, or offers so the AI can answer from it."}
          </EmptyDescription>
        </EmptyHeader>
        {!hasFilters && (
          <EmptyContent>
            <Button size="sm" onClick={onAddKnowledge}>
              <IconPlus className="size-4" />
              Add Knowledge
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const meta = KNOWLEDGE_TYPE_META[item.type];
        const subtitle = itemSubtitle(item);
        return (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpenItem(item)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onOpenItem(item);
            }}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-card p-3 transition-colors hover:border-border hover:bg-muted/40"
          >
            <KnowledgeTypeIcon type={item.type} />

            <div className="min-w-0 flex-1">
              <Typography
                variant="small"
                as="p"
                className="truncate font-medium"
              >
                {item.title}
              </Typography>
              <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                <span>{meta.label}</span>
                <span aria-hidden>·</span>
                <span>{KNOWLEDGE_SOURCE_LABEL[item.source]}</span>
                {subtitle && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="truncate">{subtitle}</span>
                  </>
                )}
                <span aria-hidden>·</span>
                <span>Updated {formatRelativeTime(item.updatedAt)} ago</span>
              </div>
              {item.status === "failed" && item.processingError && (
                <p className="mt-1 truncate text-xs text-destructive">
                  {item.processingError}
                </p>
              )}
            </div>

            <div className="hidden shrink-0 md:block">
              <AIScopeBadges scope={item.aiScope} />
            </div>

            {item.policyType && (
              <div className="hidden shrink-0 sm:block">
                <PolicyTypeBadge policyType={item.policyType} />
              </div>
            )}

            <div className="shrink-0">
              <KnowledgeStatusBadge status={item.status} />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Knowledge actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(event) => event.stopPropagation()}
              >
                <DropdownMenuItem onClick={() => onEditItem(item)}>
                  <IconPencil />
                  Edit
                </DropdownMenuItem>
                {(item.status === "active" || item.status === "disabled") && (
                  <DropdownMenuItem onClick={() => onToggleStatus(item)}>
                    <IconPower />
                    {item.status === "disabled" ? "Enable" : "Disable"}
                  </DropdownMenuItem>
                )}
                {item.status === "failed" && (
                  <DropdownMenuItem onClick={() => onRetry(item)}>
                    <IconRefresh />
                    Retry Processing
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(item)}
                >
                  <IconTrash />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
}
