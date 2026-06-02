"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
    IconMessageQuestion,
    IconPencil,
    IconPlus,
    IconTrash,
} from "@tabler/icons-react";

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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
    DeleteStoreFaq,
    FetchStoreFaqs,
    type StoreFaq,
} from "@/redux/api-slice/knowledge-slice";
import StoreFaqForm from "./store-faq-form";

const PAGE_SIZE = 15;

export default function StoreFaqTabContent() {
    const dispatch = useAppDispatch();
    const storeCode = useAppSelector(
        (state) => state.GetStoresReducer.selectedStore
    );

    const { FetchStoreFaqsListData, FetchStoreFaqsIsLoading } = useAppSelector(
        (state) => state.GetKnowledgeReducer.FetchStoreFaqsState
    );
    const { DeleteStoreFaqIsLoading } = useAppSelector(
        (state) => state.GetKnowledgeReducer.DeleteStoreFaqState
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
            FetchStoreFaqs({ store_code: storeCode, page: targetPage, limit: PAGE_SIZE })
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
            DeleteStoreFaq({ store_code: storeCode, id: faqToDelete.id })
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
        <div className="flex w-full flex-col gap-4 py-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center bg-primary/10 text-primary">
                        <IconMessageQuestion className="size-5" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="font-heading font-medium">Quick Q&As</h2>
                        <p className="text-muted-foreground">
                            Add some quick questions and answers to help your chatbot respond faster.
                        </p>
                    </div>
                </div>
                <Button onClick={openCreateForm} disabled={!storeCode}>
                    <IconPlus />
                    Add Quick Q&A
                </Button>
            </div>

            {FetchStoreFaqsIsLoading ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-10 w-full" />
                    ))}
                </div>
            ) : faqs.length > 0 ? (
                <Accordion
                    key={faqs[0]?.id}
                    type="single"
                    collapsible
                    defaultValue={String(faqs[0]?.id)}
                    className="gap-2"
                >
                    {faqs.map((faq) => (
                        <AccordionItem
                            key={faq.id}
                            value={String(faq.id)}
                            className="border border-border/60"
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
                                    aria-label="Edit Q&A"
                                >
                                    <IconPencil />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setFaqToDelete(faq)}
                                    aria-label="Delete Q&A"
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
                <div className="flex h-32 flex-col items-center justify-center border border-dashed border-border text-xs text-muted-foreground">
                    No Quick Q&As added yet. Click the button above to add one.
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
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
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        >
                            Next
                        </Button>
                    </div>
                </div>
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
                        <AlertDialogTitle>Delete Quick Q&A?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this Q&A. This action cannot be undone.
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
