"use client";

import { useEffect, useMemo, useState } from "react";
import { IconSearch, IconX } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { FetchLibraryDocuments } from "@/redux/api-slice/knowledge-slice";
import DropZone from "@/components/custom/drop-zone";
import { StoreDocumentDataTable } from "@/components/custom/store-document-data-table";
import {
  formatDocumentType,
  storeDocumentColumns,
} from "@/components/custom/store-document-columns";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export default function StoreDocumentTabContent() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { FetchLibraryDocumentsListData, FetchLibraryDocumentsIsLoading } =
    useAppSelector(
      (state) => state.GetKnowledgeReducer.FetchLibraryDocumentsState,
    );

  const documents = useMemo(
    () => FetchLibraryDocumentsListData?.results ?? [],
    [FetchLibraryDocumentsListData],
  );

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const hasActiveFilters =
    search !== "" || typeFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  // The library endpoint returns all documents in one response, so search
  // and filters apply client-side.
  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documents.filter((doc) => {
      if (typeFilter !== "all" && formatDocumentType(doc.type) !== typeFilter)
        return false;
      if (statusFilter !== "all" && doc.status !== statusFilter) return false;
      if (!query) return true;
      return doc.name.toLowerCase().includes(query);
    });
  }, [documents, search, typeFilter, statusFilter]);

  const loadDocuments = () => {
    if (!storeCode) return;
    dispatch(FetchLibraryDocuments({ store_code: storeCode }));
  };

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeCode]);

  return (
    <div className="flex w-full flex-col gap-6">
      <DropZone storeCode={storeCode} onUploaded={loadDocuments} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by file name…"
              className="pl-8"
              aria-label="Search documents"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger aria-label="Filter by file type" className="w-fit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="DOCX">DOCX</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Filter by status" className="w-fit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={clearFilters}
            >
              <IconX />
              Clear
            </Button>
          )}

          <Badge variant="secondary" className="ml-auto">
            {filteredDocuments.length} of {documents.length} documents
          </Badge>
        </div>

        <StoreDocumentDataTable
          columns={storeDocumentColumns}
          data={filteredDocuments}
          isLoading={FetchLibraryDocumentsIsLoading}
        />
      </div>
    </div>
  );
}
