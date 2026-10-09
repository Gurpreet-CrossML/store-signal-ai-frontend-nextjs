"use client";

import { Sankey } from "recharts";
import type { TooltipContentProps } from "recharts";

import { InfoIcon } from "@/components/custom/info-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import type { ChatOrderFunnelResponse } from "@/redux/api-slice/dashboard-slice";

// One hue for the flow that moves forward; neutral gray for what drops off,
// so the eye follows the chats that turn into orders.
const chartConfig = {
  step: { label: "Funnel step", color: "var(--chart-1)" },
  dropped: { label: "Dropped", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const FUNNEL_STEP_KEYS = [
  "chat_started",
  "viewed_product",
  "added_to_cart",
  "order_placed",
] as const;

type SankeyNodeShapeProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload: { name: string; value: number };
};

type SankeyLinkShapeProps = {
  sourceX: number;
  targetX: number;
  sourceY: number;
  targetY: number;
  sourceControlX: number;
  targetControlX: number;
  linkWidth: number;
  index: number;
};

/** Share of chats started, as shown next to every node and in the tooltip. */
function shareOf(value: number, total: number) {
  return total ? `${Math.round((value / total) * 1000) / 10}%` : "0%";
}

/**
 * Drops nodes no link touches (a step nobody reached) and re-indexes links.
 * Recharts would otherwise stack those zero-height nodes in the first column,
 * on top of "Chat started". The step row below the chart still lists them.
 * The API always sends "Dropped" as the last node.
 */
function withoutUnlinkedNodes(sankey?: ChatOrderFunnelResponse["sankey"]) {
  const rawNodes = sankey?.nodes ?? [];
  const rawLinks = sankey?.links ?? [];
  const linked = new Set(rawLinks.flatMap((l) => [l.source, l.target]));
  const kept = rawNodes.map((_, i) => i).filter((i) => linked.has(i));
  const newIndex = new Map(kept.map((oldIndex, i) => [oldIndex, i]));

  return {
    nodes: kept.map((i) => rawNodes[i]),
    links: rawLinks.map((l) => ({
      ...l,
      source: newIndex.get(l.source) ?? 0,
      target: newIndex.get(l.target) ?? 0,
    })),
    droppedIndex: newIndex.get(rawNodes.length - 1) ?? -1,
  };
}

/** Renders the chat-to-order funnel as a Sankey with AI-assisted revenue above it. */
export function ChatOrderFunnelSankey({
  data,
  loading,
}: {
  data: ChatOrderFunnelResponse | null;
  loading: boolean;
}) {
  const totalChats = data?.funnel.chat_started.count ?? 0;
  const { nodes, links, droppedIndex } = withoutUnlinkedNodes(data?.sankey);
  // Nodes with no outgoing link sit in the last column; label them on their left.
  const isSink = (index: number) => !links.some((l) => l.source === index);

  const revenueLine = data?.ai_revenue.length
    ? data.ai_revenue.map((row) => row.display).join(" + ")
    : null;

  const renderNode = ({
    x,
    y,
    width,
    height,
    index,
    payload,
  }: SankeyNodeShapeProps) => {
    const labelOnLeft = isSink(index);
    const textX = labelOnLeft ? x - 8 : x + width + 8;
    const textAnchor = labelOnLeft ? "end" : "start";
    const centerY = y + height / 2;
    return (
      <g key={`node-${index}`}>
        <rect
          x={x}
          y={y}
          width={width}
          height={Math.max(height, 2)}
          rx={2}
          fill={
            index === droppedIndex
              ? "var(--color-dropped)"
              : "var(--color-step)"
          }
        />
        <text
          x={textX}
          y={centerY - 3}
          textAnchor={textAnchor}
          className="fill-foreground text-xs font-medium"
        >
          {payload.name}
        </text>
        <text
          x={textX}
          y={centerY + 11}
          textAnchor={textAnchor}
          className="fill-muted-foreground text-[11px]"
        >
          {payload.value.toLocaleString()} · {shareOf(payload.value, totalChats)}
        </text>
      </g>
    );
  };

  const renderLink = ({
    sourceX,
    targetX,
    sourceY,
    targetY,
    sourceControlX,
    targetControlX,
    linkWidth,
    index,
  }: SankeyLinkShapeProps) => {
    const isDrop = links[index]?.target === droppedIndex;
    return (
      <path
        key={`link-${index}`}
        d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
        fill="none"
        stroke={isDrop ? "var(--color-dropped)" : "var(--color-step)"}
        strokeOpacity={isDrop ? 0.15 : 0.35}
        strokeWidth={Math.max(linkWidth, 1)}
        className="transition-[stroke-opacity] hover:stroke-opacity-60"
      />
    );
  };

  const renderTooltip = ({ active, payload }: TooltipContentProps) => {
    const item = payload?.[0];
    if (!active || !item) return null;
    const value = Number(item.value ?? 0);
    return (
      <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
        <p className="font-medium text-foreground">
          {String(item.name).replace(" - ", " → ")}
        </p>
        <p className="text-muted-foreground">
          <span className="font-mono font-medium text-foreground tabular-nums">
            {value.toLocaleString()}
          </span>{" "}
          chats · {shareOf(value, totalChats)} of chats started
        </p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Chat to Order Funnel
          <InfoIcon
            text={`How chats turn into orders. Each step counts chats that reached it or any later step, as a share of chats started. An order counts if it was placed within ${data?.attribution_window_days ?? 7} days of the chat.`}
          />
        </CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {!data ? (
          <Skeleton className="h-[360px] w-full" />
        ) : (
          <div
            className={`flex flex-col gap-6 transition-opacity ${loading ? "opacity-60" : ""}`}
          >
            <div className="flex flex-wrap items-baseline gap-x-2">
              <Typography variant="h3" as="p">
                {revenueLine ?? "—"}
              </Typography>
              <Typography variant="muted">
                {revenueLine
                  ? "revenue from AI-assisted sessions"
                  : "No revenue from AI-assisted sessions yet"}
              </Typography>
            </div>

            {totalChats ? (
              <ChartContainer config={chartConfig} className="h-[320px] w-full">
                <Sankey
                  data={{ nodes, links }}
                  node={renderNode}
                  link={renderLink}
                  nodeWidth={10}
                  nodePadding={36}
                  margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <ChartTooltip content={renderTooltip} />
                </Sankey>
              </ChartContainer>
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                No chats in the last 30 days
              </div>
            )}

            <dl className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
              {FUNNEL_STEP_KEYS.map((key) => {
                const step = data.funnel[key];
                return (
                  <div key={key} className="flex flex-col gap-1">
                    <dt className="text-sm text-muted-foreground">
                      {step.label}
                    </dt>
                    <dd className="flex items-baseline gap-2">
                      <span className="text-xl font-semibold">
                        {step.count.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(step.percentage)}%
                      </span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
