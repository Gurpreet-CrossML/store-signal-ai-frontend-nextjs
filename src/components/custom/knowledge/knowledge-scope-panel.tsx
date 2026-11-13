"use client";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FetchCategoryOptions,
  FetchCollectionOptions,
  FetchProductOptions,
  type AIScope,
} from "@/redux/api-slice/knowledge-rag-slice";
import { AI_SCOPE_OPTIONS } from "@/components/custom/knowledge/knowledge-meta";
import {
  validateScope,
  type KnowledgeScope,
  type ScopeKind,
} from "@/components/custom/knowledge/knowledge-scope";
import { MultiSelectCombobox } from "@/components/custom/knowledge/multi-select-combobox";
import { cn } from "@/lib/utils";

const APPLIES_TO: { value: ScopeKind; label: string; hint: string }[] = [
  {
    value: "general",
    label: "Whole store",
    hint: "Store-wide info like policies, shipping and contact details.",
  },
  {
    value: "product",
    label: "Products",
    hint: "Only when shoppers ask about products you pick.",
  },
  {
    value: "category",
    label: "Categories",
    hint: "Only for products in the categories you pick.",
  },
  {
    value: "collection",
    label: "Collections",
    hint: "Only for products in the collections you pick.",
  },
];

const USED_BY_HINT: Record<AIScope, string> = {
  sales: "Helps shoppers find and buy",
  support: "Order, delivery and policy questions",
  social: "Comments and DMs",
  internal: "Helps your team",
};

/**
 * "Who uses it and where": what the knowledge applies to (the whole store, or
 * chosen products, categories or collections) and which AI may use it.
 * Controlled; the pickers load their own options for the selected store.
 */
export function KnowledgeScopePanel({
  value,
  onChange,
  description = "Applies to everything you add in this step.",
  showErrors = false,
  bordered = true,
  appliesToLocked = false,
  usedByLocked = false,
}: {
  value: KnowledgeScope;
  onChange: (next: KnowledgeScope) => void;
  description?: string;
  /** Show what is missing (an AI, or a product/category/collection pick). */
  showErrors?: boolean;
  /** Draw its own card; turn off where the parent already provides one. */
  bordered?: boolean;
  /** Show what it applies to, but don't let it be changed. */
  appliesToLocked?: boolean;
  /** Show which AI use it, but don't let that be changed. */
  usedByLocked?: boolean;
}) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchProductOptionsListData, FetchProductOptionsIsLoading } =
    useAppSelector(
      (state) => state.GetKnowledgeRagReducer.FetchProductOptionsState,
    );
  const { FetchCategoryOptionsListData, FetchCategoryOptionsIsLoading } =
    useAppSelector(
      (state) => state.GetKnowledgeRagReducer.FetchCategoryOptionsState,
    );
  const { FetchCollectionOptionsListData, FetchCollectionOptionsIsLoading } =
    useAppSelector(
      (state) => state.GetKnowledgeRagReducer.FetchCollectionOptionsState,
    );

  const errors = showErrors ? validateScope(value) : {};

  const changeKind = (scopeKind: ScopeKind) =>
    onChange({
      ...value,
      scopeKind,
      products: scopeKind === "product" ? value.products : [],
      categories: scopeKind === "category" ? value.categories : [],
      collections: scopeKind === "collection" ? value.collections : [],
    });

  const toggleAI = (scope: AIScope, checked: boolean) =>
    onChange({
      ...value,
      aiScope: checked
        ? [...value.aiScope, scope]
        : value.aiScope.filter((entry) => entry !== scope),
    });

  const picker = (kind: ScopeKind) => {
    if (kind === "product")
      return (
        <MultiSelectCombobox
          items={FetchProductOptionsListData}
          value={value.products}
          onValueChange={(products) => onChange({ ...value, products })}
          onSearch={(search) => {
            if (storeCode) dispatch(FetchProductOptions({ storeCode, search }));
          }}
          isLoading={FetchProductOptionsIsLoading}
          disabled={appliesToLocked}
          placeholder="Search products…"
        />
      );
    if (kind === "category")
      return (
        <MultiSelectCombobox
          items={FetchCategoryOptionsListData}
          value={value.categories}
          onValueChange={(categories) => onChange({ ...value, categories })}
          onSearch={(search) => {
            if (storeCode)
              dispatch(FetchCategoryOptions({ storeCode, search }));
          }}
          isLoading={FetchCategoryOptionsIsLoading}
          disabled={appliesToLocked}
          placeholder="Search categories…"
        />
      );
    if (kind === "collection")
      return (
        <MultiSelectCombobox
          items={FetchCollectionOptionsListData}
          value={value.collections}
          onValueChange={(collections) => onChange({ ...value, collections })}
          onSearch={(search) => {
            if (storeCode)
              dispatch(FetchCollectionOptions({ storeCode, search }));
          }}
          isLoading={FetchCollectionOptionsIsLoading}
          disabled={appliesToLocked}
          placeholder="Search collections…"
        />
      );
    return null;
  };

  return (
    <section
      aria-label="Who uses it and where"
      className={cn(
        "flex flex-col gap-4 text-sm",
        bordered && "rounded-xl border bg-card p-4",
      )}
    >
      <div>
        <h2 className="font-semibold">Who uses it and where</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-xs font-semibold text-muted-foreground">
          Applies to
        </legend>
        <RadioGroup
          value={value.scopeKind}
          onValueChange={(next) => changeKind(next as ScopeKind)}
          disabled={appliesToLocked}
          className="gap-3"
        >
          {APPLIES_TO.map(({ value: kind, label, hint }) => (
            <div key={kind} className="flex flex-col gap-2">
              <Label className="items-start gap-2.5 font-normal">
                <RadioGroupItem value={kind} className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </span>
              </Label>
              {value.scopeKind === kind && kind !== "general" && (
                <div className="pl-6.5">{picker(kind)}</div>
              )}
            </div>
          ))}
        </RadioGroup>
        {errors.selection && (
          <p className="text-xs text-destructive">{errors.selection}</p>
        )}
      </fieldset>

      <hr className="border-border" />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-xs font-semibold text-muted-foreground">
          Used by
        </legend>
        {AI_SCOPE_OPTIONS.map(({ value: scope, label }) => (
          <Label key={scope} className="items-start gap-2.5 font-normal">
            <Checkbox
              className="mt-0.5"
              checked={value.aiScope.includes(scope)}
              disabled={usedByLocked}
              onCheckedChange={(checked) => toggleAI(scope, checked === true)}
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">
                {USED_BY_HINT[scope]}
              </span>
            </span>
          </Label>
        ))}
        {errors.aiScope && (
          <p className="text-xs text-destructive">{errors.aiScope}</p>
        )}
      </fieldset>
    </section>
  );
}
