"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormik } from "formik";
import { z } from "zod";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { formikErrorsFromZod } from "@/lib/form-errors";

import { AIScopeField } from "@/components/custom/knowledge/ai-scope-field";
import { MultiFileUploadDropzone } from "@/components/custom/knowledge/file-upload-dropzone";
import { MultiSelectCombobox } from "@/components/custom/knowledge/multi-select-combobox";
import { POLICY_TYPE_OPTIONS } from "@/components/custom/knowledge/knowledge-meta";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  CreateKnowledgeItemsBulk,
  FetchCategoryOptions,
  FetchCollectionOptions,
  FetchProductOptions,
  type AIScope,
  type BulkKnowledgeItemContent,
  type KnowledgeType,
  type PolicyType,
  type ProductOption,
} from "@/redux/api-slice/knowledge-rag-slice";

/** The three sources this page can create — a narrower set than the full
 * `KnowledgeSource` union, which also carries legacy/unreachable values
 * (`product`, `category`, `offer`, `google_drive`) and `text`, not
 * offered here "for now". */
type AddableSource = "faq" | "url" | "file";

const SOURCE_OPTIONS: { value: AddableSource; label: string; hint: string }[] =
  [
    { value: "faq", label: "FAQ", hint: "Question & answer pairs" },
    { value: "url", label: "URL", hint: "A page or policy link" },
    { value: "file", label: "Document", hint: "PDF or DOCX" },
  ];

/** Local, page-scoped variant of the shared `POLICY_TYPE_OPTIONS` — drops
 * `generic_link` in favor of an "Other" option that reveals a manual
 * title input. Deliberately NOT merged into `knowledge-meta.ts`'s shared
 * list: `policy-manager.tsx` (a separate, untouched feature) depends on
 * that exact list including `generic_link`. */
type LocalUrlType = PolicyType | "other";

const URL_TYPE_OPTIONS: { value: LocalUrlType; label: string }[] = [
  ...POLICY_TYPE_OPTIONS.filter((option) => option.value !== "generic_link"),
  { value: "other", label: "Other" },
];

const FAQ_CAP = 20;
const URL_CAP = 20;
const FILE_CAP = 15;

type FaqRow = { localId: string; question: string; answer: string };
type UrlRow = {
  localId: string;
  url: string;
  urlType: LocalUrlType | "";
  title: string;
};

function emptyFaqRow(): FaqRow {
  return { localId: crypto.randomUUID(), question: "", answer: "" };
}

function emptyUrlRow(): UrlRow {
  return { localId: crypto.randomUUID(), url: "", urlType: "", title: "" };
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

type FormValues = {
  source: AddableSource;
  type: KnowledgeType;
  aiScope: AIScope[];
  products: ProductOption[];
  categories: ProductOption[];
  collections: ProductOption[];
  faqRows: FaqRow[];
  urlRows: UrlRow[];
  files: File[];
};

// Deliberately loose shape-only schemas (no `.min()`/required checks on
// individual fields): `faqRows` and `urlRows` both always exist in form
// state (each starts with one default empty row) regardless of which one
// is the active `source`, so validating either array unconditionally
// would permanently fail on the *inactive* array's still-empty default
// row and block every submission no matter what the user actually filled
// in. The real per-field "is this required" checks only run, per row,
// against the currently active source's array — see `superRefine` below.
const faqRowSchema = z.object({
  localId: z.string(),
  question: z.string(),
  answer: z.string(),
});

const urlRowSchema = z.object({
  localId: z.string(),
  url: z.string(),
  urlType: z.string(),
  title: z.string(),
});

const formSchema = z
  .object({
    source: z.enum(["faq", "url", "file"]),
    type: z.enum(["general", "product"]),
    aiScope: z
      .array(z.enum(["sales", "support", "social", "internal"]))
      .min(1, "Select at least one AI"),
    products: z.array(z.object({ id: z.string(), name: z.string() })),
    categories: z.array(z.object({ id: z.string(), name: z.string() })),
    collections: z.array(z.object({ id: z.string(), name: z.string() })),
    faqRows: z.array(faqRowSchema).max(FAQ_CAP, `Maximum ${FAQ_CAP} at a time`),
    urlRows: z.array(urlRowSchema).max(URL_CAP, `Maximum ${URL_CAP} at a time`),
    files: z
      .array(z.custom<File>((value) => value instanceof File))
      .max(FILE_CAP, `Maximum ${FILE_CAP} at a time`),
  })
  .superRefine((values, ctx) => {
    if (
      values.type === "product" &&
      values.products.length === 0 &&
      values.categories.length === 0 &&
      values.collections.length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["products"],
        message: "Select at least one product, category, or collection",
      });
    }

    if (values.source === "faq") {
      if (values.faqRows.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["faqRows"],
          message: "Add at least one FAQ",
        });
      }
      values.faqRows.forEach((row, index) => {
        if (!row.question.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["faqRows", index, "question"],
            message: "Question is required",
          });
        }
        if (!row.answer.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["faqRows", index, "answer"],
            message: "Answer is required",
          });
        }
      });
    }

    if (values.source === "url") {
      if (values.urlRows.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["urlRows"],
          message: "Add at least one URL",
        });
      }
      values.urlRows.forEach((row, index) => {
        if (!row.url.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["urlRows", index, "url"],
            message: "URL is required",
          });
        } else if (!isValidUrl(row.url)) {
          ctx.addIssue({
            code: "custom",
            path: ["urlRows", index, "url"],
            message: "Enter a valid URL",
          });
        }
      });
    }

    if (values.source === "file" && values.files.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["files"],
        message: "Select at least one file",
      });
    }
  });

/** Reads the first message out of whatever shape a server error came
 * back as — a plain string, an array of strings, or a nested object (DRF
 * field-error style). */
function firstErrorMessage(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(String).find(Boolean);
  if (typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      const message = firstErrorMessage(nested);
      if (message) return message;
    }
  }
  return undefined;
}

export function NewKnowledgePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
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
  const { CreateKnowledgeItemsBulkIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.CreateKnowledgeItemsBulkState,
  );

  // Server-side errors from the last failed submit — separate from
  // Formik's client-side (zod) errors, since they come back per-index
  // after a real request rather than from local validation. Cleared at
  // the start of every new submit attempt.
  const [rowErrors, setRowErrors] = useState<Record<string, unknown>[] | null>(
    null,
  );
  const [banner, setBanner] = useState<string | null>(null);

  const formik = useFormik<FormValues>({
    initialValues: {
      source: "faq",
      type: "general",
      aiScope: [],
      products: [],
      categories: [],
      collections: [],
      faqRows: [emptyFaqRow()],
      urlRows: [emptyUrlRow()],
      files: [],
    },
    validate: (values) => {
      const result = formSchema.safeParse(values);
      return result.success ? {} : formikErrorsFromZod(result.error.issues);
    },
    onSubmit: async (values) => {
      if (!storeCode) return;

      setRowErrors(null);
      setBanner(null);

      const shared = {
        storeCode,
        type: values.type,
        source: values.source,
        aiScope: values.aiScope,
        productIds: values.products.map((product) => product.id),
        categoryIds: values.categories.map((category) => category.id),
        collectionIds: values.collections.map((collection) => collection.id),
      };

      const result = await dispatch(
        values.source === "file"
          ? CreateKnowledgeItemsBulk({ ...shared, files: values.files })
          : CreateKnowledgeItemsBulk({
              ...shared,
              items: buildItems(values),
            }),
      );

      if (CreateKnowledgeItemsBulk.fulfilled.match(result)) {
        router.push("/knowledge/library");
        return;
      }

      const payload = result.payload as
        | { data?: unknown; message?: string }
        | undefined;
      if (Array.isArray(payload?.data)) {
        setRowErrors(payload.data as Record<string, unknown>[]);
      } else {
        setBanner(
          firstErrorMessage(payload?.data) ||
            payload?.message ||
            "Something went wrong. Please try again.",
        );
      }
    },
  });

  const values = formik.values;
  const isSubmitting = CreateKnowledgeItemsBulkIsLoading;
  const showErrors = formik.submitCount > 0;

  const activeCount =
    values.source === "faq"
      ? values.faqRows.length
      : values.source === "url"
        ? values.urlRows.length
        : values.files.length;
  const activeCap =
    values.source === "faq"
      ? FAQ_CAP
      : values.source === "url"
        ? URL_CAP
        : FILE_CAP;

  const faqRowErrors = (formik.errors.faqRows ?? []) as Array<
    Partial<Record<keyof FaqRow, string>>
  >;
  const urlRowErrors = (formik.errors.urlRows ?? []) as Array<
    Partial<Record<keyof UrlRow, string>>
  >;

  const handleSourceChange = (next: AddableSource) => {
    if (next === values.source) return;
    setRowErrors(null);
    setBanner(null);
    formik.setValues({
      ...values,
      source: next,
      faqRows: [emptyFaqRow()],
      urlRows: [emptyUrlRow()],
      files: [],
    });
  };

  const handleTypeChange = (next: KnowledgeType) => {
    formik.setValues({
      ...values,
      type: next,
      products: next === "general" ? [] : values.products,
      categories: next === "general" ? [] : values.categories,
      collections: next === "general" ? [] : values.collections,
    });
  };

  const updateFaqRow = (index: number, patch: Partial<FaqRow>) => {
    formik.setFieldValue(
      "faqRows",
      values.faqRows.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    );
  };
  const removeFaqRow = (index: number) => {
    const next = values.faqRows.filter((_, i) => i !== index);
    formik.setFieldValue("faqRows", next.length > 0 ? next : [emptyFaqRow()]);
  };

  const updateUrlRow = (index: number, patch: Partial<UrlRow>) => {
    formik.setFieldValue(
      "urlRows",
      values.urlRows.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    );
  };
  const removeUrlRow = (index: number) => {
    const next = values.urlRows.filter((_, i) => i !== index);
    formik.setFieldValue("urlRows", next.length > 0 ? next : [emptyUrlRow()]);
  };

  return (
    <div className="flex w-full flex-col gap-6 p-4">
      <div className="flex flex-col gap-1">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href="/knowledge/library">
            <IconArrowLeft className="size-4" />
            Back to Library
          </Link>
        </Button>
        <Typography variant="h4" as="h1">
          New Knowledge Item
        </Typography>
        <Typography variant="muted">
          Add one or more items in a single request — every field is on this
          page, no steps to click through.
        </Typography>
      </div>

      {banner && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {banner}
        </div>
      )}

      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>What are you adding?</CardTitle>
            <CardDescription>
              Pick one content type — you can add several of this type below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {SOURCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSourceChange(option.value)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors",
                    values.source === option.value
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/60 hover:border-border hover:bg-muted/40",
                  )}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.hint}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where does this apply?</CardTitle>
            <CardDescription>
              These settings apply to every item you add below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Scope</FieldLabel>
                <RadioGroup
                  value={values.type}
                  onValueChange={(next) =>
                    handleTypeChange(next as KnowledgeType)
                  }
                  className="grid-cols-1 sm:grid-cols-2 lg:w-1/2"
                >
                  <Label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 p-2.5 has-data-checked:border-primary/40 has-data-checked:bg-primary/5">
                    <RadioGroupItem value="general" />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">General</span>
                      <span className="text-xs text-muted-foreground">
                        Store-wide — policies, FAQs, brand info.
                      </span>
                    </span>
                  </Label>
                  <Label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 p-2.5 has-data-checked:border-primary/40 has-data-checked:bg-primary/5">
                    <RadioGroupItem value="product" />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">Product</span>
                      <span className="text-xs text-muted-foreground">
                        Tied to specific products, categories, or collections.
                      </span>
                    </span>
                  </Label>
                </RadioGroup>
              </Field>

              {values.type === "product" && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field>
                    <FieldLabel>Products</FieldLabel>
                    <MultiSelectCombobox
                      items={FetchProductOptionsListData}
                      value={values.products}
                      onValueChange={(next) =>
                        formik.setFieldValue("products", next)
                      }
                      onSearch={(search) => {
                        if (storeCode)
                          dispatch(FetchProductOptions({ storeCode, search }));
                      }}
                      isLoading={FetchProductOptionsIsLoading}
                      placeholder="Search products…"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Categories</FieldLabel>
                    <MultiSelectCombobox
                      items={FetchCategoryOptionsListData}
                      value={values.categories}
                      onValueChange={(next) =>
                        formik.setFieldValue("categories", next)
                      }
                      onSearch={(search) => {
                        if (storeCode)
                          dispatch(FetchCategoryOptions({ storeCode, search }));
                      }}
                      isLoading={FetchCategoryOptionsIsLoading}
                      placeholder="Search categories…"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Collections</FieldLabel>
                    <MultiSelectCombobox
                      items={FetchCollectionOptionsListData}
                      value={values.collections}
                      onValueChange={(next) =>
                        formik.setFieldValue("collections", next)
                      }
                      onSearch={(search) => {
                        if (storeCode)
                          dispatch(
                            FetchCollectionOptions({ storeCode, search }),
                          );
                      }}
                      isLoading={FetchCollectionOptionsIsLoading}
                      placeholder="Search collections…"
                    />
                  </Field>
                  {showErrors && formik.errors.products && (
                    <p className="text-xs text-destructive sm:col-span-3">
                      {formik.errors.products as string}
                    </p>
                  )}
                </div>
              )}

              <AIScopeField
                value={values.aiScope}
                onChange={(next) => formik.setFieldValue("aiScope", next)}
                error={
                  showErrors ? (formik.errors.aiScope as string) : undefined
                }
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {SOURCE_OPTIONS.find((o) => o.value === values.source)?.label}{" "}
              items
            </CardTitle>
            <CardDescription>
              {activeCount} / {activeCap} added
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {values.source === "faq" &&
              values.faqRows.map((row, index) => (
                <div
                  key={row.localId}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Item {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFaqRow(index)}
                      aria-label="Remove item"
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <Field>
                      <FieldLabel>Question</FieldLabel>
                      <Input
                        placeholder="Do you offer free shipping?"
                        autoComplete="off"
                        value={row.question}
                        onChange={(event) =>
                          updateFaqRow(index, { question: event.target.value })
                        }
                        aria-invalid={
                          showErrors && Boolean(faqRowErrors[index]?.question)
                        }
                      />
                      {showErrors && faqRowErrors[index]?.question && (
                        <p className="text-xs text-destructive">
                          {faqRowErrors[index]?.question}
                        </p>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel>Answer</FieldLabel>
                      <Textarea
                        rows={1}
                        placeholder="Yes, orders above ₹999 qualify for free shipping."
                        value={row.answer}
                        onChange={(event) =>
                          updateFaqRow(index, { answer: event.target.value })
                        }
                        aria-invalid={
                          showErrors && Boolean(faqRowErrors[index]?.answer)
                        }
                      />
                      {showErrors && faqRowErrors[index]?.answer && (
                        <p className="text-xs text-destructive">
                          {faqRowErrors[index]?.answer}
                        </p>
                      )}
                    </Field>
                  </div>
                  {rowErrors?.[index] &&
                    Object.keys(rowErrors[index]).length > 0 && (
                      <p className="text-xs text-destructive">
                        {firstErrorMessage(rowErrors[index])}
                      </p>
                    )}
                </div>
              ))}

            {values.source === "faq" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={values.faqRows.length >= FAQ_CAP}
                onClick={() =>
                  formik.setFieldValue("faqRows", [
                    ...values.faqRows,
                    emptyFaqRow(),
                  ])
                }
              >
                <IconPlus className="size-4" />
                Add another
              </Button>
            )}

            {values.source === "url" &&
              values.urlRows.map((row, index) => (
                <div
                  key={row.localId}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Item {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeUrlRow(index)}
                      aria-label="Remove item"
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-3">
                    <Field className="lg:col-span-2">
                      <FieldLabel>URL</FieldLabel>
                      <Input
                        placeholder="https://company.com/pages/shipping"
                        autoComplete="off"
                        value={row.url}
                        onChange={(event) =>
                          updateUrlRow(index, { url: event.target.value })
                        }
                        aria-invalid={
                          showErrors && Boolean(urlRowErrors[index]?.url)
                        }
                      />
                      {showErrors && urlRowErrors[index]?.url && (
                        <p className="text-xs text-destructive">
                          {urlRowErrors[index]?.url}
                        </p>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel>Type</FieldLabel>
                      <Select
                        value={row.urlType || undefined}
                        onValueChange={(next) =>
                          updateUrlRow(index, { urlType: next as LocalUrlType })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          {URL_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  {row.urlType === "other" && (
                    <Field>
                      <FieldLabel>Title</FieldLabel>
                      <Input
                        placeholder="Sizing Guide"
                        autoComplete="off"
                        value={row.title}
                        onChange={(event) =>
                          updateUrlRow(index, { title: event.target.value })
                        }
                      />
                    </Field>
                  )}
                  {rowErrors?.[index] &&
                    Object.keys(rowErrors[index]).length > 0 && (
                      <p className="text-xs text-destructive">
                        {firstErrorMessage(rowErrors[index])}
                      </p>
                    )}
                </div>
              ))}

            {values.source === "url" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={values.urlRows.length >= URL_CAP}
                onClick={() =>
                  formik.setFieldValue("urlRows", [
                    ...values.urlRows,
                    emptyUrlRow(),
                  ])
                }
              >
                <IconPlus className="size-4" />
                Add another
              </Button>
            )}

            {values.source === "file" && (
              <MultiFileUploadDropzone
                files={values.files}
                onFilesSelected={(selected) =>
                  formik.setFieldValue(
                    "files",
                    [...values.files, ...selected].slice(0, FILE_CAP),
                  )
                }
                onRemoveFile={(index) =>
                  formik.setFieldValue(
                    "files",
                    values.files.filter((_, i) => i !== index),
                  )
                }
                errors={values.files.map(
                  (_, index) =>
                    (rowErrors?.[index] &&
                      firstErrorMessage(rowErrors[index])) ||
                    undefined,
                )}
                maxFiles={FILE_CAP}
              />
            )}

            {showErrors &&
              ((values.source === "faq" &&
                formik.errors.faqRows === "string") ||
                (values.source === "url" &&
                  formik.errors.urlRows === "string") ||
                (values.source === "file" &&
                  typeof formik.errors.files === "string")) && (
                <p className="text-xs text-destructive">
                  {values.source === "faq"
                    ? (formik.errors.faqRows as unknown as string)
                    : values.source === "url"
                      ? (formik.errors.urlRows as unknown as string)
                      : (formik.errors.files as unknown as string)}
                </p>
              )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-start gap-3 border-t border-border py-3">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner data-icon="inline-start" />
                Submitting…
              </>
            ) : (
              <>
                <IconDeviceFloppy />
                Submit {activeCount} item{activeCount === 1 ? "" : "s"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

/** Builds the `items` array for a non-file bulk submit — pure content
 * per row, matching `BulkKnowledgeItemContent`. */
function buildItems(values: FormValues): BulkKnowledgeItemContent[] {
  if (values.source === "faq") {
    return values.faqRows.map((row) => ({
      question: row.question.trim(),
      answer: row.answer.trim(),
    }));
  }

  return values.urlRows.map((row) => {
    const title =
      row.urlType === "other"
        ? row.title.trim() || undefined
        : URL_TYPE_OPTIONS.find((option) => option.value === row.urlType)
            ?.label;
    return { url: row.url.trim(), title };
  });
}
