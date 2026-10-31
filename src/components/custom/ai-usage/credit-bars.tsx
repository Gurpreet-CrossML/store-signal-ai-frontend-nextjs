import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type CreditBarRow = {
  label: string;
  // One line under the label, e.g. what the feature does.
  note?: string;
  calls: number;
  credits: number;
  // Share of the period's credits, e.g. "20.7%".
  share: string;
};

export type CreditGroup = CreditBarRow & { rows: CreditBarRow[] };

// Calls, credits and share: the same right-hand columns on every line.
const NUMBERS = "grid w-56 shrink-0 grid-cols-3 text-right tabular-nums";

/** A credits bar scaled to the largest group, so groups compare at a glance. */
function Bar({ credits, max }: { credits: number; max: number }) {
  return (
    <div className="hidden h-1.5 flex-1 rounded-full bg-muted sm:block">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${(credits / max) * 100}%` }}
      />
    </div>
  );
}

/**
 * Credits per capability group, largest first. Each group opens to its
 * features, also largest first; the largest group starts open.
 */
export default function CreditGroups({ groups }: { groups: CreditGroup[] }) {
  const sorted = [...groups].sort((a, b) => b.credits - a.credits);
  const max = Math.max(...sorted.map((group) => group.credits), 1);

  return (
    <div className="text-sm">
      <div className="flex items-center gap-4 pb-2 pr-8 text-xs text-muted-foreground">
        <span className="flex-1">Capability</span>
        <div className={NUMBERS}>
          <span>Calls</span>
          <span>Credits</span>
          <span>Share</span>
        </div>
      </div>
      <Accordion
        type="multiple"
        defaultValue={sorted.length ? [sorted[0].label] : []}
        className="border-t"
      >
        {sorted.map((group) => (
          <AccordionItem key={group.label} value={group.label}>
            <AccordionTrigger className="items-center gap-4 py-3 hover:no-underline">
              <span className="min-w-0 flex-1 font-medium sm:w-40 sm:flex-none">
                {group.label}
              </span>
              <Bar credits={group.credits} max={max} />
              <div className={NUMBERS}>
                <span className="text-muted-foreground">
                  {group.calls.toLocaleString()}
                </span>
                <span className="font-semibold">
                  {group.credits.toLocaleString()}
                </span>
                <span className="text-muted-foreground">{group.share}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              {[...group.rows]
                .sort((a, b) => b.credits - a.credits)
                .map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-4 border-t py-2.5 pr-8 pl-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div>{row.label}</div>
                      {row.note && (
                        <div className="text-xs text-muted-foreground">
                          {row.note}
                        </div>
                      )}
                    </div>
                    <div className={NUMBERS}>
                      <span className="text-muted-foreground">
                        {row.calls.toLocaleString()}
                      </span>
                      <span className="font-semibold">
                        {row.credits.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">{row.share}</span>
                    </div>
                  </div>
                ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
