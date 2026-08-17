"use client";

import { useState } from "react";
import { IconExternalLink, IconPencil, IconRefresh, IconTrash } from "@tabler/icons-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { formatDateTime } from "@/lib/helpers";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  DeleteKnowledgeItem,
  RetryKnowledgeItemProcessing,
  type KnowledgeItem,
} from "@/redux/api-slice/knowledge-rag-slice";
import {
  AIScopeBadges,
  KnowledgeStatusBadge,
  KnowledgeTypeIcon,
} from "@/components/custom/knowledge/knowledge-badges";
import {
  KNOWLEDGE_SOURCE_LABEL,
  KNOWLEDGE_TYPE_META,
  POLICY_TYPE_OPTIONS,
} from "@/components/custom/knowledge/knowledge-meta";

function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Typography
        variant="muted"
        as="p"
        className="text-xs font-semibold tracking-wide uppercase"
      >
        {title}
      </Typography>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

export function KnowledgeDetailSheet({
  item,
  open,
  onOpenChange,
  onEdit,
  onDeleted,
}: {
  item: KnowledgeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (item: KnowledgeItem) => void;
  onDeleted: () => void;
}) {
  const dispatch = useAppDispatch();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { RetryKnowledgeItemProcessingIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.RetryKnowledgeItemProcessingState,
  );
  const { DeleteKnowledgeItemIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.DeleteKnowledgeItemState,
  );

  if (!item) return null;
  const meta = KNOWLEDGE_TYPE_META[item.type];

  const handleRetry = async () => {
    await dispatch(RetryKnowledgeItemProcessing({ id: item.id }));
  };

  const handleDelete = async () => {
    const result = await dispatch(DeleteKnowledgeItem({ id: item.id }));
    if (DeleteKnowledgeItem.fulfilled.match(result)) {
      setConfirmDelete(false);
      onOpenChange(false);
      onDeleted();
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="gap-0 sm:max-w-lg">
          <SheetHeader>
            <div className="flex items-start gap-3">
              <KnowledgeTypeIcon type={item.type} className="size-11 rounded-xl" />
              <div className="min-w-0 flex-1">
                <SheetTitle className="truncate">{item.title}</SheetTitle>
                <SheetDescription>
                  {meta.label} · {KNOWLEDGE_SOURCE_LABEL[item.source]}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
            {item.status === "failed" && (
              <div className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
                <div className="min-w-0">
                  <Typography variant="small" as="p" className="font-medium text-destructive">
                    Processing failed
                  </Typography>
                  {item.processingError && (
                    <Typography variant="muted" className="text-xs text-destructive/90">
                      {item.processingError}
                    </Typography>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={handleRetry}
                  disabled={RetryKnowledgeItemProcessingIsLoading}
                >
                  {RetryKnowledgeItemProcessingIsLoading ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <IconRefresh data-icon="inline-start" />
                  )}
                  Retry Processing
                </Button>
              </div>
            )}

            <Section title="Basic information">
              <MetaRow label="Knowledge type" value={meta.label} />
              <MetaRow label="Source" value={KNOWLEDGE_SOURCE_LABEL[item.source]} />
              <MetaRow label="Status" value={<KnowledgeStatusBadge status={item.status} />} />
              <MetaRow label="Created" value={formatDateTime(item.createdAt)} />
              <MetaRow label="Updated" value={formatDateTime(item.updatedAt)} />
            </Section>

            <Separator />

            <Section title="Associations">
              {item.productName && <MetaRow label="Product" value={item.productName} />}
              {item.categoryNames && item.categoryNames.length > 0 && (
                <MetaRow label="Categories" value={item.categoryNames.join(", ")} />
              )}
              <div className="flex items-center justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0">
                <span className="text-muted-foreground">AI scope</span>
                <AIScopeBadges scope={item.aiScope} />
              </div>
              <div className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="text-muted-foreground">Tags</span>
                <div className="flex flex-wrap justify-end gap-1">
                  {item.tags.length > 0 ? (
                    item.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="font-normal">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </Section>

            <Separator />

            <Section title="Source information">
              {(item.type === "general" || item.content) && item.content && (
                <p className="whitespace-pre-wrap py-2 text-sm text-foreground">
                  {item.content}
                </p>
              )}

              {item.type === "faq" && (
                <>
                  <div className="py-2">
                    <Typography variant="muted" className="text-xs">
                      Question
                    </Typography>
                    <p className="text-sm font-medium">{item.question}</p>
                  </div>
                  <div className="py-2">
                    <Typography variant="muted" className="text-xs">
                      Answer
                    </Typography>
                    <p className="text-sm">{item.answer}</p>
                  </div>
                </>
              )}

              {item.type === "policy" && (
                <>
                  <MetaRow
                    label="Policy type"
                    value={
                      POLICY_TYPE_OPTIONS.find((option) => option.value === item.policyType)
                        ?.label ?? item.policyType
                    }
                  />
                  <div className="flex items-center justify-between gap-4 border-b border-border py-2 text-sm">
                    <span className="text-muted-foreground">Source URL</span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex max-w-56 items-center gap-1 truncate font-medium text-primary underline underline-offset-2"
                    >
                      <span className="truncate">{item.url}</span>
                      <IconExternalLink className="size-3.5 shrink-0" />
                    </a>
                  </div>
                  <MetaRow label="Last synced" value={formatDateTime(item.lastSyncedAt ?? null)} />
                  <MetaRow label="Next sync" value={formatDateTime(item.nextSyncAt ?? null)} />
                </>
              )}

              {(item.type === "document" || item.type === "google_drive") && (
                <>
                  <MetaRow label="File name" value={item.fileName ?? "—"} />
                  <MetaRow label="File type" value={(item.fileType ?? "—").toUpperCase()} />
                  {item.type === "document" && (
                    <MetaRow label="File size" value={formatBytes(item.fileSize)} />
                  )}
                  {item.type === "google_drive" && item.driveUrl && (
                    <div className="flex items-center justify-between gap-4 border-b border-border py-2 text-sm">
                      <span className="text-muted-foreground">Drive URL</span>
                      <a
                        href={item.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex max-w-56 items-center gap-1 truncate font-medium text-primary underline underline-offset-2"
                      >
                        <span className="truncate">{item.driveUrl}</span>
                        <IconExternalLink className="size-3.5 shrink-0" />
                      </a>
                    </div>
                  )}
                  <MetaRow
                    label="Processing status"
                    value={<KnowledgeStatusBadge status={item.status} />}
                  />
                </>
              )}

              {item.type === "offer" && (
                <>
                  <MetaRow label="Coupon code" value={item.couponCode ?? "—"} />
                  <MetaRow label="Start date" value={formatDateTime(item.startDate ?? null)} />
                  <MetaRow label="End date" value={formatDateTime(item.endDate ?? null)} />
                  {item.conditions && (
                    <p className="whitespace-pre-wrap py-2 text-sm text-foreground">
                      {item.conditions}
                    </p>
                  )}
                </>
              )}
            </Section>
          </div>

          <SheetFooter className="flex-row">
            <Button variant="outline" className="flex-1" onClick={() => onEdit(item)}>
              <IconPencil />
              Edit
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <IconTrash />
              Delete
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this knowledge?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{item.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={DeleteKnowledgeItemIsLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={DeleteKnowledgeItemIsLoading}
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
            >
              {DeleteKnowledgeItemIsLoading ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
