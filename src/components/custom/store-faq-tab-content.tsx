"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Typography } from "@/components/ui/typography";
import { LoadingState } from "@/components/custom/loading-state";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  DeleteStoreFaq,
  FetchStoreFaqs,
  type StoreFaq,
} from "@/redux/api-slice/knowledge-slice";
import StoreFaqForm from "@/components/custom/store-faq-form";

const PAGE_SIZE = 15;

export default function StoreFaqTabContent() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { FetchStoreFaqsListData, FetchStoreFaqsIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeReducer.FetchStoreFaqsState,
  );
  const { DeleteStoreFaqIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeReducer.DeleteStoreFaqState,
  );

  const [page, setPage] = useState(1);
  const [prevStoreCode, setPrevStoreCode] = useState(storeCode);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<StoreFaq | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<StoreFaq | null>(null);

  const faqs = FetchStoreFaqsListData?.results ?? [];
  const totalCount = FetchStoreFaqsListData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const loadFaqs = (targetPage: number) => {
    if (!storeCode) return;
    dispatch(
      FetchStoreFaqs({
        store_code: storeCode,
        page: targetPage,
        limit: PAGE_SIZE,
      }),
    );
  };

  if (storeCode !== prevStoreCode) {
    setPrevStoreCode(storeCode);
    setPage(1);
  }

  useEffect(() => {
    loadFaqs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeCode, page]);

  const openCreateForm = () => {
    setEditingFaq(null);
    setFormOpen(true);
  };

  const openEditForm = (faq: StoreFaq) => {
    setEditingFaq(faq);
    setFormOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!faqToDelete) return;
    const result = await dispatch(
      DeleteStoreFaq({ store_code: storeCode, id: faqToDelete.id }),
    );
    if (DeleteStoreFaq.fulfilled.match(result)) {
      const isLastOnPage = faqs.length === 1 && page > 1;
      if (isLastOnPage) {
        setPage((prev) => prev - 1);
      } else {
        loadFaqs(page);
      }
      setFaqToDelete(null);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {FetchStoreFaqsIsLoading ? (
        <LoadingState label="Loading Quick FAQs…" />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary">{totalCount} FAQs</Badge>
            <Button size="sm" onClick={openCreateForm} disabled={!storeCode}>
              <IconPlus className="size-4" />
              Add FAQ
            </Button>
          </div>

          {faqs.length > 0 ? (
            <Accordion
              key={faqs[0]?.id}
              type="single"
              collapsible
              defaultValue={String(faqs[0]?.id)}
              className="gap-3 overflow-visible rounded-none border-0"
            >
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={String(faq.id)}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-card"
                >
                  <div className="flex items-center gap-1 px-3 *:first:min-w-0 *:first:flex-1">
                    <AccordionTrigger className="text-sm">
                      {faq.question}
                    </AccordionTrigger>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditForm(faq)}
                      aria-label="Edit FAQ"
                    >
                      <IconPencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setFaqToDelete(faq)}
                      aria-label="Delete FAQ"
                    >
                      <IconTrash />
                    </Button>
                  </div>
                  <AccordionContent className="bg-muted/40 px-3">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{faq.answer}</ReactMarkdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
              No FAQs yet. Add one to give the chatbot an instant answer.
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Typography variant="muted" as="span" className="text-xs">
                Page {page} of {totalPages}
              </Typography>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || FetchStoreFaqsIsLoading}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || FetchStoreFaqsIsLoading}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <StoreFaqForm
        open={formOpen}
        onOpenChange={setFormOpen}
        storeCode={storeCode}
        faq={editingFaq}
        onSaved={() => loadFaqs(page)}
      />

      <AlertDialog
        open={faqToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setFaqToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this FAQ. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={DeleteStoreFaqIsLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={DeleteStoreFaqIsLoading}
              onClick={(event) => {
                event.preventDefault();
                handleConfirmDelete();
              }}
            >
              {DeleteStoreFaqIsLoading ? (
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
    </div>
  );
}
