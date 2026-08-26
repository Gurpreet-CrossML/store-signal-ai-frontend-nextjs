"use client";

import { useEffect, useRef, useState } from "react";
import { IconSearch } from "@tabler/icons-react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  WHATSAPP_VARIABLE_CATEGORIES,
  variablePlaceholder,
  type WhatsAppTemplateVariable,
} from "@/lib/whatsapp-template-fields";

/**
 * A Body textarea wired to insert only the placeholders WhatsApp templates
 * actually support (WHATSAPP_VARIABLE_CATEGORIES — mirrors the backend's
 * VARIABLE_MAP; nothing else is ever inserted here). Two ways in:
 *
 * - Type `{{` in the textarea — the picker opens and focus moves to its own
 *   search box, so continued typing filters the list rather than adding
 *   literal characters after the braces.
 * - Click "Insert Variable" — opens the same picker at the current cursor
 *   position, nothing to replace.
 *
 * Either way, picking a variable inserts `{{token}}` (closing the braces
 * itself) and returns focus to the textarea right after it. Escape or a
 * click outside closes the picker without touching the text.
 *
 * The panel renders through Radix Popover (PopoverContent portals to
 * document.body) rather than a plain absolutely-positioned div — this field
 * sits inside a Card, and every Card clips overflow (see card.tsx's base
 * className), which silently cut the dropdown off at the Card's edge under
 * the original hand-rolled positioning. Popover is used in fully controlled
 * mode (open/onOpenChange driven by this component's own state, anchored to
 * the textarea via PopoverAnchor) specifically so "opens on typing, not on
 * click" still works — PopoverTrigger's click-to-open semantics are never
 * invoked here.
 */
export function WhatsAppVariablePicker({
  value,
  onChange,
  maxLength,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(
    WHATSAPP_VARIABLE_CATEGORIES[0].key,
  );
  // Where in `value` the inserted token goes. When the picker was opened by
  // typing "{{", value[triggerStart, triggerStart+2) IS those braces —
  // handleSelect detects that and consumes them; opened via the button,
  // there's nothing there to consume, just an insertion point.
  const [triggerStart, setTriggerStart] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const openPickerAt = (position: number) => {
    setTriggerStart(position);
    setSearch("");
    setActiveCategory(WHATSAPP_VARIABLE_CATEGORIES[0].key);
    setOpen(true);
  };

  const closePicker = () => {
    setOpen(false);
    setTriggerStart(null);
  };

  // Focus the search box the moment the picker opens — typing after "{{"
  // should filter, not land back in the textarea as literal text.
  useEffect(() => {
    if (open) searchInputRef.current?.focus();
  }, [open]);

  // Radix's own dismiss handling (outside click + Escape) drives this —
  // both close without inserting anything, leaving whatever was typed
  // as-is. Focus is returned to the textarea explicitly since PopoverAnchor
  // (unlike PopoverTrigger) isn't itself a focusable element Radix would
  // restore focus to on its own.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setOpen(true);
      return;
    }
    closePicker();
    textareaRef.current?.focus();
  };

  const handleTextareaChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const nextValue = event.target.value;
    onChange(nextValue);
    const cursor = event.target.selectionStart ?? nextValue.length;
    if (nextValue.slice(Math.max(0, cursor - 2), cursor) === "{{") {
      openPickerAt(cursor - 2);
    }
  };

  const handleInsertClick = () => {
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    openPickerAt(cursor);
    textareaRef.current?.focus();
  };

  const handleSelect = (token: string) => {
    if (triggerStart === null) return;
    const consumed =
      value.slice(triggerStart, triggerStart + 2) === "{{" ? 2 : 0;
    const before = value.slice(0, triggerStart);
    const after = value.slice(triggerStart + consumed);
    const inserted = variablePlaceholder(token);
    onChange(before + inserted + after);
    closePicker();
    requestAnimationFrame(() => {
      const pos = before.length + inserted.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  };

  const query = search.trim().toLowerCase();
  const matches = (variable: WhatsAppTemplateVariable) =>
    !query ||
    variable.token.toLowerCase().includes(query) ||
    variable.label.toLowerCase().includes(query);

  // Searching goes global (every category); browsing without a query stays
  // scoped to whichever category is selected on the left.
  const visibleVariables = query
    ? WHATSAPP_VARIABLE_CATEGORIES.flatMap((category) =>
        category.variables.filter(matches),
      )
    : (WHATSAPP_VARIABLE_CATEGORIES.find((c) => c.key === activeCategory)
        ?.variables ?? []);

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && visibleVariables.length) {
      event.preventDefault();
      handleSelect(visibleVariables[0].token);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div className="mb-1.5 flex items-center justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleInsertClick}
        >
          <span className="font-mono">{"{}"}</span>
          Insert Variable
        </Button>
      </div>

      <PopoverAnchor asChild>
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            maxLength={maxLength}
            placeholder={placeholder}
            rows={6}
          />
          {maxLength ? (
            <span className="pointer-events-none absolute right-2 bottom-2 text-xs text-muted-foreground">
              {value.length}/{maxLength}
            </span>
          ) : null}
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="flex w-full max-w-md flex-row gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex w-36 shrink-0 flex-col border-r py-1">
          {WHATSAPP_VARIABLE_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => setActiveCategory(category.key)}
                disabled={Boolean(query)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-left text-xs font-medium",
                  !query && activeCategory === category.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">{category.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b p-2">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search variables…"
                className="w-full rounded-md border border-input bg-transparent py-1.5 pr-2 pl-8 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {visibleVariables.length ? (
              visibleVariables.map((variable) => (
                <button
                  key={variable.token}
                  type="button"
                  onClick={() => handleSelect(variable.token)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left hover:bg-muted"
                >
                  <span className="truncate font-mono text-xs text-primary">
                    {variablePlaceholder(variable.token)}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {variable.label}
                  </span>
                </button>
              ))
            ) : (
              <p className="p-3 text-center text-xs text-muted-foreground">
                No variables match &quot;{search}&quot;.
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
