"use client";

import Link from "next/link";

import { CoverageRangeFilter } from "@/components/custom/knowledge/coverage-range-filter";
import { useAnswerCoverage } from "@/components/custom/knowledge/use-answer-coverage";
import { LoadingState } from "@/components/custom/loading-state";
import { Progress } from "@/components/ui/progress";
import { formatPercent } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { AnswerCoverage } from "@/redux/api-slice/knowledge-test-ai-slice";

/** How much the share moved since the period before, in percentage points. */
export function CoverageChange({ change }: { change: number }) {
  const points = formatPercent(Math.abs(change));
  if (points === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        No change vs previous period
      </span>
    );
  }
  const isUp = change > 0;
  return (
    <span
      className={cn(
        "text-sm font-semibold",
        isUp
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400",
      )}
    >
      {isUp ? "▲" : "▼"} {points} pts
      <span className="font-normal text-muted-foreground">
        {" "}
        vs previous period
      </span>
    </span>
  );
}

/** The headline: the percentage, how it moved, and the counts behind it. */
export function CoverageHeadline({ data }: { data: AnswerCoverage }) {
  const percent = data.coverage === null ? null : formatPercent(data.coverage);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="text-3xl leading-none font-bold tracking-tight text-primary tabular-nums">
          {percent === null ? "—" : `${percent}%`}
        </span>
        {data.change !== null && <CoverageChange change={data.change} />}
      </div>
      <Progress
        value={percent ?? 0}
        aria-label="Share of customer questions answered"
      />
      <p className="text-sm text-muted-foreground">
        <b className="font-semibold text-foreground">{data.answered}</b>{" "}
        answered ·{" "}
        <b className="font-semibold text-foreground">{data.unanswered}</b> not
        answered · of {data.total} {data.total === 1 ? "question" : "questions"}
      </p>
      {!data.enoughData && (
        <p className="text-xs text-muted-foreground">
          The percentage shows once there are at least {data.minQuestions}{" "}
          questions in the period ({data.total} so far).
        </p>
      )}
    </div>
  );
}

/** The questions customers asked most that the AI couldn't answer. */
function TopUnanswered({ data }: { data: AnswerCoverage }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Most asked, not answered</h3>
        <Link
          href="/knowledge/coverage"
          className="text-xs font-semibold text-primary hover:underline"
        >
          View All
        </Link>
      </div>
      {data.topUnanswered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing was left unanswered in this period.
        </p>
      ) : (
        <ul className="flex flex-col divide-y">
          {data.topUnanswered.map((item) => (
            <li
              key={item.question}
              className="flex items-center gap-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 break-words">
                {item.question}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {item.count} {item.count === 1 ? "time" : "times"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * How well the store's knowledge answers its customers: the share of customer
 * questions in a period (the last 30 days to start with) that the AI answered,
 * how that moved since the period before, and the questions it could not
 * answer most often, each with a way to add the missing answer. A question it
 * could not answer is a gap in the knowledge.
 */
export function KnowledgeCoverageCard() {
  const { data, isLoading, isError, filters, setFilters } = useAnswerCoverage();

  return (
    <section
      aria-label="KB coverage"
      aria-busy={isLoading}
      className="flex flex-col gap-4 rounded-xl border bg-card p-4"
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold">KB Coverage</h2>
          <p className="text-sm text-muted-foreground">
            How many customer questions your knowledge answered
          </p>
        </div>
        <CoverageRangeFilter filters={filters} onChange={setFilters} />
      </header>

      {data === null ? (
        isLoading ? (
          <LoadingState label="Loading coverage…" className="py-6" />
        ) : isError ? (
          <p className="text-sm text-destructive">
            Couldn&apos;t load the coverage. Please try again later.
          </p>
        ) : null
      ) : data.total === 0 ? (
        <p className="text-sm text-muted-foreground">
          No customer questions were checked in this period yet.
        </p>
      ) : (
        <div
          className={cn(
            "grid gap-x-8 gap-y-5 lg:grid-cols-2",
            isLoading && "opacity-60 transition-opacity",
          )}
        >
          <CoverageHeadline data={data} />
          <TopUnanswered data={data} />
        </div>
      )}
    </section>
  );
}
