"use client";

import { useRef, useState } from "react";
import { IconDeviceFloppy, IconPlus, IconTrash } from "@tabler/icons-react";

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

type DraftFaq = {
  uid: string;
  question: string;
  answer: string;
};

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

  const draftCounter = useRef(1);
  const [drafts, setDrafts] = useState<DraftFaq[]>([
    { uid: "draft-0", question: "", answer: "" },
  ]);
  const [aiScope, setAiScope] = useState<AIScope[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [aiScopeError, setAiScopeError] = useState<string | undefined>();

  const addDraft = () => {
    draftCounter.current += 1;
    setDrafts((prev) => [
      ...prev,
      { uid: `draft-${draftCounter.current}`, question: "", answer: "" },
    ]);
  };

  const removeDraft = (uid: string) => {
    setDrafts((prev) => prev.filter((draft) => draft.uid !== uid));
  };

  const updateDraft = (
    uid: string,
    field: "question" | "answer",
    value: string,
  ) => {
    setError(null);
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.uid === uid ? { ...draft, [field]: value } : draft,
      ),
    );
  };

  const handleSave = async () => {
    if (
      drafts.some((draft) => !draft.question.trim() || !draft.answer.trim())
    ) {
      setError("Fill in every question and answer, or remove the empty pair.");
      return;
    }
    const scopeValid = aiScope.length > 0;
    setAiScopeError(scopeValid ? undefined : "Select at least one AI");
    if (!scopeValid) return;

    setError(null);
    const results = await Promise.all(
      drafts.map((draft) =>
        dispatch(
          CreateKnowledgeItem({
            storeCode,
            type: knowledgeType,
            source: "faq",
            aiScope,
            productId: product?.id,
            productName: product?.name,
            question: draft.question.trim(),
            answer: draft.answer.trim(),
          }),
        ).then((result) => ({
          uid: draft.uid,
          ok: CreateKnowledgeItem.fulfilled.match(result),
        })),
      ),
    );

    const failed = new Set(results.filter((r) => !r.ok).map((r) => r.uid));
    if (failed.size > 0) {
      setDrafts((prev) => prev.filter((draft) => failed.has(draft.uid)));
      setError("Some FAQs couldn't be saved. Please try again.");
      return;
    }
    onDone();
  };

  return (
    <div className="flex flex-1 flex-col">
      <FieldGroup className="flex-1 overflow-y-auto px-1">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col gap-4">
          {drafts.map((draft, index) => (
            <div
              key={draft.uid}
              className="flex flex-col gap-3 rounded-xl border border-border/60 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  FAQ {index + 1}
                </span>
                {drafts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeDraft(draft.uid)}
                    aria-label="Remove FAQ"
                  >
                    <IconTrash className="size-4" />
                  </Button>
                )}
              </div>
              <Field>
                <FieldLabel htmlFor={`question-${draft.uid}`}>
                  Question
                </FieldLabel>
                <Input
                  id={`question-${draft.uid}`}
                  placeholder="Do you offer free shipping?"
                  autoComplete="off"
                  value={draft.question}
                  onChange={(event) =>
                    updateDraft(draft.uid, "question", event.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`answer-${draft.uid}`}>Answer</FieldLabel>
                <Textarea
                  id={`answer-${draft.uid}`}
                  rows={3}
                  placeholder="Yes, orders above ₹999 qualify for free shipping."
                  value={draft.answer}
                  onChange={(event) =>
                    updateDraft(draft.uid, "answer", event.target.value)
                  }
                />
              </Field>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={addDraft}
        >
          <IconPlus className="size-4" />
          Add FAQ
        </Button>

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
