"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconRefresh,
  IconRotateClockwise2,
  IconTrash,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  languageLabel,
  resolveTemplateIcon,
  WhatsAppTemplateCategoryBadge,
  WhatsAppTemplateStatusBadge,
} from "@/lib/whatsapp-template-helper";
import type { WhatsAppTemplate } from "@/redux/api-slice/social-ai-slice";
import { buildTemplateComponents } from "@/lib/whatsapp-template-components";

/**
 * A factory rather than a static array: unlike the read-only account
 * columns, a row's view action opens the caller's own preview panel, so the
 * click handler has to come from the screen that owns that panel's state.
 */
export function getWhatsAppTemplateColumns(
  onView: (template: WhatsAppTemplate) => void,
  onEdit: (template: WhatsAppTemplate) => void,
  onDelete: (template: WhatsAppTemplate) => void,
  onResubmit: (template: WhatsAppTemplate) => void,
  onResubmitAsNew: (template: WhatsAppTemplate) => void,
  onToggleActive: (template: WhatsAppTemplate, value: boolean) => void,
  togglingId: number | null,
): ColumnDef<WhatsAppTemplate>[] {
  return [
    {
      accessorKey: "name",
      header: "Template Name",
      cell: ({ row }) => {
        const template = row.original;
        const Icon = resolveTemplateIcon({
          category: template.category,
          components: buildTemplateComponents(template),
        });
        return (
          <div className="flex items-center gap-2.5 py-1 font-medium">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" />
            </div>
            <span className="truncate" title={template.name}>
              {template.display_name || template.name}
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
      accessorKey: "language",
      header: "Language",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {languageLabel(row.original.language)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <WhatsAppTemplateStatusBadge status={row.original.status} />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const template = row.original;
        return (
          <div className="flex items-center gap-1">
            {/* Off: never sent to customers, auto-send included. */}
            <Switch
              checked={template.is_active}
              disabled={togglingId === template.id}
              onClick={(event) => event.stopPropagation()}
              onCheckedChange={(value) => onToggleActive(template, value)}
              aria-label={`Send ${template.display_name || template.name} to customers`}
              className="mr-1"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Preview ${template.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onView(template);
              }}
            >
              <IconEye className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`More actions for ${template.name}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {template.status?.toUpperCase() === "REJECTED" && (
                  <DropdownMenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      onResubmit(template);
                    }}
                  >
                    <IconRefresh className="size-4" />
                    Resubmit to Meta
                  </DropdownMenuItem>
                )}
                {(template.status?.toUpperCase() === "PENDING_DELETION" ||
                  template.status?.toUpperCase() === "DELETED") && (
                  <DropdownMenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      onResubmitAsNew(template);
                    }}
                  >
                    <IconRotateClockwise2 className="size-4" />
                    Resubmit
                  </DropdownMenuItem>
                )}
                {/* Meta can't edit a template while it's under review. */}
                <DropdownMenuItem
                  disabled={template.status?.toUpperCase() === "PENDING"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(template);
                  }}
                >
                  <IconPencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(template);
                  }}
                >
                  <IconTrash className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
