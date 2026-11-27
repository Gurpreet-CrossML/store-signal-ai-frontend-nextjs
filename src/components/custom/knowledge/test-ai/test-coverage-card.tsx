"use client";

import { useEffect } from "react";

import { LoadingState } from "@/components/custom/loading-state";
import { formatPercent } from "@/lib/helpers";
import { FetchTestCoverage } from "@/redux/api-slice/knowledge-test-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/** One count in the card's legend, with the colour of its part of the bar. */
function LegendItem({
  swatchClassName,
  count,
  label,
}: {
  swatchClassName: string;
  count: number;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${swatchClassName}`}
      />
      <b className="font-semibold text-foreground">{count}</b> {label}
    </span>
  );
}

/**
 * How well the store's AI answers the test questions: the share of the
 * questions already asked that it answered, and a bar splitting every question
 * into answered, unanswered and not asked yet. Questions never asked stay out
 * of the percentage until they are tried; it follows each try made in the
 * chat.
 */
export function TestCoverageCard() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchTestCoverageData: data, FetchTestCoverageIsLoading: isLoading } =
    useAppSelector(
      (state) => state.GetKnowledgeTestAiReducer.FetchTestCoverageState,
    );

  useEffect(() => {
    if (storeCode) dispatch(FetchTestCoverage({ storeCode }));
  }, [dispatch, storeCode]);

  // While the first answer is on its way a spinner holds the space; if it
  // never comes, the card is simply left out.
  if (data === null) {
    return isLoading ? (
      <LoadingState label="Loading coverage…" className="py-6" />
    ) : null;
  }
  // A store without test questions has no coverage to report.
  if (data.total === 0) return null;

  const percent = data.coverage === null ? null : formatPercent(data.coverage);
  const share = (count: number) => `${(count / data.total) * 100}%`;

  return (
    <section
      aria-label="Test coverage"
      className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border p-4"
    >
      <div className="flex min-w-28 flex-col">
        <span className="text-xs font-semibold text-muted-foreground">
          Test coverage
        </span>
        <span className="text-2xl leading-tight font-bold tracking-tight text-primary tabular-nums">
          {percent === null ? "—" : `${percent}%`}
        </span>
      </div>

      <div className="flex min-w-56 flex-1 flex-col gap-2">
        <div
          role="img"
          aria-label={`${data.answered} answered, ${data.unanswered} unanswered, ${data.notAsked} not asked yet`}
          className="flex h-2.5 overflow-hidden rounded-full bg-muted"
        >
          <span
            className="bg-emerald-500"
            style={{ width: share(data.answered) }}
          />
          <span
            className="bg-red-500"
            style={{ width: share(data.unanswered) }}
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <LegendItem
            swatchClassName="bg-emerald-500"
            count={data.answered}
            label="answered"
          />
          <LegendItem
            swatchClassName="bg-red-500"
            count={data.unanswered}
            label="unanswered"
          />
          <LegendItem
            swatchClassName="bg-muted-foreground/30"
            count={data.notAsked}
            label="not asked yet"
          />
        </div>
        {percent === null && (
          <p className="text-xs text-muted-foreground">
            Ask a question to see how well your knowledge covers them.
          </p>
        )}
      </div>
    </section>
  );
}
