"use client";

import { IconCircleCheck, IconSearchOff, IconSparkles } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { LoadingState } from "@/components/custom/loading-state";
import { cn } from "@/lib/utils";
import type { TestConsoleResult } from "@/redux/api-slice/knowledge-rag-slice";
import { KnowledgeTypeIcon } from "@/components/custom/knowledge/knowledge-badges";
import { KNOWLEDGE_TYPE_META } from "@/components/custom/knowledge/knowledge-meta";

function ScoreBadge({ label, score }: { label: string; score?: number }) {
  if (score === undefined) return null;
  const pct = Math.round(score * 100);
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold",
        pct >= 80
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          : pct >= 60
            ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
      )}
      title={label}
    >
      {label} {pct}%
    </span>
  );
}

export function TestConsoleResults({
  result,
  isLoading,
}: {
  result: TestConsoleResult | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card size="sm">
        <CardContent className="py-10">
          <LoadingState label="Running retrieval…" />
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card size="sm">
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <IconSearchOff className="size-8 text-muted-foreground" />
          <Typography variant="small" as="p" className="font-medium">
            Retrieval results appear here
          </Typography>
          <Typography variant="muted" className="max-w-xs text-xs">
            Pick an AI, ask a question, and see which knowledge sources answer
            it and how confidently.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!result.grounded) {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle>Query</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm italic text-muted-foreground">&quot;{result.query}&quot;</p>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 py-10 text-center">
            <IconSearchOff className="size-7 text-muted-foreground" />
            <Typography variant="small" as="p" className="font-medium">
              No confident source found
            </Typography>
            <Typography variant="muted" className="max-w-sm text-xs">
              {result.fallbackReason}
            </Typography>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Query</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <p className="text-sm italic text-muted-foreground">&quot;{result.query}&quot;</p>

        <div className="flex flex-col gap-2">
          <Typography
            variant="muted"
            className="text-xs font-semibold tracking-wide uppercase"
          >
            Retrieved Knowledge
          </Typography>
          {result.retrievedSources.map((source, index) => (
            <div
              key={source.knowledgeItemId}
              className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
            >
              <KnowledgeTypeIcon type={source.type} className="size-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <Typography variant="small" as="p" className="truncate font-medium">
                    {source.title}
                  </Typography>
                </div>
                <Typography variant="muted" className="text-xs">
                  {KNOWLEDGE_TYPE_META[source.type].label}
                </Typography>
                <p className="mt-1.5 text-xs text-foreground/80">{source.excerpt}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <ScoreBadge label="Similarity" score={source.similarityScore} />
                  <ScoreBadge label="Matching" score={source.matchingScore} />
                  <ScoreBadge label="Reranking" score={source.rerankingScore} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col gap-1.5">
          <Typography
            variant="muted"
            className="text-xs font-semibold tracking-wide uppercase"
          >
            Generated Answer
          </Typography>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed">
            <IconSparkles className="mb-2 size-4 text-primary" />
            {result.generatedAnswer}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          <IconCircleCheck className="size-4 shrink-0" />
          Answer grounded in retrieved knowledge
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Top {result.retrievedSources.length} sources</Badge>
          <Badge variant="outline" className="capitalize">
            Scope: {result.knowledgeScope.length ? result.knowledgeScope.join(", ") : "All"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
