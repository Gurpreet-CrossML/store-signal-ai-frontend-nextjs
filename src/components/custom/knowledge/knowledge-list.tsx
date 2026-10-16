"use client";

import Link from "next/link";
import {
  IconBooks,
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  KnowledgeItemIcon,
  ProductTag,
  PolicyTypeBadge,
} from "@/components/custom/knowledge/knowledge-badges";
import {
  KNOWLEDGE_SOURCE_LABEL,
  KNOWLEDGE_TYPE_META,
} from "@/components/custom/knowledge/knowledge-meta";

/** Counts of linked products / categories / collections, e.g. "3 products". */
function associationCounts(item: KnowledgeItem): string[] {
  const entries: [number | undefined, string, string][] = [
    [item.products?.length, "product", "products"],
    [item.categories?.length, "category", "categories"],
    [item.collections?.length, "collection", "collections"],
  ];
  return entries
    .filter(([count]) => count)
    .map(([count, one, many]) => `${count} ${count === 1 ? one : many}`);
}

export function KnowledgeList({
  items,
  isLoading,
  onOpenItem,
  onEditItem,
  onDelete,
  hasFilters,
  canEdit,
}: {
  items: KnowledgeItem[];
  isLoading: boolean;
  onOpenItem: (item: KnowledgeItem) => void;
  onEditItem: (item: KnowledgeItem) => void;
  onDelete: (item: KnowledgeItem) => void;
  hasFilters: boolean;
  /** False for a read-only role: no add, edit or delete controls. */
  canEdit: boolean;
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
        {!hasFilters && canEdit && (
          <EmptyContent>
            <Button size="sm" asChild>
              <Link href="/knowledge/library/new">
                <IconPlus className="size-4" />
                Add Knowledge
              </Link>
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Name
            </TableHead>
            <TableHead className="hidden h-10 text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
              Type
            </TableHead>
            <TableHead className="hidden h-10 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
              Used by
            </TableHead>
            <TableHead className="h-10 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </TableHead>
            <TableHead className="hidden h-10 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
              Updated
            </TableHead>
            <TableHead className="h-10 w-12 px-4">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const meta = KNOWLEDGE_TYPE_META[item.type];
            const counts = associationCounts(item);
            return (
              <TableRow
                key={item.id}
                tabIndex={0}
                onClick={() => onOpenItem(item)}
                onKeyDown={(event) => {
                  if (
                    (event.key === "Enter" || event.key === " ") &&
                    event.target === event.currentTarget
                  ) {
                    event.preventDefault();
                    onOpenItem(item);
                  }
                }}
                className="cursor-pointer"
              >
                <TableCell className="w-full max-w-0 px-4 py-3 sm:w-[40%]">
                  <div className="flex items-center gap-3">
                    <KnowledgeItemIcon item={item} />
                    <div className="min-w-0 flex-1">
                      <Typography
                        variant="small"
                        as="p"
                        className="truncate font-medium"
                        title={item.title}
                      >
                        {item.title}
                      </Typography>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Badge
                          variant="secondary"
                          className="h-4 rounded px-1.5 text-[10px] font-medium"
                          title="Knowledge source"
                        >
                          {KNOWLEDGE_SOURCE_LABEL[item.source]}
                        </Badge>
                        {item.policyType && (
                          <PolicyTypeBadge policyType={item.policyType} />
                        )}
                        {counts.length > 0 && (
                          <ProductTag name={counts.join(" · ")} />
                        )}
                        <span className="md:hidden">· {meta.label}</span>
                      </div>
                      {item.status === "failed" && item.processingError && (
                        <p
                          className="mt-1 truncate text-xs text-destructive"
                          title={item.processingError}
                        >
                          {item.processingError}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="hidden text-muted-foreground md:table-cell">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
                    <meta.icon className="size-4" />
                    {meta.label}
                  </span>
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  <AIScopeBadges scope={item.aiScope} />
                </TableCell>

                <TableCell>
                  <KnowledgeStatusBadge status={item.status} />
                </TableCell>

                <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground sm:table-cell">
                  {formatRelativeTime(item.updatedAt)} ago
                </TableCell>

                <TableCell className="px-4 text-right">
                  {canEdit && (
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
                        {item.status === "completed" ? (
                          <DropdownMenuItem onClick={() => onEditItem(item)}>
                            <IconPencil />
                            Edit
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="opacity-50 cursor-not-allowed"
                            onClick={(e) => e.preventDefault()}
                            title="Only completed items can be edited"
                          >
                            <IconPencil />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {item.status === "processing" ? (
                          <DropdownMenuItem
                            variant="destructive"
                            className="opacity-50 cursor-not-allowed"
                            onClick={(e) => e.preventDefault()}
                            title="Item is in progress and cannot be deleted"
                          >
                            <IconTrash />
                            Delete
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onDelete(item)}
                          >
                            <IconTrash />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
