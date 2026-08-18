"use client";

import { useEffect, useState } from "react";
import { IconDeviceFloppy } from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  UpdateKnowledgeItem,
  UpdateKnowledgeItemAIScope,
  type AIScope,
  type KnowledgeItem,
} from "@/redux/api-slice/knowledge-rag-slice";
import { KNOWLEDGE_TYPE_META } from "@/components/custom/knowledge/knowledge-meta";
import { AIScopeField } from "@/components/custom/knowledge/ai-scope-field";

/** Same members regardless of order — the AI scope picker doesn't preserve it. */
function sameAiScope(a: AIScope[], b: AIScope[]) {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((scope) => setB.has(scope));
}

/**
 * Edit is AI-scope-only, with one exception: an FAQ item's question and
 * answer are also editable here. Every other field (title, source data,
 * etc.) isn't editable — that data only comes from the Add flow.
 *
 * Each save only sends the fields that actually changed — an untouched
 * question/answer, or an untouched AI scope, stays off the wire entirely
 * rather than being resent as-is.
 */
export function EditKnowledgeDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: KnowledgeItem | null;
  onSaved: () => void;
}) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { UpdateKnowledgeItemAIScopeIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.UpdateKnowledgeItemAIScopeState,
  );
  const { UpdateKnowledgeItemIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.UpdateKnowledgeItemState,
  );

  const [aiScope, setAiScope] = useState<AIScope[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [faqErrors, setFaqErrors] = useState<{
    question?: string;
    answer?: string;
  }>({});

  useEffect(() => {
    if (open && item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets to the clicked item's current values whenever the dialog (re)opens
      setAiScope(item.aiScope);
      setQuestion(item.question ?? "");
      setAnswer(item.answer ?? "");
      setError(undefined);
      setFaqErrors({});
    }
  }, [open, item]);

  if (!item) return null;

  const meta = KNOWLEDGE_TYPE_META[item.type];
  const isFaq = item.source === "faq";
  const isSaving =
    UpdateKnowledgeItemAIScopeIsLoading || UpdateKnowledgeItemIsLoading;

  const handleSave = async () => {
    if (aiScope.length === 0) {
      setError("Select at least one AI");
      return;
    }
    if (isFaq) {
      const nextFaqErrors: { question?: string; answer?: string } = {};
      if (!question.trim()) nextFaqErrors.question = "Question is required";
      if (!answer.trim()) nextFaqErrors.answer = "Answer is required";
      setFaqErrors(nextFaqErrors);
      if (Object.keys(nextFaqErrors).length > 0) return;
    }

    if (!sameAiScope(aiScope, item.aiScope)) {
      const scopeResult = await dispatch(
        UpdateKnowledgeItemAIScope({ id: item.id, storeCode, aiScope }),
      );
      if (!UpdateKnowledgeItemAIScope.fulfilled.match(scopeResult)) return;
    }

    if (isFaq) {
      const faqPatch: { question?: string; answer?: string } = {};
      if (question.trim() !== (item.question ?? ""))
        faqPatch.question = question.trim();
      if (answer.trim() !== (item.answer ?? ""))
        faqPatch.answer = answer.trim();

      if (Object.keys(faqPatch).length > 0) {
        const faqResult = await dispatch(
          UpdateKnowledgeItem({ id: item.id, storeCode, patch: faqPatch }),
        );
        if (!UpdateKnowledgeItem.fulfilled.match(faqResult)) return;
      }
    }

    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {meta.label}</DialogTitle>
          <DialogDescription className="truncate">
            {item.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <FieldGroup>
            {isFaq && (
              <>
                <Field>
                  <FieldLabel htmlFor="edit-faq-question">Question</FieldLabel>
                  <Input
                    id="edit-faq-question"
                    autoComplete="off"
                    value={question}
                    onChange={(event) => {
                      setQuestion(event.target.value);
                      if (event.target.value.trim()) {
                        setFaqErrors((prev) => ({
                          ...prev,
                          question: undefined,
                        }));
                      }
                    }}
                    aria-invalid={Boolean(faqErrors.question)}
                  />
                  {faqErrors.question && (
                    <p className="text-sm text-destructive">
                      {faqErrors.question}
                    </p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-faq-answer">Answer</FieldLabel>
                  <Textarea
                    id="edit-faq-answer"
                    rows={3}
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value);
                      if (event.target.value.trim()) {
                        setFaqErrors((prev) => ({
                          ...prev,
                          answer: undefined,
                        }));
                      }
                    }}
                    aria-invalid={Boolean(faqErrors.answer)}
                  />
                  {faqErrors.answer && (
                    <p className="text-sm text-destructive">
                      {faqErrors.answer}
                    </p>
                  )}
                </Field>
              </>
            )}

            <AIScopeField
              value={aiScope}
              onChange={(next) => {
                setAiScope(next);
                if (next.length > 0) setError(undefined);
              }}
              error={error}
            />
          </FieldGroup>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
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
      </DialogContent>
    </Dialog>
  );
}
