"use client";

import { useState } from "react";
import { IconDeviceFloppy } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { AIScopeField } from "@/components/custom/knowledge/ai-scope-field";
import { FileUploadDropzone } from "@/components/custom/knowledge/file-upload-dropzone";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  CreateKnowledgeItem,
  type AIScope,
} from "@/redux/api-slice/knowledge-rag-slice";
import type { SourceStepProps } from "@/components/custom/knowledge/add-knowledge-sources/types";

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export function UploadFileStep({
  knowledgeType,
  product,
  onBack,
  onDone,
}: SourceStepProps) {
  const dispatch = useAppDispatch();
  const { CreateKnowledgeItemIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.CreateKnowledgeItemState,
  );
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const [file, setFile] = useState<File | null>(null);
  const [aiScope, setAiScope] = useState<AIScope[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileSelected = (selected: File) => {
    if (selected.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({
        ...prev,
        file: `File exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`,
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, file: "" }));
    setFile(selected);
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!file) nextErrors.file = "Upload a file";
    if (aiScope.length === 0) nextErrors.aiScope = "Select at least one AI";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !file) return;

    const result = await dispatch(
      CreateKnowledgeItem({
        storeCode,
        type: knowledgeType,
        source: "file",
        aiScope,
        productId: product?.id,
        productName: product?.name,
        file,
      }),
    );

    if (CreateKnowledgeItem.fulfilled.match(result)) onDone();
  };

  return (
    <div className="flex flex-1 flex-col">
      <FieldGroup className="flex-1 overflow-y-auto px-1">
        <Field>
          <FieldLabel>Document</FieldLabel>
          <FileUploadDropzone
            file={file}
            onFileSelected={handleFileSelected}
            onClear={() => setFile(null)}
          />
          {errors.file && (
            <p className="text-xs text-destructive">{errors.file}</p>
          )}
        </Field>

        <AIScopeField
          value={aiScope}
          onChange={setAiScope}
          error={errors.aiScope}
        />
      </FieldGroup>

      <DialogFooter className="mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={CreateKnowledgeItemIsLoading}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={CreateKnowledgeItemIsLoading}
        >
          {CreateKnowledgeItemIsLoading ? (
            <>
              <Spinner data-icon="inline-start" />
              Saving…
            </>
          ) : (
            <>
              <IconDeviceFloppy />
              Save
            </>
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}
