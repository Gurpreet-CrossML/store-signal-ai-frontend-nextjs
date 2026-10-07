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
} from "@/lib/whatsapp-template-helper";

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

  const [focusPane, setFocusPane] = useState<"categories" | "variables">(
    "categories",
  );
  const [variableIndex, setVariableIndex] = useState(0);
  const [triggerStart, setTriggerStart] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const variableRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const openPickerAt = (position: number) => {
    setTriggerStart(position);
    setSearch("");
    setActiveCategory(WHATSAPP_VARIABLE_CATEGORIES[0].key);
    setFocusPane("categories");
    setVariableIndex(0);
    setOpen(true);
  };

  const closePicker = () => {
    setOpen(false);
    setTriggerStart(null);
  };

  /**
   *Here we can open the variable picker by pressing  `{{`
   *We can also use the Variable picker to insert variables into the textarea with the help of the `Tab` key
   *`Escape` key and arrow keys to move down and left and right .
   */

  // Here we are automatically focusing the search input when the popover opens.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(id);
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
  const inSearch = Boolean(query);
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

  // Clamped so a stale index (e.g. after the category or query changed) never
  // points past the end of the list it's now indexing.
  const activeVariableIndex = visibleVariables.length
    ? Math.min(variableIndex, visibleVariables.length - 1)
    : 0;
  // The right pane has the keyboard when a search is active (flat list) or the
  // user has stepped into a group with →.
  const inVariables = inSearch || focusPane === "variables";

  // Keep the highlighted variable scrolled into view as ↑/↓ walk the list.
  useEffect(() => {
    if (inVariables) {
      variableRefs.current[activeVariableIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVariableIndex, focusPane, activeCategory, search]);

  const moveCategory = (delta: number) => {
    const categories = WHATSAPP_VARIABLE_CATEGORIES;
    const current = categories.findIndex((c) => c.key === activeCategory);
    const next = (current + delta + categories.length) % categories.length;
    setActiveCategory(categories[next].key);
    setVariableIndex(0);
  };

  const insertHighlighted = () => {
    const variable = visibleVariables[activeVariableIndex];
    if (variable) handleSelect(variable.token);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (inVariables) {
          if (visibleVariables.length) {
            setVariableIndex(
              (activeVariableIndex + 1) % visibleVariables.length,
            );
          }
        } else {
          moveCategory(1);
        }
        break;

      case "ArrowUp":
        event.preventDefault();
        if (inVariables) {
          if (visibleVariables.length) {
            setVariableIndex(
              (activeVariableIndex - 1 + visibleVariables.length) %
                visibleVariables.length,
            );
          }
        } else {
          moveCategory(-1);
        }
        break;

      case "ArrowRight":
        // Step into the selected category's variables. While searching, ← / →
        // belong to the search box's own text cursor instead.
        if (!inSearch && focusPane === "categories") {
          event.preventDefault();
          setFocusPane("variables");
          setVariableIndex(0);
        }
        break;

      case "ArrowLeft":
        if (!inSearch && focusPane === "variables") {
          event.preventDefault();
          setFocusPane("categories");
        }
        break;

      case "Tab":
      case "Enter":
        if (event.key === "Enter" && !visibleVariables.length) break;
        event.preventDefault();
        if (event.shiftKey) {
          // Shift+Tab steps back out of a group rather than leaving the panel.
          if (!inSearch && focusPane === "variables")
            setFocusPane("categories");
          break;
        }
        if (inVariables) {
          insertHighlighted();
        } else {
          // From the category list, Tab (like →) steps into its variables.
          setFocusPane("variables");
          setVariableIndex(0);
        }
        break;

      // Escape is left to Radix, which closes the popover; handleOpenChange
      // then returns focus to the textarea.
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
        className="flex w-full max-w-md flex-col gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(event) => {
          // Radix would focus the panel wrapper on open; send focus straight
          // to the search box instead so it's ready for typing and the arrow
          // keys without a click. This fires once the content has mounted, so
          // the ref is reliably set here.
          event.preventDefault();
          searchInputRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {/* Header: what this is, and how to drive it from the keyboard. */}
        <div className="border-b bg-muted/40 px-3 py-2">
          <p className="text-xs font-semibold">Insert a variable</p>
          <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
            ↑↓ navigate · → open group · ← back · Tab to insert · Esc to close
          </p>
        </div>

        <div className="flex flex-row">
          <div className="flex w-36 shrink-0 flex-col border-r py-1">
            {WHATSAPP_VARIABLE_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isActive = !query && activeCategory === category.key;
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.key);
                    setFocusPane("categories");
                    setVariableIndex(0);
                  }}
                  disabled={Boolean(query)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-left text-xs font-medium",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted",
                    isActive &&
                      focusPane === "categories" &&
                      "ring-1 ring-inset ring-primary/40",
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
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setVariableIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search variables…"
                  className="w-full rounded-md border border-input bg-transparent py-1.5 pr-2 pl-8 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {visibleVariables.length ? (
                visibleVariables.map((variable, index) => {
                  const isHighlighted =
                    inVariables && index === activeVariableIndex;
                  return (
                    <button
                      key={variable.token}
                      ref={(el) => {
                        variableRefs.current[index] = el;
                      }}
                      type="button"
                      onClick={() => handleSelect(variable.token)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left",
                        isHighlighted ? "bg-muted" : "hover:bg-muted",
                      )}
                    >
                      <span className="truncate font-mono text-xs text-primary">
                        {variablePlaceholder(variable.token)}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {variable.label}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="p-3 text-center text-xs text-muted-foreground">
                  No variables match &quot;{search}&quot;.
                </p>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
