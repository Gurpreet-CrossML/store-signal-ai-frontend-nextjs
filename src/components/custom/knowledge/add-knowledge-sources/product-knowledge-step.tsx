"use client";

import { useEffect, useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Typography } from "@/components/ui/typography";
import { useDebounce } from "@/hooks/use-debounce";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchKnowledgeItems,
  FetchProductOptions,
  type KnowledgeItem,
  type ProductOption,
} from "@/redux/api-slice/knowledge-rag-slice";
import {
  PRODUCT_SOURCE_OPTIONS,
  type AddKnowledgeSource,
} from "@/components/custom/knowledge/knowledge-meta";
import { OptionCard } from "@/components/custom/knowledge/option-card";
import { KnowledgeEntriesPanel } from "@/components/custom/knowledge/knowledge-entries-panel";
import { UploadFileStep } from "@/components/custom/knowledge/add-knowledge-sources/upload-file-step";

export function ProductKnowledgeStep({
  item,
  onBack,
  onDone,
}: {
  item?: KnowledgeItem | null;
  onBack?: () => void;
  onDone: () => void;
}) {
  const dispatch = useAppDispatch();
  const isManaging = Boolean(item?.id);
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { FetchProductOptionsListData, FetchProductOptionsIsLoading } =
    useAppSelector(
      (state) => state.GetKnowledgeRagReducer.FetchProductOptionsState,
    );
  const { FetchKnowledgeItemsListData } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.FetchKnowledgeItemsState,
  );

  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(
    item?.productId
      ? { id: item.productId, name: item.productName ?? item.productId }
      : null,
  );
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [sourceType, setSourceType] = useState<AddKnowledgeSource | null>(null);

  useEffect(() => {
    if (isManaging || !storeCode) return;
    dispatch(FetchProductOptions({ storeCode, search: debouncedSearch }));
  }, [isManaging, storeCode, debouncedSearch, dispatch]);

  // The library list loads one 25-item page at a time; the panel below
  // needs every entry for this product regardless of which page happens
  // to be cached, so it fetches its own larger page.
  useEffect(() => {
    if (!isManaging || !storeCode) return;
    dispatch(FetchKnowledgeItems({ storeCode, pageSize: 100 }));
  }, [isManaging, storeCode, dispatch]);

  const handleProductChange = (value: string | null) => {
    const product =
      FetchProductOptionsListData.find((entry) => entry.id === value) ?? null;
    setSelectedProduct(product);
    setSourceType(null);
  };

  const productEntries =
    isManaging && selectedProduct
      ? FetchKnowledgeItemsListData.results.filter(
          (entry) => entry.productId === selectedProduct.id,
        )
      : [];

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-1">
      <FieldGroup>
        <Field>
          <FieldLabel>Product</FieldLabel>
          <Combobox
            disabled={isManaging}
            items={FetchProductOptionsListData.map((product) => product.id)}
            value={selectedProduct?.id ?? null}
            onValueChange={handleProductChange}
            onInputValueChange={setSearch}
            itemToStringLabel={(id) =>
              FetchProductOptionsListData.find((product) => product.id === id)
                ?.name ??
              (selectedProduct?.id === id ? selectedProduct.name : String(id))
            }
          >
            <ComboboxInput
              placeholder="Search products…"
              disabled={isManaging}
            />
            <ComboboxContent>
              <ComboboxEmpty>
                {FetchProductOptionsIsLoading
                  ? "Loading products…"
                  : "No products found."}
              </ComboboxEmpty>
              <ComboboxList>
                {(id) => (
                  <ComboboxItem key={id as string} value={id}>
                    {FetchProductOptionsListData.find(
                      (product) => product.id === id,
                    )?.name ?? id}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>
      </FieldGroup>

      {isManaging && selectedProduct && (
        <KnowledgeEntriesPanel
          entries={productEntries}
          emptyLabel="No data added yet for this product."
        />
      )}

      {!isManaging && selectedProduct && (
        <div className="flex flex-col gap-3">
          <div>
            <Typography variant="small" as="p" className="font-medium">
              How do you want to add this?
            </Typography>
            <Typography variant="muted" className="text-xs">
              Choose how you&apos;d like to add this knowledge.
            </Typography>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PRODUCT_SOURCE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                description={option.description}
                icon={option.icon}
                tone={option.tone}
                selected={sourceType === option.value}
                onClick={() => setSourceType(option.value)}
              />
            ))}
          </div>
        </div>
      )}

      {!isManaging && selectedProduct && sourceType === "file" && (
        <UploadFileStep
          knowledgeType="product"
          product={selectedProduct}
          onBack={() => setSourceType(null)}
          onDone={onDone}
        />
      )}
      {!isManaging && !sourceType && onBack && (
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        </DialogFooter>
      )}
    </div>
  );
}
