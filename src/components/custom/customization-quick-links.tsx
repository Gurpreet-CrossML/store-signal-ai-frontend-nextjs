"use client";

import { IconLink, IconTrash } from "@tabler/icons-react";
import { FieldError } from "@/components/custom/field-error";

import { InfoIcon } from "@/components/custom/info-icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuickLinkItem } from "@/components/custom/customization-types";

type CustomizationQuickLinksProps = {
  /** Field errors from the last rejected save, keyed as the API names them. */
  fieldErrors?: Record<string, string>;
  quickLinks: QuickLinkItem[];
  onUpdate: (index: number, patch: Partial<QuickLinkItem>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  /** Per-row server errors from the last rejected save, indexed the same
   *  way as `quickLinks` — e.g. `rowErrors[1].url`. */
  rowErrors?: Record<string, string>[];
};

export default function CustomizationQuickLinks({
  fieldErrors,
  quickLinks,
  onUpdate,
  onAdd,
  onRemove,
  rowErrors,
}: CustomizationQuickLinksProps) {
  // True once at least one row has its own server error to show — in that
  // case the card-bottom fallback below would just repeat the same message
  // a second time, detached from the row it's actually about.
  const hasRowErrors = (rowErrors ?? []).some(
    (row) => row && Object.keys(row).length > 0,
  );
  const cardErrors: Record<string, string> =
    typeof fieldErrors?.quick_links === "string"
      ? { quick_links: fieldErrors.quick_links }
      : {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconLink className="size-4" />
          Quick Links
          <InfoIcon text="Shortcut links shown inside the chat, like Brands or Offers. Priority (1–9) controls the order; inactive links stay saved but hidden from customers." />
        </CardTitle>
        <CardDescription>
          Links shown inside the chat. Order follows priority (1–9); inactive
          links are hidden.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {quickLinks.map((link, index) => {
          const rowError = rowErrors?.[index];
          const nameError = rowError?.name;
          const urlError = rowError?.url;
          return (
            <div
              key={link.id ?? index}
              className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_88px_120px_auto] md:items-start"
            >
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input
                  value={link.label}
                  onChange={(event) => {
                    const val = event.target.value;
                    if (val === "" || /^[a-zA-Z\s\-']+$/.test(val))
                      onUpdate(index, { label: val });
                  }}
                  placeholder="e.g. Brands"
                  aria-invalid={Boolean(nameError)}
                />
                {nameError && (
                  <p className="text-xs text-destructive">{nameError}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Link</Label>
                <Input
                  value={link.url}
                  onChange={(event) =>
                    onUpdate(index, { url: event.target.value })
                  }
                  placeholder="https://example.com"
                  aria-invalid={Boolean(urlError)}
                />
                {urlError && (
                  <p className="text-xs text-destructive">{urlError}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={`quick-link-active-${index}`}
                  className="text-xs text-muted-foreground"
                >
                  Active
                </Label>
                <div className="flex h-9 items-center">
                  <Checkbox
                    id={`quick-link-active-${index}`}
                    checked={link.active}
                    onCheckedChange={(checked) =>
                      onUpdate(index, { active: checked === true })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">
                  Priority (1–9)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={9}
                  value={Number.isFinite(link.priority) ? link.priority : ""}
                  onChange={(event) =>
                    onUpdate(index, {
                      priority:
                        event.target.value === ""
                          ? NaN
                          : parseInt(event.target.value, 10),
                    })
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive md:mt-5.5"
                onClick={() => onRemove(index)}
                aria-label="Remove link"
              >
                <IconTrash />
              </Button>
            </div>
          );
        })}

        {quickLinks.length === 0 && (
          <div className="flex flex-col items-center gap-1 border border-dashed border-border px-4 py-8 text-center rounded-lg">
            <p className="text-xs text-muted-foreground">
              No quick links configured yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Click “Add link” to create one.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            These labels show inside the chatbot and open the link URL.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            Add Link
          </Button>
        </div>
        {/* Whatever the server rejected among this card's fields, when it
            couldn't be attributed to a specific row above.
            Renders nothing when it rejected none, or a row already has it. */}
        {!hasRowErrors && <FieldError errors={cardErrors} name="quick_links" />}
      </CardContent>
    </Card>
  );
}
