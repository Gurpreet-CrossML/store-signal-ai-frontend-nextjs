"use client";

import { useEffect, useMemo, useState } from "react";
import type { PaginationState } from "@tanstack/react-table";
import { IconPackage } from "@tabler/icons-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { SearchInput } from "@/components/custom/search-input";
import { DataTable } from "@/components/custom/data-table";
import { getWhatsAppTemplateLibraryColumns } from "@/components/custom/social-ai/whatsapp-template-library-columns";
import { WhatsAppTemplateLibraryPreviewDialog } from "@/components/custom/social-ai/whatsapp-template-library-preview-dialog";
import { useWhatsAppAccount } from "@/components/custom/social-ai/use-whatsapp-account";
import { ACTIVE_FILTER_STYLE } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchWhatsAppTemplateLibrary,
  type WhatsAppTemplateLibraryItem,
} from "@/redux/api-slice/social-ai-slice";

const ALL = "all";
const IMPORTED = "imported";
const NOT_IMPORTED = "not_imported";

export default function CampaignPostSale() {
  const dispatch = useAppDispatch();
  const { storeCode, account, loading: accountLoading } = useWhatsAppAccount();

  const {
    FetchWhatsAppTemplateLibraryData,
    FetchWhatsAppTemplateLibraryIsLoading,
    FetchWhatsAppTemplateLibraryIsSuccess,
    FetchWhatsAppTemplateLibraryIsError,
  } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchWhatsAppTemplateLibraryState,
  );

  useEffect(() => {
    if (storeCode && account) {
      dispatch(
        fetchWhatsAppTemplateLibrary({
          storeCode,
          accountId: String(account.id),
        }),
      );
    }
  }, [storeCode, account, dispatch]);

  const templatesLoading =
    Boolean(account) &&
    (FetchWhatsAppTemplateLibraryIsLoading ||
      (!FetchWhatsAppTemplateLibraryIsSuccess &&
        !FetchWhatsAppTemplateLibraryIsError));
  const loading = accountLoading || templatesLoading;

  const templates = useMemo(
    () => FetchWhatsAppTemplateLibraryData ?? [],
    [FetchWhatsAppTemplateLibraryData],
  );

  const [search, setSearch] = useState("");
  const [importFilter, setImportFilter] = useState(ALL);
  const [previewItem, setPreviewItem] =
    useState<WhatsAppTemplateLibraryItem | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return templates.filter((item) => {
      if (importFilter === IMPORTED && !item.is_imported) return false;
      if (importFilter === NOT_IMPORTED && item.is_imported) return false;
      if (query && !item.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [templates, search, importFilter]);

  // The shared DataTable uses manualPagination — it renders exactly the rows
  // it's handed — so we slice the client-side-filtered list to the current
  // page ourselves and report the full count for the pagination bar.
  const pageRows = useMemo(
    () =>
      filtered.slice(
        pagination.pageIndex * pagination.pageSize,
        (pagination.pageIndex + 1) * pagination.pageSize,
      ),
    [filtered, pagination],
  );

  const resetToFirstPage = () =>
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));

  const columns = useMemo(
    () =>
      getWhatsAppTemplateLibraryColumns(
        (item) => setPreviewItem(item),
        storeCode ?? "",
        account ? String(account.id) : "",
      ),
    [storeCode, account],
  );

  if (!accountLoading && !account) {
    return (
      <Empty className="w-full">
        <EmptyHeader>
          <EmptyMedia>
            <IconPackage />
          </EmptyMedia>
          <EmptyTitle>No WhatsApp Account Connected</EmptyTitle>
          <EmptyDescription>
            Connect a WhatsApp Business Account under Social AI settings to
            import post-sale templates.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              resetToFirstPage();
            }}
            placeholder="Search templates…"
            label="Search templates"
            className="w-full sm:w-64"
          />
          <Select
            value={importFilter}
            onValueChange={(value) => {
              setImportFilter(value);
              resetToFirstPage();
            }}
          >
            <SelectTrigger
              className={cn(
                "w-[160px]",
                importFilter !== ALL && ACTIVE_FILTER_STYLE,
              )}
              aria-label="Filter by import status"
            >
              <SelectValue />
            </SelectTrigger>
            {/* popper: the default "item-aligned" mode lays the selected
                option over the trigger, hiding it while the menu is open. */}
            <SelectContent position="popper">
              <SelectItem value={ALL}>All Status</SelectItem>
              <SelectItem value={IMPORTED}>Imported</SelectItem>
              <SelectItem value={NOT_IMPORTED}>Not Imported</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pageRows}
        totalCount={filtered.length}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={loading}
        noun="template"
        emptyTitle="No templates match your filters."
      />

      <WhatsAppTemplateLibraryPreviewDialog
        item={previewItem}
        account={account}
        onOpenChange={(open) => {
          if (!open) setPreviewItem(null);
        }}
      />
    </div>
  );
}
