"use client";

import "@xyflow/react/dist/style.css";

import { useEffect, useState } from "react";
import {
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  IconBan,
  IconCheck,
  IconLock,
  IconMessageQuestion,
  IconMessageCircle,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";

import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type {
  PolicyEffect,
  PolicyFlow,
  PolicyFlowStep,
} from "@/redux/api-slice/store-settings-slice";

/** Each outcome's name, colour and icon. */
const OUTCOMES: Record<
  PolicyEffect,
  { title: string; tone: BadgeTone; icon: Icon }
> = {
  decline: { title: "Declined", tone: "danger", icon: IconBan },
  need_info: {
    title: "Ask the customer",
    tone: "neutral",
    icon: IconMessageQuestion,
  },
  team: { title: "Sent to your team", tone: "info", icon: IconUsers },
  allow: { title: "Allowed", tone: "success", icon: IconCheck },
};

// The spine of checks sits in one column; outcomes to its right.
const SPINE_WIDTH = 340;
const OUTCOME_WIDTH = 220;
const GAP_X = 90;
const GAP_Y = 56;

/** First letter up, the rest as written: "the order" → "The order". */
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

type StartData = { label: string };
type StepData = { step: PolicyFlowStep; index: number };
type OutcomeData = { effect: PolicyEffect; title: string; detail: string };

/** A hidden connection point; the flowchart is read-only. */
function Point(props: React.ComponentProps<typeof Handle>) {
  return <Handle {...props} isConnectable={false} style={{ opacity: 0 }} />;
}

function StartNode({ data }: NodeProps<Node<StartData>>) {
  return (
    <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-xs">
      <IconMessageCircle className="size-4 text-primary" />
      {data.label}
      <Point type="source" position={Position.Bottom} />
    </div>
  );
}

/** One check: its rules (any one matching is a yes) or what is missing. */
function StepNode({ data }: NodeProps<Node<StepData>>) {
  const { step, index } = data;
  const outcome = OUTCOMES[step.effect];
  return (
    <div
      className="flex flex-col rounded-xl border bg-card text-sm shadow-xs"
      style={{ width: SPINE_WIDTH }}
    >
      <Point type="target" position={Position.Top} />
      <div className="flex items-center gap-2 border-b px-3 py-2 font-medium">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
          {index}
        </span>
        {step.effect === "need_info"
          ? "Do we still need something from the customer?"
          : "Does any of these match?"}
      </div>
      <ul className="flex flex-col divide-y">
        {step.effect === "need_info"
          ? step.asks.map((ask) => (
              <li key={ask} className="px-3 py-2 break-words">
                {sentence(ask)}
              </li>
            ))
          : step.rules.map((rule) => (
              <li key={rule.id} className="flex flex-col gap-0.5 px-3 py-2">
                <span className="flex items-start gap-1.5 break-words">
                  {rule.platform && (
                    <IconLock
                      className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                      aria-label="Built-in check"
                    />
                  )}
                  {sentence(rule.check)}
                </span>
                {rule.told && (
                  <span className="text-xs break-words text-muted-foreground">
                    Customer is told: &ldquo;{rule.told}&rdquo;
                  </span>
                )}
              </li>
            ))}
      </ul>
      <Point
        type="source"
        id="yes"
        position={Position.Right}
        aria-label={`Yes: ${outcome.title}`}
      />
      <Point type="source" id="no" position={Position.Bottom} />
    </div>
  );
}

/** Where a request ends up. */
function OutcomeNode({ data }: NodeProps<Node<OutcomeData>>) {
  const { icon: OutcomeIcon, tone } = OUTCOMES[data.effect];
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border px-3 py-2 text-sm",
        BADGE_TONE_STYLES[tone],
      )}
      style={{ width: OUTCOME_WIDTH }}
    >
      <Point type="target" id="left" position={Position.Left} />
      <Point type="target" id="top" position={Position.Top} />
      <span className="flex items-center gap-1.5 font-medium">
        <OutcomeIcon className="size-4 shrink-0" />
        {data.title}
      </span>
      {data.detail && (
        <span className="text-xs break-words opacity-80">{data.detail}</span>
      )}
    </div>
  );
}

// Outside the component, so React Flow sees the same object every render.
const NODE_TYPES = { start: StartNode, step: StepNode, outcome: OutcomeNode };

/** An edge between two nodes, labelled with the answer that takes it. */
function edge(
  source: string,
  target: string,
  label?: string,
  sourceHandle?: string,
  targetHandle?: string,
): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    sourceHandle,
    targetHandle,
    label,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
    focusable: false,
  };
}

/**
 * Build the flowchart: the request enters, each step's yes goes right to
 * its outcome and no goes down to the next step; the last no is the
 * policy's default.
 */
function buildGraph(flow: PolicyFlow) {
  const nodes: Node[] = [
    {
      id: "start",
      type: "start",
      position: { x: 0, y: 0 },
      data: { label: "Customer asks" },
    },
  ];
  const edges: Edge[] = [];
  const spine = ["start"];
  const sides: Record<string, string> = {};

  flow.steps.forEach((step, index) => {
    const id = `step-${index}`;
    const outcomeId = `outcome-${index}`;
    const outcome = OUTCOMES[step.effect];
    nodes.push(
      {
        id,
        type: "step",
        position: { x: 0, y: 0 },
        data: { step, index: index + 1 },
      },
      {
        id: outcomeId,
        type: "outcome",
        position: { x: 0, y: 0 },
        data: {
          effect: step.effect,
          title: outcome.title,
          detail:
            step.effect === "allow"
              ? `${flow.action} happens straight away.`
              : step.effect === "need_info"
                ? "Asked one thing at a time, then checked again."
                : "",
        },
      },
    );
    edges.push(
      edge(
        spine[spine.length - 1],
        id,
        index ? "No" : undefined,
        index ? "no" : undefined,
      ),
      edge(id, outcomeId, "Yes", "yes", "left"),
    );
    spine.push(id);
    sides[id] = outcomeId;
  });

  nodes.push({
    id: "default",
    type: "outcome",
    position: { x: 0, y: 0 },
    data: {
      effect: flow.default.effect,
      title: `Anything else: ${OUTCOMES[flow.default.effect].title.toLowerCase()}`,
      detail: flow.default.told,
    },
  });
  edges.push(
    edge(
      spine[spine.length - 1],
      "default",
      flow.steps.length ? "No" : undefined,
      flow.steps.length ? "no" : undefined,
      "top",
    ),
  );
  spine.push("default");
  return { nodes, edges, spine, sides };
}

/**
 * Place the nodes: the spine top to bottom, each outcome level with its
 * step. Sizes are the measured ones once React Flow has them.
 */
function place(
  nodes: Node[],
  spine: string[],
  sides: Record<string, string>,
): Node[] {
  const size = new Map(
    nodes.map((n) => [
      n.id,
      { width: n.measured?.width ?? 0, height: n.measured?.height ?? 0 },
    ]),
  );
  const at = new Map<string, { x: number; y: number }>();
  let y = 0;
  for (const id of spine) {
    const { width, height } = size.get(id)!;
    at.set(id, { x: (SPINE_WIDTH - width) / 2, y });
    const side = sides[id];
    if (side) {
      const box = size.get(side)!;
      at.set(side, {
        x: SPINE_WIDTH + GAP_X,
        y: y + (height - box.height) / 2,
      });
    }
    y += height + GAP_Y;
  }
  return nodes.map((n) => ({ ...n, position: at.get(n.id) ?? n.position }));
}

function Canvas({ flow }: { flow: PolicyFlow }) {
  const [{ nodes, edges, spine, sides }] = useState(() => buildGraph(flow));
  const measured = useNodesInitialized();
  const { getNodes, setNodes, fitView } = useReactFlow();
  // Hidden until placed, so the boxes don't jump into position.
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    if (!measured) return;
    setNodes(place(getNodes(), spine, sides));
    // Fit once React Flow has drawn the new positions.
    const frame = requestAnimationFrame(() => {
      fitView({ padding: 0.1, maxZoom: 1 });
      setPlaced(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [measured, getNodes, setNodes, fitView, spine, sides]);

  return (
    <ReactFlow
      defaultNodes={nodes}
      defaultEdges={edges}
      nodeTypes={NODE_TYPES}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      zoomOnScroll={false}
      preventScrolling={false}
      minZoom={0.3}
      maxZoom={1.5}
      className={cn("transition-opacity", !placed && "opacity-0")}
      // React Flow's colours from the app's own tokens.
      style={
        {
          "--xy-edge-stroke-default": "var(--muted-foreground)",
          "--xy-edge-label-background-color-default": "var(--background)",
          "--xy-edge-label-color-default": "var(--foreground)",
          "--xy-controls-button-background-color-default": "var(--card)",
          "--xy-controls-button-background-color-hover-default": "var(--muted)",
          "--xy-controls-button-color-default": "var(--foreground)",
          "--xy-controls-button-border-color-default": "var(--border)",
        } as React.CSSProperties
      }
    >
      <Controls showInteractive={false} position="top-right" />
    </ReactFlow>
  );
}

/**
 * The saved policy as a read-only flowchart, in the order the engine
 * settles a request: a decline anywhere wins, then a missing detail is
 * asked for, then your team, then allowed, then the policy's default.
 * Scroll the page as usual; drag to move, pinch or use the buttons to zoom.
 */
export default function WorkflowPolicyFlow({ flow }: { flow: PolicyFlow }) {
  return (
    <div
      role="figure"
      aria-label="How the AI decides each request"
      className="h-[560px] overflow-hidden rounded-xl border bg-muted/30 sm:h-[640px]"
    >
      <ReactFlowProvider>
        <Canvas flow={flow} />
      </ReactFlowProvider>
    </div>
  );
}
