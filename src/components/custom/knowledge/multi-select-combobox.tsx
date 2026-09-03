"use client";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect, useState } from "react";

/**
 * A reusable async-search multi-select, built from the chip-based
 * combobox primitives already shipped in `@/components/ui/combobox`
 * (`ComboboxChips`/`ComboboxChip`/`ComboboxChipsInput`) but never wired
 * up anywhere until now — the single-select `Combobox` used by the old
 * product picker only ever rendered `ComboboxInput`.
 *
 * Reused for the Products/Categories/Collections pickers on the new
 * knowledge item page, each backed by its own small search thunk.
 */
export function MultiSelectCombobox<T extends { id: string; name: string }>({
  items,
  value,
  onValueChange,
  onSearch,
  isLoading = false,
  placeholder = "Search…",
  emptyLabel = "No results found.",
  disabled = false,
}: {
  items: T[];
  value: T[];
  onValueChange: (next: T[]) => void;
  onSearch: (term: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
}) {
  const anchor = useComboboxAnchor();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    onSearch(debouncedSearch);
    // `onSearch` is an inline dispatch call at every call site, not a
    // stable reference — including it would re-run this on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return (
    <Combobox
      multiple
      items={items}
      value={value}
      onValueChange={onValueChange}
      onInputValueChange={setSearch}
      isItemEqualToValue={(a, b) => a.id === b.id}
      itemToStringLabel={(item) => item.name}
      disabled={disabled}
    >
      <ComboboxChips ref={anchor}>
        {value.map((item) => (
          <ComboboxChip key={item.id} aria-label={item.name}>
            {item.name}
          </ComboboxChip>
        ))}
        <ComboboxChipsInput
          placeholder={value.length === 0 ? placeholder : undefined}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{isLoading ? "Loading…" : emptyLabel}</ComboboxEmpty>
        <ComboboxList>
          {(item: T) => (
            <ComboboxItem key={item.id} value={item}>
              {item.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
