"use client";

import { useState } from "react";
import { IconDeviceFloppy } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { AIScopeField } from "@/components/custom/knowledge/ai-scope-field";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  CreateKnowledgeItem,
  type AIScope,
} from "@/redux/api-slice/knowledge-rag-slice";
import type { SourceStepProps } from "@/components/custom/knowledge/add-knowledge-sources/types";

export function FaqStep({
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

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [aiScope, setAiScope] = useState<AIScope[]>([]);
  const [faqErrors, setFaqErrors] = useState<{
    question?: string;
    answer?: string;
  }>({});
  const [aiScopeError, setAiScopeError] = useState<string | undefined>();

  const handleSave = async () => {
    const nextFaqErrors: { question?: string; answer?: string } = {};
    if (!question.trim()) nextFaqErrors.question = "Question is required";
    if (!answer.trim()) nextFaqErrors.answer = "Answer is required";
    setFaqErrors(nextFaqErrors);

    const scopeValid = aiScope.length > 0;
    setAiScopeError(scopeValid ? undefined : "Select at least one AI");

    if (Object.keys(nextFaqErrors).length > 0 || !scopeValid) return;

    const result = await dispatch(
      CreateKnowledgeItem({
        storeCode,
        type: knowledgeType,
        source: "faq",
        aiScope,
        productId: product?.id,
        productName: product?.name,
        question: question.trim(),
        answer: answer.trim(),
      }),
    );

    if (CreateKnowledgeItem.fulfilled.match(result)) onDone();
  };

  return (
    <div className="flex flex-1 flex-col">
      <FieldGroup className="flex-1 overflow-y-auto px-1">
        <Field>
          <FieldLabel htmlFor="faq-question">Question</FieldLabel>
          <Input
            id="faq-question"
            placeholder="Do you offer free shipping?"
            autoComplete="off"
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);
              if (event.target.value.trim()) {
                setFaqErrors((prev) => ({ ...prev, question: undefined }));
              }
            }}
            aria-invalid={Boolean(faqErrors.question)}
          />
          {faqErrors.question && (
            <p className="text-sm text-destructive">{faqErrors.question}</p>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="faq-answer">Answer</FieldLabel>
          <Textarea
            id="faq-answer"
            rows={3}
            placeholder="Yes, orders above ₹999 qualify for free shipping."
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value);
              if (event.target.value.trim()) {
                setFaqErrors((prev) => ({ ...prev, answer: undefined }));
              }
            }}
            aria-invalid={Boolean(faqErrors.answer)}
          />
          {faqErrors.answer && (
            <p className="text-sm text-destructive">{faqErrors.answer}</p>
          )}
        </Field>

        <AIScopeField
          value={aiScope}
          onChange={setAiScope}
          error={aiScopeError}
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
