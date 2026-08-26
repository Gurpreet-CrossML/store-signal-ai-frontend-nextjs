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
import { SocialAccountsDataTable } from "@/components/custom/settings/social-ai/social-accounts-data-table";
import { getWhatsAppTemplateLibraryColumns } from "@/components/custom/social-ai/whatsapp-template-library-columns";
import { WhatsAppTemplateLibraryPreviewDialog } from "@/components/custom/social-ai/whatsapp-template-library-preview-dialog";
import { useWhatsAppAccount } from "@/components/custom/social-ai/use-whatsapp-account";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchWhatsAppTemplateLibrary,
  type WhatsAppTemplateLibraryItem,
} from "@/redux/api-slice/social-ai-slice";

const ALL = "all";
const IMPORTED = "imported";
const NOT_IMPORTED = "not_imported";

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

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
    () => FetchWhatsAppTemplateLibraryData?.templates ?? [],
    [FetchWhatsAppTemplateLibraryData],
  );

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [importFilter, setImportFilter] = useState(ALL);
  const [previewItem, setPreviewItem] =
    useState<WhatsAppTemplateLibraryItem | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  // Filter options come from what's actually in the data, so the menu never
  // offers a category that would just filter the table to nothing.
  const categories = useMemo(
    () => Array.from(new Set(templates.map((t) => t.category))).sort(),
    [templates],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return templates.filter((item) => {
      if (categoryFilter !== ALL && item.category !== categoryFilter)
        return false;
      if (importFilter === IMPORTED && !item.is_imported) return false;
      if (importFilter === NOT_IMPORTED && item.is_imported) return false;
      if (query && !item.display_name.toLowerCase().includes(query))
        return false;
      return true;
    });
  }, [templates, search, categoryFilter, importFilter]);

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
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value);
              resetToFirstPage();
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {titleCase(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={importFilter}
            onValueChange={(value) => {
              setImportFilter(value);
              resetToFirstPage();
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Status</SelectItem>
              <SelectItem value={IMPORTED}>Imported</SelectItem>
              <SelectItem value={NOT_IMPORTED}>Not Imported</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <SocialAccountsDataTable
        columns={columns}
        data={filtered}
        totalCount={filtered.length}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={loading}
        noun="template"
        emptyMessage="No templates match your filters."
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
