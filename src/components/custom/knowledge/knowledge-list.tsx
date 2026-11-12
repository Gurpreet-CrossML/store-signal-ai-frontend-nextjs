"use client";

import Link from "next/link";
import {
  IconBooks,
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconSend,
  IconTrash,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import type { KnowledgeItem } from "@/redux/api-slice/knowledge-rag-slice";
import { formatBytes } from "@/components/custom/knowledge/file-upload-dropzone";
import {
  fileExtension,
  KnowledgeItemIcon,
  KnowledgeStatusBadge,
} from "@/components/custom/knowledge/knowledge-badges";
import {
  AI_SCOPE_META,
  isKnowledgeItemEditable,
} from "@/components/custom/knowledge/knowledge-meta";

const FILE_TYPE_LABEL: Record<string, string> = {
  doc: "Word",
  docx: "Word",
  odt: "Word",
  xls: "Excel",
  xlsx: "Excel",
  ods: "Excel",
  ppt: "PowerPoint",
  pptx: "PowerPoint",
};

/** Whether a row can be ticked for a bulk action: not while it is being processed. */
export function isKnowledgeItemSelectable(item: KnowledgeItem) {
  return item.status !== "processing";
}

/** Words in an article's rich-text HTML. */
function wordCount(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/** The line under a row's title: what kind of item it is and how big or where from. */
function itemSubtitle(item: KnowledgeItem): string {
  switch (item.source) {
    case "article": {
      const words = wordCount(item.content ?? "");
      return `Article · ${words} ${words === 1 ? "word" : "words"}`;
    }
    case "file": {
      const extension = fileExtension(item);
      const type = extension
        ? (FILE_TYPE_LABEL[extension] ?? extension.toUpperCase())
        : "File";
      return item.fileSize
        ? `${type} · ${formatBytes(item.fileSize).replace(".0 ", " ")}`
        : type;
    }
    case "url": {
      try {
        const { host, pathname } = new URL(item.url ?? "");
        return `${host}${pathname === "/" ? "" : pathname}`;
      } catch {
        return item.url ?? "Website page";
      }
    }
    case "faq":
      return "Question & answer";
    default:
      return "Knowledge";
  }
}

/** What an item is about: the whole store, or the first product/category/collection it is tied to. */
function appliesTo(item: KnowledgeItem): string {
  const groups: [string, string[]][] = [
    ["Category", item.categories?.map((entry) => entry.name) ?? []],
    ["Collection", item.collections?.map((entry) => entry.name) ?? []],
    ["Product", item.products?.map((entry) => entry.name) ?? []],
  ];
  const total = groups.reduce((sum, [, names]) => sum + names.length, 0);
  const first = groups.find(([, names]) => names.length > 0);

  if (item.type === "general" || !first) return "Whole store";

  const [label, names] = first;
  return `${label} · ${names[0]}${total > 1 ? ` +${total - 1}` : ""}`;
}

/** "Just now", "12 min ago", "Yesterday", "2 weeks ago". */
function timeAgo(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;

  return date.toLocaleDateString();
}

export function KnowledgeList({
  items,
  isLoading,
  onOpenItem,
  onEditItem,
  onPublish,
  onDelete,
  hasFilters,
  canEdit,
  selectedIds,
  onToggleItem,
  onToggleAll,
}: {
  items: KnowledgeItem[];
  isLoading: boolean;
  onOpenItem: (item: KnowledgeItem) => void;
  onEditItem: (item: KnowledgeItem) => void;
  /** Publish a draft; only offered on draft rows. */
  onPublish: (item: KnowledgeItem) => void;
  onDelete: (item: KnowledgeItem) => void;
  hasFilters: boolean;
  /** False for a read-only role: no add, edit, delete or select controls. */
  canEdit: boolean;
  /** Ids of the rows ticked for a bulk action. */
  selectedIds: Set<string>;
  onToggleItem: (item: KnowledgeItem) => void;
  /** Tick (or untick) every selectable row on this page. */
  onToggleAll: (checked: boolean) => void;
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
              <Link href="/knowledge/new">
                <IconPlus className="size-4" />
                Add Knowledge
              </Link>
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  const selectableItems = items.filter(isKnowledgeItemSelectable);
  const selectedCount = selectableItems.filter((item) =>
    selectedIds.has(item.id),
  ).length;
  const allSelected =
    selectableItems.length > 0 && selectedCount === selectableItems.length;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      {/* Every column is always shown. A floor on the table makes the
          container scroll sideways on a narrow screen (like Catalog →
          Customers) instead of hiding columns or squeezing the Name column
          down to its icon. */}
      <Table className="min-w-4xl">
        <TableHeader>
          <TableRow>
            {canEdit && (
              <TableHead className="w-10 pl-4 pr-0">
                <Checkbox
                  checked={
                    allSelected ? true : selectedCount > 0 && "indeterminate"
                  }
                  disabled={selectableItems.length === 0}
                  onCheckedChange={(checked) => onToggleAll(checked === true)}
                  aria-label="Select all knowledge on this page"
                />
              </TableHead>
            )}
            <TableHead className={cn(!canEdit && "px-4")}>Name</TableHead>
            <TableHead>Applies to</TableHead>
            <TableHead>Used by</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last updated</TableHead>
            <TableHead className="w-12 px-4">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const scopeLabels = item.aiScope
              .map((scope) => AI_SCOPE_META[scope].label)
              .join(", ");

            return (
              <TableRow
                key={item.id}
                tabIndex={0}
                data-state={selectedIds.has(item.id) ? "selected" : undefined}
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
                className={cn(
                  "cursor-pointer",
                  item.status === "failed" &&
                    "bg-destructive/5 hover:bg-destructive/10",
                )}
              >
                {canEdit && (
                  <TableCell
                    className="w-10 pl-4 pr-0"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      disabled={!isKnowledgeItemSelectable(item)}
                      onCheckedChange={() => onToggleItem(item)}
                      aria-label={`Select ${item.title}`}
                      title={
                        isKnowledgeItemSelectable(item)
                          ? undefined
                          : "Item is in progress and cannot be selected"
                      }
                    />
                  </TableCell>
                )}

                <TableCell
                  className={cn(
                    "w-full max-w-0 min-w-52 py-3 sm:w-[40%] lg:min-w-64",
                    !canEdit && "px-4",
                  )}
                >
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
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {itemSubtitle(item)}
                      </p>
                      {item.status === "failed" && item.processingError && (
                        <p
                          className="mt-0.5 truncate text-xs text-destructive"
                          title={item.processingError}
                        >
                          {item.processingError}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {appliesTo(item)}
                </TableCell>

                <TableCell className="max-w-40 text-xs text-muted-foreground">
                  <span
                    className="block truncate"
                    title={scopeLabels || undefined}
                  >
                    {scopeLabels || "—"}
                  </span>
                </TableCell>

                <TableCell>
                  <KnowledgeStatusBadge status={item.status} />
                </TableCell>

                <TableCell className="whitespace-nowrap text-xs">
                  <p className="text-foreground">{timeAgo(item.updatedAt)}</p>
                  {item.updatedBy && (
                    <p className="text-muted-foreground">by {item.updatedBy}</p>
                  )}
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
                        {item.status === "draft" && (
                          <DropdownMenuItem onClick={() => onPublish(item)}>
                            <IconSend />
                            Publish
                          </DropdownMenuItem>
                        )}
                        {isKnowledgeItemEditable(item.status) ? (
                          <DropdownMenuItem onClick={() => onEditItem(item)}>
                            <IconPencil />
                            Edit
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="opacity-50 cursor-not-allowed"
                            onClick={(e) => e.preventDefault()}
                            title="Only draft or published items can be edited"
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
