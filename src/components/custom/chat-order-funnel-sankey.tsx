"use client";

import { IconChevronRight } from "@tabler/icons-react";
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
 * Reshapes the API's Sankey so each step's drop-off peels off right after it,
 * under the next step, instead of every drop-off crossing the whole chart to
 * one "Dropped" node at the far right. Steps come first so they stack on top
 * as one straight band. Steps nobody reached are left out (the step row below
 * the chart still lists them). The API always sends "Dropped" as the last node.
 */
function funnelFlow(
  sankey: ChatOrderFunnelResponse["sankey"] | undefined,
  checkoutLabel: string | undefined,
) {
  const rawNodes = sankey?.nodes ?? [];
  const rawLinks = sankey?.links ?? [];
  const droppedIndex = rawNodes.length - 1;
  const drops = rawLinks.filter((l) => l.target === droppedIndex);
  const forward = rawLinks.filter((l) => l.target !== droppedIndex);
  // Counts never grow step to step, so the reached steps are the first ones.
  const stepCount = rawLinks.length
    ? Math.max(
        ...rawLinks.map((l) => l.source),
        ...forward.map((l) => l.target),
      ) + 1
    : 0;

  const nodes = [
    ...rawNodes.slice(0, stepCount),
    ...drops.map((l) => ({
      name:
        rawNodes[l.source]?.name === checkoutLabel
          ? "Left at checkout"
          : "Dropped",
    })),
  ];
  const links = [
    ...forward,
    ...drops.map((l, n) => ({ ...l, target: stepCount + n })),
  ];
  // Step n sits in column n; a drop-off one column after its step.
  const columnOf = (index: number) =>
    index < stepCount ? index : (drops[index - stepCount]?.source ?? 0) + 1;
  const lastColumn = Math.max(0, ...nodes.map((_, i) => columnOf(i)));

  return { nodes, links, stepCount, columnOf, lastColumn };
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
  const { nodes, links, stepCount, columnOf, lastColumn } = funnelFlow(
    data?.sankey,
    data?.funnel.checkout_link.label,
  );
  const colorByName = new Map(
    FUNNEL_STEP_KEYS.map((key) => [data?.funnel[key].label, STEP_COLORS[key]]),
  );
  const nodeColor = (index: number) => {
    if (index < stepCount) {
      return colorByName.get(nodes[index]?.name) ?? "var(--color-step)";
    }
    return nodes[index]?.name === "Left at checkout"
      ? "var(--color-leftAtCheckout)"
      : "var(--color-dropped)";
  };

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
    // Labels sit outside every band: steps above their node (one row read
    // left to right), drop-offs below theirs.
    const isDrop = index >= stepCount;
    const column = columnOf(index);
    const textAnchor =
      column === lastColumn
        ? "end"
        : column === 0 || isDrop
          ? "start"
          : "middle";
    const textX =
      textAnchor === "end"
        ? x + width
        : textAnchor === "middle"
          ? x + width / 2
          : x;
    const nameY = isDrop ? y + Math.max(height, 2) + 14 : y - 20;
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
          y={nameY}
          textAnchor={textAnchor}
          className="fill-foreground text-xs font-medium"
        >
          {payload.name}
        </text>
        <text
          x={textX}
          y={nameY + 13}
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
    const { source = 0, target = 0 } = links[index] ?? {};
    // Each band fades from its step's colour into the next, so the forward
    // flow reads as one continuous stream.
    const gradientId = `funnel-link-${index}`;
    return (
      <g key={`link-${index}`}>
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1={sourceX}
            x2={targetX}
            y1={0}
            y2={0}
          >
            <stop offset="0%" style={{ stopColor: nodeColor(source) }} />
            <stop offset="100%" style={{ stopColor: nodeColor(target) }} />
          </linearGradient>
        </defs>
        <path
          d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeOpacity={target >= stepCount ? 0.25 : 0.45}
          strokeWidth={Math.max(linkWidth, 1)}
          className="transition-[stroke-opacity] hover:stroke-opacity-70"
        />
      </g>
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
                  nodePadding={24}
                  // Keep drop-offs next to their step and in data order, so
                  // the steps form one straight band along the top.
                  align="left"
                  verticalAlign="top"
                  sort={false}
                  // Room for the step labels above and drop-off labels below.
                  margin={{ top: 36, right: 8, bottom: 36, left: 8 }}
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
              {FUNNEL_STEP_KEYS.map((key, index) => {
                const step = data.funnel[key];
                return (
                  <div key={key} className="flex flex-col gap-1">
                    <dt className="flex items-center gap-1 text-sm text-muted-foreground">
                      {index > 0 && (
                        <IconChevronRight className="size-3.5" aria-hidden />
                      )}
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
