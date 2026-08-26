"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PaginationState } from "@tanstack/react-table";
import {
  IconCategory,
  IconCircleCheck,
  IconClockHour4,
  IconPlus,
  IconTemplate,
} from "@tabler/icons-react";

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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { SearchInput } from "@/components/custom/search-input";
import { SocialAccountsDataTable } from "@/components/custom/settings/social-ai/social-accounts-data-table";
import { getWhatsAppTemplateColumns } from "@/components/custom/social-ai/whatsapp-template-columns";
import { WhatsAppTemplatePreviewDialog } from "@/components/custom/social-ai/whatsapp-template-preview-dialog";
import { useWhatsAppAccount } from "@/components/custom/social-ai/use-whatsapp-account";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  deleteWhatsAppTemplate,
  deleteWhatsAppTemplateDraft,
  fetchWhatsAppTemplates,
  type WhatsAppTemplate,
} from "@/redux/api-slice/social-ai-slice";
import { toast } from "sonner";

const ALL = "all";

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export default function WhatsAppTemplates() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { storeCode, account, loading: accountsLoading } = useWhatsAppAccount();

  const {
    FetchWhatsAppTemplatesData,
    FetchWhatsAppTemplatesIsLoading,
    FetchWhatsAppTemplatesIsSuccess,
    FetchWhatsAppTemplatesIsError,
  } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchWhatsAppTemplatesState,
  );

  useEffect(() => {
    if (storeCode && account) {
      dispatch(
        fetchWhatsAppTemplates({ storeCode, accountId: String(account.id) }),
      );
    }
  }, [storeCode, account, dispatch]);

  const templatesLoading =
    Boolean(account) &&
    (FetchWhatsAppTemplatesIsLoading ||
      (!FetchWhatsAppTemplatesIsSuccess && !FetchWhatsAppTemplatesIsError));
  const loading = accountsLoading || templatesLoading;

  const templates = useMemo(
    () => FetchWhatsAppTemplatesData?.templates ?? [],
    [FetchWhatsAppTemplatesData],
  );

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [languageFilter, setLanguageFilter] = useState(ALL);
  const [previewTemplate, setPreviewTemplate] =
    useState<WhatsAppTemplate | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [templateToDelete, setTemplateToDelete] =
    useState<WhatsAppTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filter option lists come from what's actually in the data, so the menus
  // never offer a value that would just filter the table to nothing.
  const categories = useMemo(
    () => Array.from(new Set(templates.map((t) => t.category))).sort(),
    [templates],
  );
  const statuses = useMemo(
    () => Array.from(new Set(templates.map((t) => t.status))).sort(),
    [templates],
  );
  const languages = useMemo(
    () => Array.from(new Set(templates.map((t) => t.language))).sort(),
    [templates],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return templates.filter((template) => {
      if (categoryFilter !== ALL && template.category !== categoryFilter)
        return false;
      if (statusFilter !== ALL && template.status !== statusFilter)
        return false;
      if (languageFilter !== ALL && template.language !== languageFilter)
        return false;
      if (query && !template.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [templates, search, categoryFilter, statusFilter, languageFilter]);

  const resetToFirstPage = () =>
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));

  const approvedCount = useMemo(
    () => templates.filter((t) => t.status === "APPROVED").length,
    [templates],
  );
  const pendingCount = useMemo(
    () => templates.filter((t) => t.status === "PENDING").length,
    [templates],
  );

  const columns = useMemo(
    () =>
      getWhatsAppTemplateColumns(
        (template) => setPreviewTemplate(template),
        (template) =>
          router.push(
            template.status === "DRAFT"
              ? `/campaign/whatsapp-templates/draft/${template.draft_id}/edit`
              : `/campaign/whatsapp-templates/${template.id}/edit`,
          ),
        (template) => setTemplateToDelete(template),
      ),
    [router],
  );

  const handleConfirmDelete = async () => {
    if (!storeCode || !account || !templateToDelete) return;
    setDeleting(true);
    try {
      if (templateToDelete.status === "DRAFT" && templateToDelete.draft_id) {
        await dispatch(
          deleteWhatsAppTemplateDraft({
            storeCode,
            accountId: String(account.id),
            draftId: templateToDelete.draft_id,
          }),
        ).unwrap();
        toast.success("Draft deleted", {
          description: `${templateToDelete.name} was removed.`,
        });
      } else {
        await dispatch(
          deleteWhatsAppTemplate({
            storeCode,
            accountId: String(account.id),
            metaTemplateId: templateToDelete.id,
          }),
        ).unwrap();
        toast.success("Template deleted", {
          description: `${templateToDelete.name} was removed from Meta and this dashboard.`,
        });
      }
      setTemplateToDelete(null);
      dispatch(
        fetchWhatsAppTemplates({ storeCode, accountId: String(account.id) }),
      );
    } catch {
      // The thunk already surfaces the error toast.
    } finally {
      setDeleting(false);
    }
  };

  const stats = [
    {
      label: "Total Templates",
      value: templates.length,
      note: "All templates",
      icon: IconTemplate,
    },
    {
      label: "Approved",
      value: approvedCount,
      note: templates.length
        ? `${Math.round((approvedCount / templates.length) * 100)}% of total`
        : "—",
      icon: IconCircleCheck,
    },
    {
      label: "Pending Review",
      value: pendingCount,
      note: templates.length
        ? `${Math.round((pendingCount / templates.length) * 100)}% of total`
        : "—",
      icon: IconClockHour4,
    },
    {
      label: "Categories",
      value: categories.length,
      note: categories.length ? categories.map(titleCase).join(", ") : "—",
      icon: IconCategory,
    },
  ];

  const emptyMessage =
    !accountsLoading && !account
      ? "No WhatsApp account connected for this store."
      : "No templates match your filters.";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon }) => (
          <Card key={label} size="sm">
            <CardHeader>
              <CardTitle>
                <Typography variant="muted" as="h3">
                  {label}
                </Typography>
              </CardTitle>
              <CardAction>
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Typography variant="h3" as="p" className="tabular-nums">
                {loading ? <Spinner className="my-1 size-5" /> : value}
              </Typography>
            </CardContent>
            <CardFooter>
              <span className="inline-block max-w-full truncate rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                {note}
              </span>
            </CardFooter>
          </Card>
        ))}
      </div>

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
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              resetToFirstPage();
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Status</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {titleCase(status.replace(/_/g, " "))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={languageFilter}
            onValueChange={(value) => {
              setLanguageFilter(value);
              resetToFirstPage();
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Languages</SelectItem>
              {languages.map((language) => (
                <SelectItem key={language} value={language}>
                  {language}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => router.push("/campaign/whatsapp-templates/create")}
        >
          <IconPlus className="size-4" />
          Create Template
        </Button>
      </div>

      <SocialAccountsDataTable
        columns={columns}
        data={filtered}
        totalCount={filtered.length}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={loading}
        noun="template"
        emptyMessage={emptyMessage}
      />

      <WhatsAppTemplatePreviewDialog
        template={previewTemplate}
        account={account}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
      />

      <AlertDialog
        open={!!templateToDelete}
        onOpenChange={(open) => {
          if (!open) setTemplateToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {templateToDelete?.status === "DRAFT"
                ? "Delete draft?"
                : "Delete template?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                {templateToDelete?.name}
              </span>
              {templateToDelete?.status === "DRAFT" ? (
                <>. This can&apos;t be undone.</>
              ) : (
                <>
                  {" "}
                  from Meta and this dashboard. This can&apos;t be undone, and
                  any automation sending this template will start failing.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleConfirmDelete();
              }}
              disabled={deleting}
              className={buttonVariants({ variant: "destructive" })}
            >
              {deleting
                ? "Deleting…"
                : templateToDelete?.status === "DRAFT"
                  ? "Delete Draft"
                  : "Delete Template"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
