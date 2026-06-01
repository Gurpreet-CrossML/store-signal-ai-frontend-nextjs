"use client";

import { useEffect } from "react";
import { IconBook } from "@tabler/icons-react";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { FetchLibraryDocuments } from "@/redux/api-slice/knowledge-slice";
import DropZone from "./drop-zone";
import { StoreDocumentDataTable } from "./store-document-data-table";
import { storeDocumentColumns } from "./store-document-columns";

export default function StoreDocumentTabContent() {
    const dispatch = useAppDispatch();
    const storeCode = useAppSelector(
        (state) => state.GetStoresReducer.selectedStore
    );

    const { FetchLibraryDocumentsListData, FetchLibraryDocumentsIsLoading } = useAppSelector(
        (state) => state.GetKnowledgeReducer.FetchLibraryDocumentsState
    );

    const documents = FetchLibraryDocumentsListData?.results ?? [];

    const loadDocuments = () => {
        if (!storeCode) return;
        dispatch(FetchLibraryDocuments({ store_code: storeCode }));
    };

    useEffect(() => {
        loadDocuments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storeCode]);

    return (
        <div className="flex w-full flex-col gap-4 py-4">
            <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center bg-primary/10 text-primary">
                    <IconBook className="size-5" />
                </div>
                <div className="flex flex-col">
                    <h2 className="font-heading text-sm font-medium">Library</h2>
                    <p className="text-xs text-muted-foreground">
                        Upload PDFs or DOCX files to enrich your chatbot&apos;s knowledge base.
                    </p>
                </div>
            </div>

            <DropZone storeCode={storeCode} onUploaded={loadDocuments} />

            <StoreDocumentDataTable
                columns={storeDocumentColumns}
                data={documents}
                isLoading={FetchLibraryDocumentsIsLoading}
            />
        </div>
    );
}
