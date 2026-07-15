"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type SummaryItem = { label: string; value: number };

type BrandVoiceVocabularySummaryProps = {
  summary: SummaryItem[];
  preferredPhrases: string[];
  lastSavedAt: string | null;
};

export default function BrandVoiceVocabularySummary({
  summary,
  preferredPhrases,
  lastSavedAt,
}: BrandVoiceVocabularySummaryProps) {
  return (
    <Card className="sticky top-4 gap-0 overflow-hidden">
      <CardHeader className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Vocabulary summary</CardTitle>
            <p className="text-sm text-muted-foreground">Quick counts and a few live hints.</p>
          </div>
          {lastSavedAt && (
            <span className="text-xs text-muted-foreground">
              Last synced {new Date(lastSavedAt).toLocaleString()}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-5 pb-5">
        <div className="grid grid-cols-2 gap-3">
          {summary.map((item) => (
            <div key={item.label} className="rounded-xl border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Preferred phrases currently on deck.</p>
          <div className="flex flex-wrap gap-2">
            {preferredPhrases.slice(0, 6).map((item) => (
              <Badge key={item} variant="secondary" className="font-normal">
                {item}
              </Badge>
            ))}
            {preferredPhrases.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Add a few preferred phrases to make the assistant sound more on-brand.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
