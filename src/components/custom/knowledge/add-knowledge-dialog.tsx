"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type { KnowledgeType } from "@/redux/api-slice/knowledge-rag-slice";
import { KNOWLEDGE_TYPE_OPTIONS } from "@/components/custom/knowledge/knowledge-meta";
import { KnowledgeForm } from "@/components/custom/knowledge/knowledge-form";

export function AddKnowledgeDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [selectedType, setSelectedType] = useState<KnowledgeType | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const handlePick = (type: KnowledgeType) => {
    setSelectedType(type);
    onOpenChange(false);
    setFormOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Knowledge</DialogTitle>
            <DialogDescription>
              What type of knowledge do you want to add?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {KNOWLEDGE_TYPE_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handlePick(option.value)}
                  className="flex items-start gap-3 rounded-xl border border-border/60 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      BADGE_TONE_STYLES[option.tone],
                    )}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <Typography variant="small" as="p" className="font-medium">
                      {option.label}
                    </Typography>
                    <Typography variant="muted" className="text-xs">
                      {option.description}
                    </Typography>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <KnowledgeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        type={selectedType}
        item={null}
        onSaved={onSaved}
      />
    </>
  );
}
