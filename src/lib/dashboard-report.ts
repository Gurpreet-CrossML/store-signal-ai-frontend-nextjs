type ReportRow = string[];

type SummaryMetric = {
  label: string;
  value: string;
  detail: string;
};

export type DashboardReportInput = {
  fileName: string;
  storeName: string;
  from: string;
  to: string;
  summary: SummaryMetric[];
  sentiments: ReportRow[];
  overview: ReportRow[];
  activity: ReportRow[];
  interactions: ReportRow[];
  charts: {
    sentiment: string;
    overview: string;
    activity: string;
    interaction: string;
  };
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });

const tableRows = (rows: ReportRow[], columns: number) =>
  rows.length
    ? rows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
        )
        .join("")
    : `<tr><td colspan="${columns}">No data for this period</td></tr>`;

const barChart = (rows: ReportRow[]) => {
  const values = rows.map((row) => Math.max(0, Number(row[1]) || 0));
  const maximum = Math.max(1, ...values);
  return `<div class="bar-chart">${rows
    .map(
      (row, index) =>
        `<div class="bar-row"><span>${escapeHtml(row[0])}</span><div class="bar-track"><div class="bar-fill" style="width:${(values[index] / maximum) * 100}%"></div></div><strong>${escapeHtml(row[1])}</strong></div>`,
    )
    .join("")}</div>`;
};

const interactionChart = (rows: ReportRow[]) => {
  if (!rows.length) {
    return '<div class="empty-chart">No user queries for this period</div>';
  }
  const values = rows.map((row) => Math.max(0, Number(row[1]) || 0));
  const maximum = Math.max(1, ...values);
  const chartWidth = 620;
  const chartHeight = 180;
  const left = 34;
  const top = 12;
  const plotWidth = chartWidth - left - 12;
  const plotHeight = chartHeight - top - 32;
  const points = values
    .map((value, index) => {
      const x = left + (index / Math.max(1, values.length - 1)) * plotWidth;
      const y = top + plotHeight - (value / maximum) * plotHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const labelStep = Math.max(1, Math.ceil(rows.length / 6));
  const labels = rows
    .map((row, index) => {
      if (index % labelStep !== 0 && index !== rows.length - 1) return "";
      const x = left + (index / Math.max(1, values.length - 1)) * plotWidth;
      return `<text x="${x.toFixed(1)}" y="${chartHeight - 7}" text-anchor="middle">${escapeHtml(row[0])}</text>`;
    })
    .join("");
  return `<svg class="line-chart" viewBox="0 0 ${chartWidth} ${chartHeight}" role="img" aria-label="Customer interaction chart"><line x1="${left}" y1="${top}" x2="${left}" y2="${top + plotHeight}"/><line x1="${left}" y1="${top + plotHeight}" x2="${chartWidth - 12}" y2="${top + plotHeight}"/><text x="4" y="${top + 4}">${maximum}</text><text x="14" y="${top + plotHeight}">0</text><polyline points="${points}"/>${labels}</svg>`;
};

export function buildDashboardReportHtml({
  fileName,
  storeName,
  from,
  to,
  summary,
  sentiments,
  overview,
  activity,
  interactions,
  charts,
}: DashboardReportInput): string {
  const summaryRows: ReportRow[] = summary.map((metric) => [
    metric.label,
    metric.value,
    metric.detail,
  ]);
  const summaryCards = summary
    .map(
      (metric) =>
        `<section class="metric"><div class="metric-label">${escapeHtml(metric.label)}</div><div class="metric-value">${escapeHtml(metric.value)}</div><div class="metric-detail">${escapeHtml(metric.detail)}</div></section>`,
    )
    .join("");
  const chartOrFallback = (chart: string, fallback: string) =>
    chart ? `<div class="chart-copy">${chart}</div>` : fallback;

  return `<!doctype html>
    <html><head><title>${escapeHtml(fileName)}</title>
    <style>
      @page { size: A4; margin: 18mm; }
      * { box-sizing: border-box; }
      :root { --chart-1: oklch(0.827 0.119 306.383); --chart-2: oklch(0.627 0.265 303.9); --chart-3: oklch(0.558 0.288 302.321); --chart-4: oklch(0.496 0.265 301.924); --chart-5: oklch(0.438 0.218 303.724); }
      body { color: #1f1f1f; font-family: Arial, sans-serif; font-size: 11px; margin: 0; }
      h1 { font-size: 24px; margin: 0 0 8px; }
      h2 { font-size: 15px; margin: 28px 0 10px; }
      .meta { color: #616161; margin-bottom: 4px; }
      .summary { display: grid; gap: 10px; grid-template-columns: repeat(2, 1fr); }
      .metric { border: 1px solid #dedede; border-radius: 6px; padding: 12px; break-inside: avoid; }
      .metric-label { color: #616161; font-size: 10px; }
      .metric-value { font-size: 18px; font-weight: 700; margin: 5px 0; }
      .metric-detail { color: #616161; }
      table { border-collapse: collapse; width: 100%; }
      th { background: #f5f5f5; font-weight: 700; text-align: left; }
      th, td { border-bottom: 1px solid #dedede; padding: 9px 8px; vertical-align: top; }
      .bar-chart, .empty-chart { border: 1px solid #dedede; border-radius: 6px; margin-bottom: 12px; padding: 14px; }
      .bar-row { align-items: center; display: grid; gap: 10px; grid-template-columns: 120px 1fr 50px; margin: 8px 0; }
      .bar-track { background: #e9e9e9; border-radius: 999px; height: 10px; overflow: hidden; }
      .bar-fill { background: #6d28d9; border-radius: inherit; height: 100%; min-width: 2px; }
      .line-chart { border: 1px solid #dedede; border-radius: 6px; display: block; height: auto; margin-bottom: 0; padding: 8px; width: 100%; }
      .line-chart line { stroke: #cfcfcf; stroke-width: 1; }
      .line-chart polyline { fill: none; stroke: #6d28d9; stroke-width: 3; }
      .line-chart text { fill: #666; font-size: 9px; }
      .report-section { break-inside: avoid; page-break-inside: avoid; }
      .chart-copy { border: 1px solid #dedede; border-radius: 6px; break-inside: avoid; height: 280px; margin-bottom: 12px; overflow: hidden; page-break-inside: avoid; padding: 10px; }
      .chart-copy [data-slot="chart"], .chart-copy .recharts-responsive-container, .chart-copy svg { height: 100% !important; max-width: 100%; width: 100% !important; }
      .chart-copy .fill-white { fill: #ffffff; }
    </style></head><body>
      <h1>Dashboard analytics</h1>
      <div class="meta">Store: ${escapeHtml(storeName)}</div>
      <div class="meta">Date range: ${escapeHtml(from)} to ${escapeHtml(to)}</div>
      <h2>Performance summary</h2>
      <div class="summary">${summaryCards}</div>
      <h2>Performance details</h2>
      <table><thead><tr><th>Metric</th><th>Value</th><th>Detail</th></tr></thead><tbody>${tableRows(summaryRows, 3)}</tbody></table>
      <section class="report-section"><h2>Sentiment distribution</h2>
      ${chartOrFallback(charts.sentiment, barChart(sentiments))}
      <table><thead><tr><th>Sentiment</th><th>Customer feedback</th></tr></thead><tbody>${tableRows(sentiments, 2)}</tbody></table></section>
      <section class="report-section"><h2>Performance overview</h2>
      ${chartOrFallback(charts.overview, barChart(overview))}
      <table><thead><tr><th>Service metric</th><th>Value</th></tr></thead><tbody>${tableRows(overview, 2)}</tbody></table></section>
      <section class="report-section"><h2>User activity</h2>
      ${chartOrFallback(charts.activity, barChart(activity))}
      <table><thead><tr><th>User type</th><th>Visitors</th></tr></thead><tbody>${tableRows(activity, 2)}</tbody></table></section>
      <section class="report-section"><h2>Customer interaction analytics</h2>
      ${chartOrFallback(charts.interaction, interactionChart(interactions))}</section>
      <table><thead><tr><th>Period</th><th>User queries</th></tr></thead><tbody>${tableRows(interactions, 2)}</tbody></table>
    </body></html>`;
}
