"use client";

import { useEffect, useId, useMemo } from "react";

import { IconChevronDown } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { FetchKnowledgeCategories } from "@/redux/api-slice/knowledge-rag-slice";

/** A knowledge category as the picker lists it. */
export type KnowledgeCategoryOption = {
  /** The category's id, as a string (what the combobox keys on). */
  id: string;
  name: string;
  /** Inactive categories are only offered to knowledge already filed under them. */
  isActive: boolean;
};

/**
 * The knowledge categories that can be picked from, loaded once for the page.
 * Call it once per screen and hand the result to each `KnowledgeCategoryPicker`,
 * so a screen with many pickers asks for the list a single time.
 */
export function useKnowledgeCategoryOptions() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const {
    FetchKnowledgeCategoriesData: data,
    FetchKnowledgeCategoriesIsLoading,
  } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.FetchKnowledgeCategoriesState,
  );

  useEffect(() => {
    if (storeCode && !data) dispatch(FetchKnowledgeCategories({ storeCode }));
    // Only the store decides whether the list has to be fetched (again).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, storeCode]);

  const options = useMemo<KnowledgeCategoryOption[]>(
    () =>
      (data?.categories ?? []).map((category) => ({
        id: String(category.id),
        name: category.name,
        isActive: category.is_active,
      })),
    [data],
  );

  return { options, isLoading: FetchKnowledgeCategoriesIsLoading };
}

/**
 * Picks any number of knowledge categories, or none. Controlled by the ids of
 * the chosen ones. It is always one line tall, however many are chosen: the
 * button shows the first name and how many more ("Shipping +2"), and the
 * choices are made in a list that opens under it.
 */
export function KnowledgeCategoryPicker({
  options,
  value,
  onChange,
  isLoading = false,
  disabled = false,
  placeholder = "Choose categories",
}: {
  options: KnowledgeCategoryOption[];
  value: number[];
  onChange: (next: number[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const selected = useMemo(
    () =>
      value
        .map((id) => options.find((option) => option.id === String(id)))
        .filter((option): option is KnowledgeCategoryOption => Boolean(option)),
    [options, value],
  );
  // A deactivated category stays on knowledge already filed under it, but
  // can't be given to anything else.
  const offered = useMemo(
    () =>
      options.filter(
        (option) => option.isActive || selected.some((s) => s.id === option.id),
      ),
    [options, selected],
  );

  const toggle = (option: KnowledgeCategoryOption, checked: boolean) =>
    onChange(
      checked
        ? [...value, Number(option.id)]
        : value.filter((id) => String(id) !== option.id),
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          title={selected.map((option) => option.name).join(", ") || undefined}
          className="w-full min-w-0 justify-between gap-2 font-normal"
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-left",
              selected.length === 0 && "text-muted-foreground",
            )}
          >
            {selected.length > 0 ? selected[0].name : placeholder}
          </span>
          {selected.length > 1 && (
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
              +{selected.length - 1}
            </span>
          )}
          <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-56 gap-2 p-2"
      >
        <div className="flex items-center justify-between px-1.5 text-xs">
          <span className="text-muted-foreground">
            {selected.length === 0
              ? "None chosen"
              : `${selected.length} Chosen`}
          </span>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => onChange([])}
            className="font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            Clear
          </button>
        </div>
        <ul className="flex max-h-60 flex-col overflow-y-auto">
          {offered.length === 0 && (
            <li className="px-1.5 py-2 text-sm text-muted-foreground">
              {isLoading ? "Loading…" : "No categories found."}
            </li>
          )}
          {offered.map((option) => {
            const isChosen = selected.some((entry) => entry.id === option.id);
            return (
              <li key={option.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm hover:bg-muted">
                  <Checkbox
                    checked={isChosen}
                    onCheckedChange={(checked) =>
                      toggle(option, checked === true)
                    }
                  />
                  <span className="min-w-0 flex-1 truncate">{option.name}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/** A picker with its label, for a form: "Categories (optional)" by default. */
export function KnowledgeCategoriesField({
  label = "Categories",
  hint,
  compact = false,
  ...pickerProps
}: Parameters<typeof KnowledgeCategoryPicker>[0] & {
  label?: string;
  /** A line under the field, e.g. what the choice applies to. */
  hint?: string;
  /** For inside a table row: no label or hint above and below it (the label
   * is the placeholder), so the row stays as tall as the field. */
  compact?: boolean;
}) {
  const labelId = useId();

  if (compact) {
    return (
      <div role="group" aria-label={label} className="min-w-0">
        <KnowledgeCategoryPicker
          placeholder={`${label} (optional)`}
          {...pickerProps}
        />
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="flex min-w-0 flex-col gap-1.5"
    >
      <span id={labelId} className="text-xs font-medium">
        {label}{" "}
        <span className="font-normal text-muted-foreground">(optional)</span>
      </span>
      <KnowledgeCategoryPicker {...pickerProps} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
