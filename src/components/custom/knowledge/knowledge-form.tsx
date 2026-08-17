"use client";

import { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import {
  IconCloudUpload,
  IconDeviceFloppy,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypeTxt,
  IconX,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import {
  CreateKnowledgeItem,
  FetchCategoryOptions,
  FetchProductOptions,
  UpdateKnowledgeItem,
  type AIScope,
  type KnowledgeItem,
  type KnowledgeType,
  type PolicyType,
  type SyncFrequency,
} from "@/redux/api-slice/knowledge-rag-slice";
import {
  AI_SCOPE_OPTIONS,
  KNOWLEDGE_TYPE_META,
  POLICY_TYPE_OPTIONS,
} from "@/components/custom/knowledge/knowledge-meta";

type FormValues = {
  title: string;
  content: string;
  productId: string;
  categoryIds: string[];
  question: string;
  answer: string;
  url: string;
  policyType: PolicyType | "";
  syncFrequency: SyncFrequency;
  driveUrl: string;
  offerName: string;
  couponCode: string;
  startDate: string;
  endDate: string;
  conditions: string;
  aiScope: AIScope[];
  tags: string;
  status: "active" | "disabled";
};

function emptyValues(): FormValues {
  return {
    title: "",
    content: "",
    productId: "",
    categoryIds: [],
    question: "",
    answer: "",
    url: "",
    policyType: "",
    syncFrequency: "weekly",
    driveUrl: "",
    offerName: "",
    couponCode: "",
    startDate: "",
    endDate: "",
    conditions: "",
    aiScope: [],
    tags: "",
    status: "active",
  };
}

function valuesFromItem(item: KnowledgeItem): FormValues {
  return {
    title: item.title ?? "",
    content: item.content ?? "",
    productId: item.productId ?? "",
    categoryIds: item.categoryIds ?? [],
    question: item.question ?? "",
    answer: item.answer ?? "",
    url: item.url ?? "",
    policyType: item.policyType ?? "",
    syncFrequency: item.syncFrequency ?? "weekly",
    driveUrl: item.driveUrl ?? "",
    offerName: item.offerName ?? "",
    couponCode: item.couponCode ?? "",
    startDate: item.startDate ? item.startDate.slice(0, 10) : "",
    endDate: item.endDate ? item.endDate.slice(0, 10) : "",
    conditions: item.conditions ?? "",
    aiScope: item.aiScope ?? [],
    tags: (item.tags ?? []).join(", "),
    status: item.status === "disabled" ? "disabled" : "active",
  };
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validate(
  type: KnowledgeType,
  values: FormValues,
  hasExistingFile: boolean,
  hasNewFile: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (type !== "faq" && type !== "offer" && !values.title.trim()) {
    errors.title = "Title is required";
  }

  switch (type) {
    case "general":
      if (!values.content.trim()) errors.content = "Content is required";
      break;
    case "product":
      if (!values.productId) errors.productId = "Select a product";
      if (!values.content.trim() && !hasNewFile && !hasExistingFile) {
        errors.content = "Add content or upload a document";
      }
      break;
    case "category":
      if (values.categoryIds.length === 0) {
        errors.categoryIds = "Select at least one category";
      }
      if (!values.content.trim() && !hasNewFile && !hasExistingFile) {
        errors.content = "Add content or upload a document";
      }
      break;
    case "faq":
      if (!values.question.trim()) errors.question = "Question is required";
      if (!values.answer.trim()) errors.answer = "Answer is required";
      break;
    case "policy":
      if (!values.url.trim()) errors.url = "URL is required";
      else if (!isValidUrl(values.url)) errors.url = "Enter a valid URL";
      if (!values.policyType) errors.policyType = "Select a policy type";
      break;
    case "document":
      if (!hasNewFile && !hasExistingFile) errors.file = "Upload a file";
      break;
    case "google_drive":
      if (!values.driveUrl.trim()) {
        errors.driveUrl = "Google Drive URL is required";
      } else if (!isValidUrl(values.driveUrl)) {
        errors.driveUrl = "Enter a valid URL";
      }
      break;
    case "offer":
      if (!values.offerName.trim()) errors.offerName = "Offer name is required";
      if (!values.couponCode.trim()) errors.couponCode = "Coupon code is required";
      break;
  }

  if (values.aiScope.length === 0) {
    errors.aiScope = "Select at least one AI";
  }

  return errors;
}

function FileTypeIcon({ fileType, className }: { fileType?: string; className?: string }) {
  if (fileType?.includes("pdf")) return <IconFileTypePdf className={className} />;
  if (fileType?.includes("word") || fileType?.includes("docx")) {
    return <IconFileTypeDocx className={className} />;
  }
  return <IconFileTypeTxt className={className} />;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

/** Local mock uploader for the Add/Edit sheet — visually consistent with
 * drop-zone.tsx but not wired to it, since that component is hard-coded to
 * the protected Document Library's own upload thunk. */
function MockFileUpload({
  file,
  existingFileName,
  onFileSelected,
  onClear,
}: {
  file: File | null;
  existingFileName?: string;
  onFileSelected: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  if (file || existingFileName) {
    const name = file?.name ?? existingFileName ?? "";
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
        <FileTypeIcon
          fileType={file?.type ?? existingFileName}
          className="size-5 shrink-0 text-muted-foreground"
        />
        <div className="min-w-0 flex-1">
          <Typography variant="small" as="p" className="truncate">
            {name}
          </Typography>
          {file && (
            <Typography variant="muted" className="text-xs">
              {formatBytes(file.size)}
            </Typography>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClear}
          aria-label="Remove file"
        >
          <IconX className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        const dropped = event.dataTransfer.files?.[0];
        if (dropped) onFileSelected(dropped);
      }}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-6 py-6 text-center transition-colors",
        dragOver
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-muted/50",
      )}
    >
      <IconCloudUpload
        className={cn("size-7", dragOver ? "text-primary" : "text-muted-foreground")}
      />
      <Typography variant="small" as="p">
        Drag &amp; drop a file here, or{" "}
        <span className="text-primary underline underline-offset-2">browse</span>
      </Typography>
      <Typography variant="muted" className="text-xs">
        Supported formats: PDF, DOCX, TXT
      </Typography>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) onFileSelected(selected);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function AIScopeField({
  value,
  onChange,
  error,
}: {
  value: AIScope[];
  onChange: (value: AIScope[]) => void;
  error?: string;
}) {
  return (
    <Field>
      <FieldLabel>AI Scope</FieldLabel>
      <FieldDescription>Which AI systems can use this knowledge.</FieldDescription>
      <div className="grid grid-cols-2 gap-2">
        {AI_SCOPE_OPTIONS.map((option) => {
          const checked = value.includes(option.value);
          return (
            <Label
              key={option.value}
              className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 p-2.5 has-data-checked:border-primary/40 has-data-checked:bg-primary/5"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(next) =>
                  onChange(
                    next
                      ? [...value, option.value]
                      : value.filter((entry) => entry !== option.value),
                  )
                }
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </Label>
          );
        })}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </Field>
  );
}

export function KnowledgeForm({
  open,
  onOpenChange,
  type,
  item,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: KnowledgeType | null;
  item?: KnowledgeItem | null;
  onSaved: () => void;
}) {
  const dispatch = useAppDispatch();
  const isEditing = Boolean(item?.id);
  const effectiveType = item?.type ?? type;

  const { CreateKnowledgeItemIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.CreateKnowledgeItemState,
  );
  const { UpdateKnowledgeItemIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.UpdateKnowledgeItemState,
  );
  const { FetchProductOptionsListData } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.FetchProductOptionsState,
  );
  const { FetchCategoryOptionsListData } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.FetchCategoryOptionsState,
  );
  const isSaving = CreateKnowledgeItemIsLoading || UpdateKnowledgeItemIsLoading;

  const [file, setFile] = useState<File | null>(null);
  const categoryAnchor = useComboboxAnchor();

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: item ? valuesFromItem(item) : emptyValues(),
    validate: (values) => {
      if (!effectiveType) return {};
      return validate(
        effectiveType,
        values,
        Boolean(item?.fileName),
        Boolean(file),
      );
    },
    onSubmit: async (values) => {
      if (!effectiveType) return;

      const tags = values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const selectedProduct = FetchProductOptionsListData.find(
        (product) => product.id === values.productId,
      );
      const selectedCategories = FetchCategoryOptionsListData.filter(
        (category) => values.categoryIds.includes(category.id),
      );

      const isFileType = effectiveType === "document" || effectiveType === "google_drive";
      const title =
        effectiveType === "faq"
          ? values.question
          : effectiveType === "offer"
            ? values.offerName
            : effectiveType === "document" || effectiveType === "google_drive"
              ? values.title || file?.name || item?.fileName || "Untitled document"
              : values.title;

      const payload = {
        type: effectiveType,
        source:
          effectiveType === "product"
            ? "product"
            : effectiveType === "category"
              ? "category"
              : effectiveType === "faq"
                ? "faq"
                : effectiveType === "policy"
                  ? "url"
                  : effectiveType === "google_drive"
                    ? "google_drive"
                    : effectiveType === "offer"
                      ? "offer"
                      : effectiveType === "document" || file
                        ? "file"
                        : ("text" as const),
        title,
        status: isFileType && !isEditing ? "processing" : values.status,
        aiScope: values.aiScope,
        tags,
        content: values.content || undefined,
        productId: values.productId || undefined,
        productName: selectedProduct?.name,
        categoryIds: values.categoryIds.length ? values.categoryIds : undefined,
        categoryNames: selectedCategories.length
          ? selectedCategories.map((category) => category.name)
          : undefined,
        question: values.question || undefined,
        answer: values.answer || undefined,
        url: values.url || undefined,
        policyType: (values.policyType || undefined) as PolicyType | undefined,
        syncFrequency: effectiveType === "policy" ? values.syncFrequency : undefined,
        lastSyncedAt: effectiveType === "policy" ? new Date().toISOString() : item?.lastSyncedAt,
        driveUrl: values.driveUrl || undefined,
        fileName: file?.name ?? item?.fileName,
        fileType: file?.type ?? item?.fileType,
        fileSize: file?.size ?? item?.fileSize,
        processingError: null,
        offerName: values.offerName || undefined,
        couponCode: values.couponCode || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        conditions: values.conditions || undefined,
      } as unknown as Omit<KnowledgeItem, "id" | "createdAt" | "updatedAt">;

      const result =
        isEditing && item
          ? await dispatch(UpdateKnowledgeItem({ id: item.id, patch: payload }))
          : await dispatch(CreateKnowledgeItem(payload));

      const succeeded = isEditing
        ? UpdateKnowledgeItem.fulfilled.match(result)
        : CreateKnowledgeItem.fulfilled.match(result);

      if (succeeded) {
        onSaved();
        onOpenChange(false);
      }
    },
  });

  useEffect(() => {
    if (open) {
      formik.resetForm();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears the local upload pick alongside the form whenever the sheet (re)opens for a new item/type
      setFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id, type]);

  useEffect(() => {
    if (!open || !effectiveType) return;
    if (effectiveType === "product") dispatch(FetchProductOptions(""));
    if (effectiveType === "category") dispatch(FetchCategoryOptions(""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, effectiveType]);

  if (!effectiveType) return null;
  const meta = KNOWLEDGE_TYPE_META[effectiveType];
  const formErrors = formik.errors as Record<string, string>;

  const productValues = FetchProductOptionsListData.map((product) => product.id);
  const categoryLabels = new Map(
    FetchCategoryOptionsListData.map((category) => [category.id, category.name]),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? `Edit ${meta.label}` : `Add ${meta.label}`}
          </SheetTitle>
          <SheetDescription>{meta.description}</SheetDescription>
        </SheetHeader>

        <form
          onSubmit={formik.handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <FieldGroup className="flex-1 overflow-y-auto px-4">
            {effectiveType !== "faq" && effectiveType !== "offer" && (
              <Field>
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g. Return Policy"
                  autoComplete="off"
                  aria-invalid={Boolean(formik.touched.title && formik.errors.title)}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.title}
                />
                {formik.touched.title && formik.errors.title && (
                  <p className="text-xs text-destructive">{formik.errors.title}</p>
                )}
              </Field>
            )}

            {effectiveType === "general" && (
              <Field>
                <FieldLabel htmlFor="content">Content</FieldLabel>
                <Textarea
                  id="content"
                  name="content"
                  rows={6}
                  placeholder="Write the knowledge the AI should use…"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.content}
                  aria-invalid={Boolean(formik.touched.content && formik.errors.content)}
                />
                {formik.touched.content && formik.errors.content && (
                  <p className="text-xs text-destructive">{formik.errors.content}</p>
                )}
              </Field>
            )}

            {effectiveType === "product" && (
              <>
                <Field>
                  <FieldLabel>Product</FieldLabel>
                  <Combobox
                    items={productValues}
                    value={formik.values.productId || null}
                    onValueChange={(value) =>
                      formik.setFieldValue("productId", value ?? "")
                    }
                    onInputValueChange={(query) =>
                      dispatch(FetchProductOptions(query))
                    }
                    itemToStringLabel={(id) =>
                      FetchProductOptionsListData.find((product) => product.id === id)
                        ?.name ?? String(id)
                    }
                  >
                    <ComboboxInput placeholder="Search products…" />
                    <ComboboxContent>
                      <ComboboxEmpty>No products found.</ComboboxEmpty>
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
                  {formik.errors.productId && (
                    <p className="text-xs text-destructive">
                      {formik.errors.productId}
                    </p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="content">Content or upload a document</FieldLabel>
                  <Textarea
                    id="content"
                    name="content"
                    rows={5}
                    placeholder="Care instructions, manual excerpt, FAQ text…"
                    onChange={formik.handleChange}
                    value={formik.values.content}
                  />
                  <MockFileUpload
                    file={file}
                    existingFileName={item?.fileName}
                    onFileSelected={setFile}
                    onClear={() => setFile(null)}
                  />
                  {formik.errors.content && (
                    <p className="text-xs text-destructive">{formik.errors.content}</p>
                  )}
                </Field>
              </>
            )}

            {effectiveType === "category" && (
              <>
                <Field>
                  <FieldLabel>Categories</FieldLabel>
                  <Combobox
                    multiple
                    items={FetchCategoryOptionsListData.map((category) => category.id)}
                    value={formik.values.categoryIds}
                    onValueChange={(value) =>
                      formik.setFieldValue("categoryIds", value as string[])
                    }
                    onInputValueChange={(query) =>
                      dispatch(FetchCategoryOptions(query))
                    }
                    itemToStringLabel={(id) => categoryLabels.get(id as string) ?? String(id)}
                  >
                    <ComboboxChips ref={categoryAnchor} className="w-full">
                      <ComboboxValue>
                        {(selected) => (
                          <>
                            {(selected as string[]).map((id) => (
                              <ComboboxChip key={id}>
                                {categoryLabels.get(id) ?? id}
                              </ComboboxChip>
                            ))}
                            <ComboboxChipsInput placeholder="Search categories…" />
                          </>
                        )}
                      </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxContent anchor={categoryAnchor}>
                      <ComboboxEmpty>No categories found.</ComboboxEmpty>
                      <ComboboxList>
                        {(id) => (
                          <ComboboxItem key={id as string} value={id}>
                            {categoryLabels.get(id as string) ?? id}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {formik.errors.categoryIds && (
                    <p className="text-xs text-destructive">
                      {formik.errors.categoryIds}
                    </p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="content">Content or upload a document</FieldLabel>
                  <Textarea
                    id="content"
                    name="content"
                    rows={5}
                    placeholder="Buying guide, category FAQ…"
                    onChange={formik.handleChange}
                    value={formik.values.content}
                  />
                  <MockFileUpload
                    file={file}
                    existingFileName={item?.fileName}
                    onFileSelected={setFile}
                    onClear={() => setFile(null)}
                  />
                  {formik.errors.content && (
                    <p className="text-xs text-destructive">{formik.errors.content}</p>
                  )}
                </Field>
              </>
            )}

            {effectiveType === "faq" && (
              <>
                <Field>
                  <FieldLabel htmlFor="question">Question</FieldLabel>
                  <Input
                    id="question"
                    name="question"
                    placeholder="Do you offer free shipping?"
                    autoComplete="off"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.question}
                    aria-invalid={Boolean(formik.touched.question && formik.errors.question)}
                  />
                  {formik.touched.question && formik.errors.question && (
                    <p className="text-xs text-destructive">{formik.errors.question}</p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="answer">Answer</FieldLabel>
                  <Textarea
                    id="answer"
                    name="answer"
                    rows={4}
                    placeholder="Yes, orders above ₹999 qualify for free shipping."
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.answer}
                    aria-invalid={Boolean(formik.touched.answer && formik.errors.answer)}
                  />
                  {formik.touched.answer && formik.errors.answer && (
                    <p className="text-xs text-destructive">{formik.errors.answer}</p>
                  )}
                </Field>
              </>
            )}

            {effectiveType === "policy" && (
              <>
                <Field>
                  <FieldLabel htmlFor="url">Policy URL</FieldLabel>
                  <Input
                    id="url"
                    name="url"
                    placeholder="https://yourstore.com/policies/returns"
                    autoComplete="off"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.url}
                    aria-invalid={Boolean(formik.touched.url && formik.errors.url)}
                  />
                  {formik.touched.url && formik.errors.url && (
                    <p className="text-xs text-destructive">{formik.errors.url}</p>
                  )}
                </Field>
                <Field>
                  <FieldLabel>Policy Type</FieldLabel>
                  <Select
                    value={formik.values.policyType}
                    onValueChange={(value) => formik.setFieldValue("policyType", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select policy type" />
                    </SelectTrigger>
                    <SelectContent>
                      {POLICY_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formik.errors.policyType && (
                    <p className="text-xs text-destructive">{formik.errors.policyType}</p>
                  )}
                </Field>
                <Field>
                  <FieldLabel>Sync frequency</FieldLabel>
                  <Select
                    value={formik.values.syncFrequency}
                    onValueChange={(value) =>
                      formik.setFieldValue("syncFrequency", value as SyncFrequency)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="manual">Manual only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    How often this page is re-checked for changes.
                  </FieldDescription>
                </Field>
              </>
            )}

            {effectiveType === "document" && (
              <Field>
                <FieldLabel>Document</FieldLabel>
                <MockFileUpload
                  file={file}
                  existingFileName={item?.fileName}
                  onFileSelected={setFile}
                  onClear={() => setFile(null)}
                />
                {formErrors.file && (
                  <p className="text-xs text-destructive">{formErrors.file}</p>
                )}
              </Field>
            )}

            {effectiveType === "google_drive" && (
              <Field>
                <FieldLabel htmlFor="driveUrl">Google Drive file URL</FieldLabel>
                <Input
                  id="driveUrl"
                  name="driveUrl"
                  placeholder="https://drive.google.com/file/d/…/view"
                  autoComplete="off"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.driveUrl}
                  aria-invalid={Boolean(formik.touched.driveUrl && formik.errors.driveUrl)}
                />
                {formik.touched.driveUrl && formik.errors.driveUrl && (
                  <p className="text-xs text-destructive">{formik.errors.driveUrl}</p>
                )}
                <FieldDescription>
                  The file must be shared as &quot;Anyone with the link can view&quot;.
                  Google account authorization can be added later.
                </FieldDescription>
              </Field>
            )}

            {effectiveType === "offer" && (
              <>
                <Field>
                  <FieldLabel htmlFor="offerName">Offer name</FieldLabel>
                  <Input
                    id="offerName"
                    name="offerName"
                    placeholder="Festive Season Sale"
                    autoComplete="off"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.offerName}
                    aria-invalid={Boolean(formik.touched.offerName && formik.errors.offerName)}
                  />
                  {formik.touched.offerName && formik.errors.offerName && (
                    <p className="text-xs text-destructive">{formik.errors.offerName}</p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="conditions">Description</FieldLabel>
                  <Textarea
                    id="conditions"
                    name="conditions"
                    rows={3}
                    placeholder="What the offer is and any conditions that apply"
                    onChange={formik.handleChange}
                    value={formik.values.conditions}
                  />
                </Field>
                <Field orientation="responsive">
                  <div className="flex-1">
                    <FieldLabel htmlFor="couponCode">Coupon code</FieldLabel>
                    <Input
                      id="couponCode"
                      name="couponCode"
                      placeholder="FESTIVE20"
                      autoComplete="off"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.couponCode}
                      aria-invalid={Boolean(
                        formik.touched.couponCode && formik.errors.couponCode,
                      )}
                    />
                    {formik.touched.couponCode && formik.errors.couponCode && (
                      <p className="text-xs text-destructive">{formik.errors.couponCode}</p>
                    )}
                  </div>
                </Field>
                <Field orientation="responsive">
                  <div className="flex-1">
                    <FieldLabel htmlFor="startDate">Start date</FieldLabel>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      onChange={formik.handleChange}
                      value={formik.values.startDate}
                    />
                  </div>
                  <div className="flex-1">
                    <FieldLabel htmlFor="endDate">End date</FieldLabel>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      onChange={formik.handleChange}
                      value={formik.values.endDate}
                    />
                  </div>
                </Field>
              </>
            )}

            <AIScopeField
              value={formik.values.aiScope}
              onChange={(value) => formik.setFieldValue("aiScope", value)}
              error={formErrors.aiScope}
            />

            <Field>
              <FieldLabel htmlFor="tags">Tags</FieldLabel>
              <Input
                id="tags"
                name="tags"
                placeholder="shipping, returns, warranty"
                autoComplete="off"
                onChange={formik.handleChange}
                value={formik.values.tags}
              />
              <FieldDescription>Comma-separated. Used for search and filters.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={formik.values.status}
                onValueChange={(value) =>
                  formik.setFieldValue("status", value as "active" | "disabled")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <SheetFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {isEditing ? "Updating…" : "Saving…"}
                </>
              ) : (
                <>
                  <IconDeviceFloppy />
                  {isEditing ? "Update" : "Save"}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
