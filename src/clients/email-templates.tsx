"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PaginationState } from "@tanstack/react-table";
import {
  IconCircleCheck,
  IconCircleOff,
  IconMail,
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
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { SearchInput } from "@/components/custom/search-input";
import { DataTable } from "@/components/custom/data-table";
import { getEmailTemplateColumns } from "@/components/custom/social-ai/email-template-columns";
import { EmailTemplatePreviewDialog } from "@/components/custom/social-ai/email-template-preview-dialog";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  deleteEmailTemplate,
  fetchEmailTemplates,
  updateEmailTemplate,
  type EmailTemplate,
} from "@/redux/api-slice/campaign-slice";
import { toast } from "sonner";

export default function EmailTemplates() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const {
    FetchEmailTemplatesData,
    FetchEmailTemplatesIsLoading,
    FetchEmailTemplatesIsSuccess,
    FetchEmailTemplatesIsError,
  } = useAppSelector(
    (state) => state.GetCampaignReducer.FetchEmailTemplatesState,
  );

  useEffect(() => {
    if (storeCode) {
      dispatch(fetchEmailTemplates(storeCode));
    }
  }, [storeCode, dispatch]);

  const loading =
    FetchEmailTemplatesIsLoading ||
    (!FetchEmailTemplatesIsSuccess && !FetchEmailTemplatesIsError);

  const templates = useMemo(
    () => FetchEmailTemplatesData ?? [],
    [FetchEmailTemplatesData],
  );

  const [search, setSearch] = useState("");
  const [previewTemplate, setPreviewTemplate] =
    useState<EmailTemplate | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [templateToDelete, setTemplateToDelete] =
    useState<EmailTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return templates.filter((template) => {
      if (query && !template.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [templates, search]);

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

  const activeCount = useMemo(
    () => templates.filter((t) => t.is_active).length,
    [templates],
  );
  const inactiveCount = useMemo(
    () => templates.filter((t) => !t.is_active).length,
    [templates],
  );

  const handleToggleActive = useCallback(
    async (template: EmailTemplate, checked: boolean) => {
      if (!storeCode) return;
      try {
        await dispatch(
          updateEmailTemplate({
            storeCode,
            templateId: template.id,
            payload: { is_active: checked },
          }),
        ).unwrap();
        toast.success(checked ? "Template activated" : "Template deactivated");
        dispatch(fetchEmailTemplates(storeCode));
      } catch {
        // The thunk already surfaces the error toast.
      }
    },
    [storeCode, dispatch],
  );

  const columns = useMemo(
    () =>
      getEmailTemplateColumns(
        (template) => setPreviewTemplate(template),
        (template) =>
          router.push(`/campaign/email-templates/${template.id}/edit`),
        (template) => setTemplateToDelete(template),
        handleToggleActive,
      ),
    [router, handleToggleActive],
  );

  const handleConfirmDelete = async () => {
    if (!storeCode || !templateToDelete) return;
    setDeleting(true);
    try {
      await dispatch(
        deleteEmailTemplate({
          storeCode,
          templateId: templateToDelete.id,
        }),
      ).unwrap();
      toast.success("Template deleted", {
        description: `${templateToDelete.name} was removed.`,
      });
      setTemplateToDelete(null);
      dispatch(fetchEmailTemplates(storeCode));
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
      note: "All email templates",
      icon: IconTemplate,
    },
    {
      label: "Active",
      value: activeCount,
      note: templates.length
        ? `${Math.round((activeCount / templates.length) * 100)}% of total`
        : "—",
      icon: IconCircleCheck,
    },
    {
      label: "Inactive",
      value: inactiveCount,
      note: templates.length
        ? `${Math.round((inactiveCount / templates.length) * 100)}% of total`
        : "—",
      icon: IconCircleOff,
    },
    {
      label: "Email Channel",
      value: "—",
      note: "Transactional emails",
      icon: IconMail,
    },
  ];

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
        </div>

        <Button
          onClick={() => router.push("/campaign/email-templates/create")}
        >
          <IconPlus className="size-4" />
          Create Template
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={pageRows}
        totalCount={filtered.length}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={loading}
        noun="template"
        emptyTitle="No email templates found."
      />

      <EmailTemplatePreviewDialog
        template={previewTemplate}
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
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                {templateToDelete?.name}
              </span>
              . This can&apos;t be undone.
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
              {deleting ? "Deleting…" : "Delete Template"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
