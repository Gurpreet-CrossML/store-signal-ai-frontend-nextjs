"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type {
  AIKnowledgeScopeConfig,
  AIScope,
  KnowledgeType,
} from "@/redux/api-slice/knowledge-rag-slice";
import {
  AI_SCOPE_OPTIONS,
  KNOWLEDGE_TYPE_OPTIONS,
} from "@/components/custom/knowledge/knowledge-meta";

export function AIKnowledgeScopeCard({
  value,
  onChange,
}: {
  value: AIKnowledgeScopeConfig;
  onChange: (next: AIKnowledgeScopeConfig) => void;
}) {
  const toggle = (scope: AIScope, type: KnowledgeType) => {
    const current = value[scope];
    const next = current.includes(type)
      ? current.filter((entry) => entry !== type)
      : [...current, type];
    onChange({ ...value, [scope]: next });
  };

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Knowledge Scope by AI</CardTitle>
        <CardDescription>
          Which knowledge types each AI is allowed to draw answers from.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {AI_SCOPE_OPTIONS.map((scopeOption, index) => (
          <div key={scopeOption.value} className="flex flex-col gap-3">
            {index > 0 && <Separator className="mb-2" />}
            <div>
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
                  BADGE_TONE_STYLES[scopeOption.tone],
                )}
              >
                {scopeOption.label}
              </span>
              <Typography variant="muted" className="mt-1 text-xs">
                {scopeOption.description}
              </Typography>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
              {KNOWLEDGE_TYPE_OPTIONS.map((typeOption) => (
                <Label
                  key={typeOption.value}
                  className="flex cursor-pointer items-center gap-2 text-sm font-normal"
                >
                  <Checkbox
                    checked={value[scopeOption.value].includes(
                      typeOption.value,
                    )}
                    onCheckedChange={() =>
                      toggle(scopeOption.value, typeOption.value)
                    }
                  />
                  {typeOption.label}
                </Label>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
