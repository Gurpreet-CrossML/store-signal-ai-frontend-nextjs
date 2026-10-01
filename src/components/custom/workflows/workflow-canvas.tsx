"use client";

import { useRef, useState } from "react";
import {
  IconCircleCheck,
  IconFocusCentered,
  IconGitBranch,
  IconMessageReply,
  IconMinus,
  IconPlus,
} from "@tabler/icons-react";

import { StepNode } from "./step-node";
import { TriggerNode } from "./trigger-node";
import { InfoIcon } from "@/components/custom/info-icon";
import { Button } from "@/components/ui/button";
import {
  stepLetter,
  type ResolvedWorkflow,
  type StepText,
  type WorkflowDefinition,
  type WorkflowStep,
  type WorkflowTrigger,
} from "@/lib/workflows";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.25;
const ZOOM_STEP = 0.1;

/** What is open for editing: the trigger, a step key, or nothing. */
export type EditingNode = "trigger" | string | null;

/** A horizontal arrow between two nodes, level with their headers. */
function Connector({ label }: { label?: string }) {
  return (
    <div
      aria-hidden
      className="relative mt-12 h-px w-12 shrink-0 bg-muted-foreground/40 after:absolute after:-top-[4.5px] after:-right-px after:border-y-[5px] after:border-l-[7px] after:border-y-transparent after:border-l-muted-foreground/40"
    >
      {label && (
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-1 text-[11px] whitespace-nowrap text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}

/** Where a path leaves a node: a small dot on its edge. */
function Port({
  className,
  style,
}: {
  className: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        "absolute size-2 rounded-full border border-card bg-muted-foreground/70",
        className,
      )}
    />
  );
}

/** The amber tile behind the branch and "wait" icons. */
const WAIT_TILE_CLASS =
  "grid size-7 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";

// Fixed geometry, so each path leaves exactly at its dot. The card is
// border 1 + padding 12 + header 28 + gap 10 + two 36px rows with a 6px gap
// + padding 12 + border 1 = 142px; the IF row's middle is 69px down.
const BRANCH_CARD_WIDTH = 288;
const BRANCH_CARD_HEIGHT = 142;
const IF_EXIT_Y = 69;
const IF_WIRE_WIDTH = 28;
const WAIT_CARD_WIDTH = 200;
const WAIT_CARD_HEIGHT = 56;
const ELSE_TAIL = 28;
const ELSE_EXIT_X = 44;
const ELSE_DROP = 22;
const BRANCH_WIDTH =
  BRANCH_CARD_WIDTH + IF_WIRE_WIDTH + WAIT_CARD_WIDTH + ELSE_TAIL;

/**
 * The `exit_when: needs_clarification` gate after a step, as two paths:
 * **If** the customer still has to answer, it leaves to the right and ends
 * the turn at "Reply and wait". **Else** it leaves from the bottom, runs
 * under that card and on into the next step.
 */
function BranchNode({
  stepKey,
  stepIndex,
  next,
}: {
  stepKey: string;
  stepIndex: number;
  next: WorkflowStep;
}) {
  return (
    <div
      className="relative shrink-0"
      style={{
        width: BRANCH_WIDTH,
        height: BRANCH_CARD_HEIGHT + ELSE_DROP + 24,
      }}
    >
      <section
        id={`workflow-node-branch-${stepKey}`}
        aria-label={`Branches after step ${stepLetter(stepIndex)}`}
        style={{ width: BRANCH_CARD_WIDTH, height: BRANCH_CARD_HEIGHT }}
        className="absolute top-0 left-0 rounded-xl border bg-card p-3 shadow-sm"
      >
        <div className="flex h-7 items-center gap-2">
          <span className={WAIT_TILE_CLASS}>
            <IconGitBranch className="size-4" />
          </span>
          <span className="text-sm font-semibold">Branches</span>
          <InfoIcon
            className="size-3.5"
            text={`After step ${stepLetter(stepIndex)}, the AI checks whether it still needs an answer from the customer (needs_clarification = true) before going on.`}
          />
        </div>

        <ol className="mt-2.5 flex flex-col gap-1.5 text-[13px]">
          <li className="relative flex h-9 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 dark:border-amber-900 dark:bg-amber-950/40">
            <span className="w-8 shrink-0 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              IF
            </span>
            <span className="truncate">Customer still needs to reply</span>
            <Port className="top-1/2 -right-1 -translate-y-1/2" />
          </li>
          <li className="flex h-9 items-center gap-2 rounded-lg border bg-background px-2.5">
            <span className="w-8 shrink-0 text-[11px] font-semibold text-muted-foreground">
              ELSE
            </span>
            <span className="truncate">Customer has answered</span>
          </li>
        </ol>

        {/* The Else path leaves from the bottom edge. */}
        <Port className="-bottom-1" style={{ left: ELSE_EXIT_X - 4 }} />
      </section>

      {/* If → Reply and wait */}
      <div
        aria-hidden
        style={{
          left: BRANCH_CARD_WIDTH,
          top: IF_EXIT_Y,
          width: IF_WIRE_WIDTH,
        }}
        className="absolute h-px bg-muted-foreground/40 after:absolute after:-top-[4.5px] after:-right-px after:border-y-[5px] after:border-l-[7px] after:border-y-transparent after:border-l-muted-foreground/40"
      />
      <div
        style={{
          left: BRANCH_CARD_WIDTH + IF_WIRE_WIDTH,
          top: IF_EXIT_Y - WAIT_CARD_HEIGHT / 2,
          width: WAIT_CARD_WIDTH,
          height: WAIT_CARD_HEIGHT,
        }}
        className="absolute flex items-center gap-2.5 rounded-xl border border-amber-200 bg-card px-3 shadow-sm dark:border-amber-900"
      >
        <span className={WAIT_TILE_CLASS}>
          <IconMessageReply className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-[13px] font-medium">Reply and wait</span>
          <span className="text-[11px] text-muted-foreground">
            Next message restarts at A
          </span>
        </div>
      </div>

      {/* Else → down from the card, then right into the next step. */}
      <div
        aria-hidden
        style={{
          left: ELSE_EXIT_X,
          top: BRANCH_CARD_HEIGHT,
          width: BRANCH_WIDTH - ELSE_EXIT_X,
          height: ELSE_DROP,
        }}
        className="absolute rounded-bl-lg border-b border-l border-muted-foreground/40 after:absolute after:-right-px after:-bottom-[5.5px] after:border-y-[5px] after:border-l-[7px] after:border-y-transparent after:border-l-muted-foreground/40"
      />
      <span
        style={{
          left: ELSE_EXIT_X + 12,
          top: BRANCH_CARD_HEIGHT + ELSE_DROP + 4,
        }}
        className="absolute text-[11px] whitespace-nowrap text-muted-foreground"
      >
        Else →{" "}
        <span className="font-medium text-foreground">
          {stepLetter(stepIndex + 1)}. {next.title}
        </span>
      </span>
    </div>
  );
}

function EndNode() {
  return (
    <div className="mt-9 inline-flex shrink-0 items-center gap-2 self-start rounded-full border bg-card px-3.5 py-2 text-sm font-medium shadow-sm">
      <IconCircleCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
      Reply sent · workflow ends
    </div>
  );
}

/**
 * The workflow as a left-to-right flow: Trigger → A → Branches → B → … →
 * end. Scrolls sideways; dragging the empty canvas pans it, and the
 * controls zoom, fit the whole flow, or jump to a node.
 */
export function WorkflowCanvas({
  workflow,
  definition,
  editing,
  isSaving,
  onEdit,
  onCancel,
  onSaveTrigger,
  onSaveStep,
  onToolDrop,
}: {
  workflow: ResolvedWorkflow;
  definition: WorkflowDefinition;
  editing: EditingNode;
  isSaving: boolean;
  onEdit: (node: Exclude<EditingNode, null>) => void;
  onCancel: () => void;
  onSaveTrigger: (values: WorkflowTrigger) => void;
  onToolDrop: (stepKey: string, tool: string) => void;
  onSaveStep: (key: string, values: StepText) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ x: number; y: number; left: number; top: number }>(
    null,
  );
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);

  const changeZoom = (next: number) =>
    setZoom(
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(next * 100) / 100)),
    );

  const fitToView = () => {
    const scroller = scrollerRef.current;
    const board = boardRef.current;
    if (!scroller || !board) return;
    const naturalWidth = board.scrollWidth / zoom;
    changeZoom(Math.min(1, (scroller.clientWidth - 16) / naturalWidth));
    scroller.scrollTo({ left: 0 });
  };

  const jumpTo = (nodeId: string) => {
    const scroller = scrollerRef.current;
    const node = document.getElementById(nodeId);
    if (!scroller || !node) return;
    const offset =
      node.getBoundingClientRect().left -
      scroller.getBoundingClientRect().left +
      scroller.scrollLeft;
    scroller.scrollTo({ left: Math.max(0, offset - 32), behavior: "smooth" });
  };

  // Only a press on the empty canvas pans, so text stays selectable and
  // buttons and fields inside the nodes keep working.
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (event.button !== 0 || target.closest("section, button, a, form")) {
      return;
    }
    const scroller = scrollerRef.current;
    if (!scroller) return;
    panRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: scroller.scrollLeft,
      top: scroller.scrollTop,
    };
    scroller.setPointerCapture(event.pointerId);
    setIsPanning(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = panRef.current;
    const scroller = scrollerRef.current;
    if (!start || !scroller) return;
    scroller.scrollLeft = start.left - (event.clientX - start.x);
    scroller.scrollTop = start.top - (event.clientY - start.y);
  };

  const endPan = () => {
    panRef.current = null;
    setIsPanning(false);
  };

  const jumpTargets = [
    { id: "workflow-node-trigger", label: "Trigger" },
    ...workflow.steps.map((step, i) => ({
      id: `workflow-node-${step.key}`,
      label: stepLetter(i),
    })),
  ];

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        className={cn(
          "absolute inset-0 overflow-auto bg-muted/30",
          "bg-[radial-gradient(color-mix(in_oklch,var(--foreground)_14%,transparent)_1px,transparent_1.2px)] bg-size-[16px_16px]",
          isPanning ? "cursor-grabbing select-none" : "cursor-grab",
        )}
      >
        <div
          ref={boardRef}
          className="flex w-max min-w-full items-start px-6 pt-6 pb-24"
          style={{ zoom }}
        >
          <TriggerNode
            trigger={workflow.trigger}
            defaults={definition.trigger}
            edited={workflow.triggerEdited}
            sourceFile={definition.source_file}
            isEditing={editing === "trigger"}
            isSaving={isSaving}
            onEdit={() => onEdit("trigger")}
            onCancel={onCancel}
            onSave={onSaveTrigger}
          />
          <Connector label="starts" />

          {workflow.steps.map((step, i) => {
            const isLast = i === workflow.steps.length - 1;
            const next = workflow.steps[i + 1];
            return (
              <div key={step.key} className="flex items-start">
                <StepNode
                  step={step}
                  defaults={definition.steps[i]}
                  index={i}
                  edited={step.edited}
                  isLast={isLast}
                  isEditing={editing === step.key}
                  isSaving={isSaving}
                  onEdit={() => onEdit(step.key)}
                  onCancel={onCancel}
                  onSave={(values) => onSaveStep(step.key, values)}
                  onToolDrop={(tool) => onToolDrop(step.key, tool)}
                />
                {isLast ? (
                  <>
                    <Connector label="done" />
                    <EndNode />
                  </>
                ) : step.pausesForCustomer ? (
                  <>
                    <Connector />
                    <BranchNode stepKey={step.key} stepIndex={i} next={next} />
                  </>
                ) : (
                  <Connector label="then" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-3 left-3 flex items-center rounded-lg border bg-card shadow-sm">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom out"
          disabled={zoom <= MIN_ZOOM}
          onClick={() => changeZoom(zoom - ZOOM_STEP)}
        >
          <IconMinus />
        </Button>
        <span className="w-12 text-center text-xs text-muted-foreground tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom in"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => changeZoom(zoom + ZOOM_STEP)}
        >
          <IconPlus />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="border-l"
          onClick={fitToView}
        >
          <IconFocusCentered />
          Fit
        </Button>
      </div>

      <nav
        aria-label="Jump to"
        className="absolute right-3 bottom-3 hidden items-center gap-1 rounded-lg border bg-card p-1 shadow-sm sm:flex"
      >
        {jumpTargets.map((target) => (
          <Button
            key={target.id}
            variant="ghost"
            size="xs"
            onClick={() => jumpTo(target.id)}
          >
            {target.label}
          </Button>
        ))}
      </nav>
    </div>
  );
}
