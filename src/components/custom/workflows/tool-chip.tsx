import { IconTool } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

/** Drag type for a tool dragged into a step's text. */
export const TOOL_DRAG_TYPE = "application/x-store-signal-tool";

/**
 * The look of a tool mention. One class string, because chips are drawn
 * both by React ({@link ToolChip}) and as plain DOM inside the editor.
 */
export const TOOL_CHIP_CLASS =
  "mx-0.5 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-1.5 align-[1px] text-xs font-medium text-primary";

/** A tool name shown as a chip inside prompt text. */
export function ToolChip({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span className={cn(TOOL_CHIP_CLASS, className)}>
      <IconTool className="size-3 shrink-0" />
      <span className="truncate font-mono">{name}</span>
    </span>
  );
}

/**
 * Start dragging a tool: sets the drag data every drop target reads, and a
 * small chip as the drag image instead of a snapshot of whatever is being
 * dragged (a whole card in the Tools panel).
 */
export function startToolDrag(
  dataTransfer: DataTransfer,
  name: string,
  effect: "copy" | "copyMove",
) {
  dataTransfer.setData(TOOL_DRAG_TYPE, name);
  dataTransfer.setData("text/plain", name);
  dataTransfer.effectAllowed = effect;

  const ghost = document.createElement("span");
  ghost.className = cn(
    TOOL_CHIP_CLASS,
    "fixed -top-24 left-0 bg-card py-px shadow-sm",
  );
  ghost.textContent = name;
  ghost.style.fontFamily = "var(--font-mono, ui-monospace, monospace)";
  document.body.append(ghost);
  dataTransfer.setDragImage(ghost, 12, ghost.offsetHeight / 2);
  // The browser copies the image when the drag starts; the node can go.
  setTimeout(() => ghost.remove(), 0);
}
