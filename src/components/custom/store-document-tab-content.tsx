"use client";

import { useEffect } from "react";
import { IconBook } from "@tabler/icons-react";

import { Typography } from "@/components/ui/typography";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { FetchLibraryDocuments } from "@/redux/api-slice/knowledge-slice";
import DropZone from "@/components/custom/drop-zone";
import { StoreDocumentDataTable } from "@/components/custom/store-document-data-table";
import { storeDocumentColumns } from "@/components/custom/store-document-columns";

export default function StoreDocumentTabContent() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { FetchLibraryDocumentsListData, FetchLibraryDocumentsIsLoading } =
    useAppSelector(
      (state) => state.GetKnowledgeReducer.FetchLibraryDocumentsState,
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
        <IconBook className="size-5" />
        <div className="flex flex-col">
          <Typography variant="h6" as="h2">
            Library
          </Typography>
          <Typography variant="muted">
            Upload PDFs or DOCX files to enrich your chatbot&apos;s knowledge
            base.
          </Typography>
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
