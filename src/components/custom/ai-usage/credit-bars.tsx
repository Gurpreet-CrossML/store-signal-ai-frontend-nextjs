export type CreditBarRow = {
  label: string;
  note?: string;
  credits: number;
  // Shown in the right-hand column, e.g. "20.7%".
  extra?: string;
  // A group sub-heading spanning the row, e.g. "Social AI · 37 credits".
  heading?: boolean;
};

/** Rows of credits with a bar scaled to the largest row, as in the usage tables. */
export default function CreditBars({
  rows,
  nameLabel,
  extraLabel,
}: {
  rows: CreditBarRow[];
  nameLabel: string;
  extraLabel?: string;
}) {
  // One scale for the whole table, so bars compare across groups.
  const max = Math.max(
    ...rows.filter((row) => !row.heading).map((row) => row.credits),
    1,
  );

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-muted-foreground">
          <th className="pb-2 text-left font-normal">{nameLabel}</th>
          <th className="hidden pb-2 sm:table-cell" />
          <th className="pb-2 text-right font-normal">Credits</th>
          {extraLabel && (
            <th className="pb-2 pl-4 text-right font-normal">{extraLabel}</th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) =>
          row.heading ? (
            <tr key={row.label}>
              <td
                colSpan={extraLabel ? 4 : 3}
                className="pt-5 pb-2 text-xs font-medium text-muted-foreground"
              >
                {row.label}
              </td>
            </tr>
          ) : (
            <tr key={row.label} className="border-t">
              <td className="py-2.5 pr-4">
                <div>{row.label}</div>
                {row.note && (
                  <div className="text-xs text-muted-foreground">
                    {row.note}
                  </div>
                )}
              </td>
              <td className="hidden w-2/5 py-2.5 pr-4 sm:table-cell">
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(row.credits / max) * 100}%` }}
                  />
                </div>
              </td>
              <td className="py-2.5 text-right font-semibold tabular-nums">
                {row.credits.toLocaleString()}
              </td>
              {extraLabel && (
                <td className="py-2.5 pl-4 text-right text-muted-foreground tabular-nums">
                  {row.extra}
                </td>
              )}
            </tr>
          ),
        )}
      </tbody>
    </table>
  );
}
