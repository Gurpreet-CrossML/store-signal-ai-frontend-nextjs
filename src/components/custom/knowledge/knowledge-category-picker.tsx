"use client";

import { useEffect, useId, useMemo } from "react";

import { CheckboxMultiSelect } from "@/components/custom/checkbox-multi-select";
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
 * button shows the first two names and how many more ("Shipping, Returns
 * +2"), and the choices are made in a list that opens under it.
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
  // A deactivated category stays on knowledge already filed under it, but
  // can't be given to anything else.
  const offered = useMemo(
    () =>
      options.filter(
        (option) => option.isActive || value.includes(Number(option.id)),
      ),
    [options, value],
  );

  return (
    <CheckboxMultiSelect
      options={offered.map((option) => ({
        value: option.id,
        label: option.name,
      }))}
      value={value.map(String)}
      onChange={(next) => onChange(next.map(Number))}
      placeholder={placeholder}
      emptyMessage="No categories found."
      isLoading={isLoading}
      disabled={disabled}
    />
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
