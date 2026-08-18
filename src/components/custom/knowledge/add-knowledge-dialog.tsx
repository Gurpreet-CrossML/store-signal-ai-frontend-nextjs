"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type KnowledgeType } from "@/redux/api-slice/knowledge-rag-slice";
import {
  KNOWLEDGE_TYPE_META,
  KNOWLEDGE_TYPE_OPTIONS,
} from "@/components/custom/knowledge/knowledge-meta";
import { OptionCard } from "@/components/custom/knowledge/option-card";
import { ProductKnowledgeStep } from "@/components/custom/knowledge/add-knowledge-sources/product-knowledge-step";
import { GeneralKnowledgeStep } from "@/components/custom/knowledge/add-knowledge-sources/general-knowledge-step";

type Step = "type" | "details";

export function AddKnowledgeDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState<Step>("type");
  const [knowledgeType, setKnowledgeType] = useState<KnowledgeType | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the wizard to step 1 whenever it (re)opens
    setStep("type");
    setKnowledgeType(null);
  }, [open]);

  const handlePickType = (type: KnowledgeType) => {
    setKnowledgeType(type);
    setStep("details");
  };

  const handleDone = () => {
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === "type"
              ? "Add Knowledge"
              : `Add ${KNOWLEDGE_TYPE_META[knowledgeType!].label}`}
          </DialogTitle>
          <DialogDescription>
            {step === "type"
              ? "What type of knowledge do you want to add?"
              : KNOWLEDGE_TYPE_META[knowledgeType!].description}
          </DialogDescription>
        </DialogHeader>

        {step === "type" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {KNOWLEDGE_TYPE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                description={option.description}
                icon={option.icon}
                tone={option.tone}
                onClick={() => handlePickType(option.value)}
              />
            ))}
          </div>
        )}

        {step === "details" && knowledgeType === "product" && (
          <ProductKnowledgeStep
            onBack={() => setStep("type")}
            onDone={handleDone}
          />
        )}

        {step === "details" && knowledgeType === "general" && (
          <GeneralKnowledgeStep
            onBack={() => setStep("type")}
            onDone={handleDone}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
