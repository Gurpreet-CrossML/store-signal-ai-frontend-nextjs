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
  cart: { label: "Added to cart", color: "hsl(45, 93%, 47%)" },
  checkout: { label: "Checkout link", color: "hsl(217, 91%, 60%)" },
  order: { label: "Order placed", color: "hsl(142, 71%, 45%)" },
  dropped: { label: "Dropped", color: "var(--muted-foreground)" },
  // Chats that reached checkout but placed no order.
  leftAtCheckout: { label: "Left at checkout", color: "hsl(0, 84%, 60%)" },
} satisfies ChartConfig;

const FUNNEL_STEP_KEYS = [
  "chat_started",
  "viewed_product",
  "added_to_cart",
  "checkout_link",
  "order_placed",
] as const;

const STEP_COLORS: Partial<Record<(typeof FUNNEL_STEP_KEYS)[number], string>> =
  {
    added_to_cart: "var(--color-cart)",
    checkout_link: "var(--color-checkout)",
    order_placed: "var(--color-order)",
  };

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
  periodLabel,
}: {
  data: ChatOrderFunnelResponse | null;
  loading: boolean;
  periodLabel: string;
}) {
  const totalChats = data?.funnel.chat_started.count ?? 0;
  const { nodes, links, droppedIndex } = withoutUnlinkedNodes(data?.sankey);
  // Nodes with no outgoing link sit in the last column; label them on their left.
  const isSink = (index: number) => !links.some((l) => l.source === index);
  const colorByName = new Map(
    FUNNEL_STEP_KEYS.map((key) => [data?.funnel[key].label, STEP_COLORS[key]]),
  );
  const nodeColor = (index: number) =>
    index === droppedIndex
      ? "var(--color-dropped)"
      : (colorByName.get(nodes[index]?.name) ?? "var(--color-step)");

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
          fill={nodeColor(index)}
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
          {payload.value.toLocaleString()} ·{" "}
          {shareOf(payload.value, totalChats)}
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
    const target = links[index]?.target;
    const isDrop = target === droppedIndex;
    const leftAtCheckout =
      isDrop &&
      nodes[links[index].source]?.name === data?.funnel.checkout_link.label;
    return (
      <path
        key={`link-${index}`}
        d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
        fill="none"
        stroke={
          leftAtCheckout ? "var(--color-leftAtCheckout)" : nodeColor(target)
        }
        strokeOpacity={isDrop && !leftAtCheckout ? 0.15 : 0.35}
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Chat to Order Funnel
          <InfoIcon
            text={`How chats turn into orders. Each step counts chats that reached it or any later step, as a share of chats started. An order counts when it contains a product the chatbot added to the same customer's cart within the ${data?.attribution_window_hours ?? 24} hours before it was placed.`}
          />
        </CardTitle>
        <CardDescription>{periodLabel}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {!data ? (
          <Skeleton className="h-[480px] w-full" />
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
              <ChartContainer config={chartConfig} className="h-[440px] w-full">
                <Sankey
                  data={{ nodes, links }}
                  node={renderNode}
                  link={renderLink}
                  nodeWidth={10}
                  nodePadding={48}
                  margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <ChartTooltip content={renderTooltip} />
                </Sankey>
              </ChartContainer>
            ) : (
              <div className="flex h-[440px] items-center justify-center text-sm text-muted-foreground">
                No chats in this period
              </div>
            )}

            <dl className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-3 lg:grid-cols-5">
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
