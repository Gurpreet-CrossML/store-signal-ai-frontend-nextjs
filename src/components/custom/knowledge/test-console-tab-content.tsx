"use client";

import { useState } from "react";
import { IconChevronDown, IconSend2 } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  RunTestQuery,
  type AIScope,
  type KnowledgeType,
} from "@/redux/api-slice/knowledge-rag-slice";
import {
  AI_SCOPE_OPTIONS,
  KNOWLEDGE_TYPE_OPTIONS,
} from "@/components/custom/knowledge/knowledge-meta";
import { TestConsoleResults } from "@/components/custom/knowledge/test-console-results";

const EXAMPLE_QUESTIONS = [
  "Can I return a product after 30 days?",
  "Do you offer free shipping?",
  "How do I pair my wireless headphones?",
  "What size running shoe should I get?",
];

function KnowledgeScopePicker({
  value,
  onChange,
}: {
  value: KnowledgeType[];
  onChange: (value: KnowledgeType[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const label =
    value.length === 0
      ? "All knowledge types"
      : `${value.length} type${value.length > 1 ? "s" : ""}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {label}
          <IconChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <div className="flex flex-col gap-1.5">
          {KNOWLEDGE_TYPE_OPTIONS.map((option) => (
            <Label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm font-normal hover:bg-muted/60"
            >
              <Checkbox
                checked={value.includes(option.value)}
                onCheckedChange={(checked) =>
                  onChange(
                    checked
                      ? [...value, option.value]
                      : value.filter((entry) => entry !== option.value),
                  )
                }
              />
              {option.label}
            </Label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function TestConsoleTabContent() {
  const dispatch = useAppDispatch();
  const { RunTestQueryData, RunTestQueryIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.RunTestQueryState,
  );

  const [aiScope, setAiScope] = useState<AIScope>("sales");
  const [knowledgeScope, setKnowledgeScope] = useState<KnowledgeType[]>([]);
  const [query, setQuery] = useState("");

  const runQuery = (question: string) => {
    if (!question.trim()) return;
    setQuery(question);
    dispatch(RunTestQuery({ query: question, aiScope, knowledgeScope }));
  };

  return (
    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Ask your knowledge base</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Select AI</Label>
              <Select
                value={aiScope}
                onValueChange={(value) => setAiScope(value as AIScope)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_SCOPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Knowledge scope
              </Label>
              <KnowledgeScopePicker
                value={knowledgeScope}
                onChange={setKnowledgeScope}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="test-query"
              className="text-xs text-muted-foreground"
            >
              Question
            </Label>
            <Textarea
              id="test-query"
              rows={3}
              placeholder="Type a question a customer might ask…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => runQuery(question)}
              >
                <Badge
                  variant="outline"
                  className="cursor-pointer font-normal hover:border-primary/40 hover:text-primary"
                >
                  {question}
                </Badge>
              </button>
            ))}
          </div>

          <Button
            onClick={() => runQuery(query)}
            disabled={RunTestQueryIsLoading || !query.trim()}
          >
            {RunTestQueryIsLoading ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <IconSend2 data-icon="inline-start" />
            )}
            Test Retrieval
          </Button>

          <Typography variant="muted" className="text-xs">
            Runs against the current Retrieval &amp; Matching settings, so you
            can verify a configuration before relying on it live.
          </Typography>
        </CardContent>
      </Card>

      <TestConsoleResults
        result={RunTestQueryData}
        isLoading={RunTestQueryIsLoading}
      />
    </div>
  );
}
