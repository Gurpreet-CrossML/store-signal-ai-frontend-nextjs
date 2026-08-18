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
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";

/**
 * Pick several of something, as chips in one field.
 *
 * Lifted out of the help desk when the create-ticket dialog needed the
 * same tag picker: two copies would have drifted the moment one of them
 * gained paging or a different empty state.
 */
export function MultiSelectCombobox({
  options,
  value,
  onValueChange,
  placeholder,
  emptyMessage,
  onSearchChange,
  hasMore = false,
  isLoading = false,
  onLoadMore,
  portalContainer,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder: string;
  emptyMessage: string;
  onSearchChange?: (value: string) => void;
  hasMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
  /**
   * Where to portal the dropdown. Needed inside a modal dialog, whose
   * scroll lock blocks wheel events outside its own content — see
   * ComboboxContent.
   */
  portalContainer?: HTMLElement | null;
}) {
  const anchor = useComboboxAnchor();
  const optionLabels = new Map(
    options.map((option) => [option.value, option.label]),
  );
  const values = options.map((option) => option.value);

  return (
    <Combobox
      multiple
      autoHighlight
      items={values}
      value={value}
      onValueChange={onValueChange}
      itemToStringLabel={(item) => optionLabels.get(item) ?? item}
      onInputValueChange={(inputValue) => onSearchChange?.(inputValue)}
    >
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(selectedValues) => (
            <>
              {(selectedValues as string[]).map((selectedValue) => (
                <ComboboxChip key={selectedValue}>
                  {optionLabels.get(selectedValue) ?? selectedValue}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder={placeholder} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor} container={portalContainer}>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList
          onScroll={(event) => {
            const target = event.currentTarget;
            if (
              hasMore &&
              !isLoading &&
              target.scrollHeight - target.scrollTop <= target.clientHeight + 40
            ) {
              onLoadMore?.();
            }
          }}
        >
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {optionLabels.get(item) ?? item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
