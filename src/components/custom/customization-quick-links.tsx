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
import { isValidUrl } from "@/lib/url";
import type { QuickLinkItem } from "@/components/custom/customization-types";

type CustomizationQuickLinksProps = {
  /** Field errors from the last rejected save, keyed as the API names them. */
  fieldErrors?: Record<string, string>;
  quickLinks: QuickLinkItem[];
  onUpdate: (index: number, patch: Partial<QuickLinkItem>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

export default function CustomizationQuickLinks({
  fieldErrors,
  quickLinks,
  onUpdate,
  onAdd,
  onRemove,
}: CustomizationQuickLinksProps) {
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
        {quickLinks.map((link, index) => (
          <div
            key={link.id ?? index}
            className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_88px_120px_auto] md:items-end"
          >
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                value={link.label}
                onChange={(event) =>
                  onUpdate(index, { label: event.target.value })
                }
                placeholder="e.g. Brands"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Link</Label>
              <Input
                value={link.url}
                onChange={(event) =>
                  onUpdate(index, { url: event.target.value })
                }
                placeholder="https://example.com"
                aria-invalid={Boolean(link.url) && !isValidUrl(link.url)}
              />
              {link.url && !isValidUrl(link.url) && (
                <p className="text-xs text-destructive">Enter a valid URL</p>
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
              className="text-destructive hover:text-destructive md:mb-0.5"
              onClick={() => onRemove(index)}
              aria-label="Remove link"
            >
              <IconTrash />
            </Button>
          </div>
        ))}

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
            Add link
          </Button>
        </div>
        {/* Whatever the server rejected among this card's fields.
            Renders nothing when it rejected none. */}
        <FieldError errors={fieldErrors} name="quick_links" />
      </CardContent>
    </Card>
  );
}
