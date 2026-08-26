"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { IconEye } from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  WhatsAppTemplateCategoryBadge,
  WhatsAppTemplateStatusBadge,
} from "@/components/ui/status-badge";
import { useAppDispatch } from "@/redux/hooks";
import {
  fetchWhatsAppTemplateLibrary,
  importWhatsAppTemplateFromLibrary,
  type WhatsAppTemplateLibraryItem,
} from "@/redux/api-slice/social-ai-slice";
import { renderTemplateIcon } from "./whatsapp-template-helpers";

/**
 * The per-row import switch. Self-contained like AutoRespondSwitch
 * (social-accounts-columns.tsx): owns its own request and busy state,
 * needing only the ids the caller already resolved. Once on it stays on
 * and disabled — there's no un-import here; that only ever happens by
 * deleting the row from the WhatsApp Templates screen, exactly as before
 * this was a table instead of a grid of cards.
 */
function ImportToggle({
  item,
  storeCode,
  accountId,
}: {
  item: WhatsAppTemplateLibraryItem;
  storeCode: string;
  accountId: string;
}) {
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);

  const handleChange = async () => {
    setBusy(true);
    try {
      await dispatch(
        importWhatsAppTemplateFromLibrary({
          storeCode,
          accountId,
          libraryId: item.id,
        }),
      ).unwrap();
      toast.success("Template imported", {
        description: `${item.display_name} was submitted to Meta and added to your WhatsApp Templates.`,
      });
      dispatch(fetchWhatsAppTemplateLibrary({ storeCode, accountId }));
    } catch {
      // The thunk already surfaces the error toast.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Switch
      checked={item.is_imported}
      disabled={item.is_imported || busy}
      onCheckedChange={handleChange}
      aria-label={
        item.is_imported
          ? `${item.display_name} is already imported`
          : `Import ${item.display_name}`
      }
    />
  );
}

/**
 * A factory rather than a static array — same reason as
 * getWhatsAppTemplateColumns: the preview action opens the caller's own
 * dialog state, and the import switch needs the caller's already-resolved
 * store/account ids.
 */
export function getWhatsAppTemplateLibraryColumns(
  onPreview: (item: WhatsAppTemplateLibraryItem) => void,
  storeCode: string,
  accountId: string,
): ColumnDef<WhatsAppTemplateLibraryItem>[] {
  return [
    {
      accessorKey: "display_name",
      header: "Template Name",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2.5 py-1 font-medium">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {renderTemplateIcon(item, "size-4")}
            </div>
            <span className="truncate" title={item.display_name}>
              {item.display_name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <WhatsAppTemplateCategoryBadge category={row.original.category} />
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span
          className="block max-w-xs truncate text-sm text-muted-foreground"
          title={row.original.description}
        >
          {row.original.description}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const item = row.original;
        return item.is_imported && item.status ? (
          <WhatsAppTemplateStatusBadge status={item.status} />
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Not Imported
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Preview ${item.display_name}`}
              onClick={(event) => {
                event.stopPropagation();
                onPreview(item);
              }}
            >
              <IconEye className="size-4" />
            </Button>
            <ImportToggle
              item={item}
              storeCode={storeCode}
              accountId={accountId}
            />
          </div>
        );
      },
    },
  ];
}
