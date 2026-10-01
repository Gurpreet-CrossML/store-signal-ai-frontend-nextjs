"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { splitToolMentions } from "@/lib/workflows";
import { cn } from "@/lib/utils";

import { startToolDrag, TOOL_CHIP_CLASS, TOOL_DRAG_TYPE } from "./tool-chip";

// Chips here are plain DOM (not React): the editor's content belongs to the
// browser while typing, and React re-rendering it would move the cursor.
const REMOVE_CLASS =
  "grid size-3.5 place-items-center rounded-full text-primary/70 hover:bg-primary/20 hover:text-primary";

// The chip being dragged out of an editor, so the drop can move it (take
// it out of where it was) instead of copying it. Shared across editors, so
// a chip can move between the boxes of a step.
let draggedChip: HTMLElement | null = null;

function createChip(name: string): HTMLSpanElement {
  const chip = document.createElement("span");
  chip.contentEditable = "false";
  chip.draggable = true;
  chip.dataset.tool = name;
  chip.className = cn(
    TOOL_CHIP_CLASS,
    "cursor-grab py-px pr-1 select-none active:cursor-grabbing",
  );

  const label = document.createElement("span");
  label.className = "font-mono";
  label.textContent = name;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.dataset.removeTool = "";
  remove.className = REMOVE_CLASS;
  remove.setAttribute("aria-label", `Remove ${name}`);
  remove.textContent = "×";

  chip.append(label, remove);
  return chip;
}

/** Fill the editor from text, turning every mention of a tool into a chip. */
function render(root: HTMLElement, text: string, tools: string[]) {
  root.replaceChildren(
    ...splitToolMentions(text, tools).map((part) =>
      "tool" in part
        ? createChip(part.tool)
        : document.createTextNode(part.text),
    ),
  );
}

/** Read the editor back into plain text: chips become their tool name. */
function serialize(node: Node): string {
  let out = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? "";
      return;
    }
    if (!(child instanceof HTMLElement)) return;
    if (child.dataset.tool) {
      out += child.dataset.tool;
    } else if (child.tagName === "BR") {
      out += "\n";
    } else {
      // A block the browser added on its own (a <div> per line).
      const inner = serialize(child);
      out += (out && !out.endsWith("\n") ? "\n" : "") + inner;
    }
  });
  return out;
}

/** The character just before a collapsed range, or "" at the start. */
function charBefore(range: Range): string {
  const probe = range.cloneRange();
  probe.collapse(true);
  const before = document.createRange();
  before.selectNodeContents(probe.startContainer.getRootNode() as Node);
  try {
    before.setEnd(probe.startContainer, probe.startOffset);
  } catch {
    return "";
  }
  return before.toString().slice(-1);
}

/**
 * Remove a chip and the space it leaves behind, so "call ⟨tool⟩ once"
 * becomes "call once" rather than "call  once".
 */
function removeChip(chip: Element) {
  const previous = chip.previousSibling;
  const next = chip.nextSibling;
  chip.remove();
  if (
    previous?.nodeType === Node.TEXT_NODE &&
    next?.nodeType === Node.TEXT_NODE &&
    /\s$/.test(previous.textContent ?? "") &&
    /^ /.test(next.textContent ?? "")
  ) {
    next.textContent = (next.textContent ?? "").slice(1);
  }
}

/** Move a drop point inside a word to the end of that word. */
function snapToWordEnd(range: Range | null): Range | null {
  if (!range || range.startContainer.nodeType !== Node.TEXT_NODE) return range;
  const text = range.startContainer.textContent ?? "";
  let offset = range.startOffset;
  if (offset > 0 && /\w/.test(text[offset - 1] ?? "")) {
    while (offset < text.length && /\w/.test(text[offset])) offset += 1;
  }
  range.setStart(range.startContainer, offset);
  range.collapse(true);
  return range;
}

type CaretBox = { left: number; top: number; height: number };

/** Where a collapsed range sits on screen, as a text cursor's box. */
function caretBox(range: Range): CaretBox | null {
  let rect = range.getBoundingClientRect();
  if (!rect.height) {
    // Some positions (between elements, an empty line) measure as nothing;
    // measure a zero-width marker placed there instead.
    const marker = document.createElement("span");
    marker.textContent = "\u200b";
    range.insertNode(marker);
    rect = marker.getBoundingClientRect();
    const parent = marker.parentNode;
    marker.remove();
    // Re-join the text the marker split, so the box keeps one text node.
    parent?.normalize();
  }
  if (!rect.height) return null;
  return { left: rect.left, top: rect.top, height: rect.height };
}

/** The text position under a point, in whichever API the browser has. */
function rangeFromPoint(x: number, y: number): Range | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null;
  };
  if (doc.caretPositionFromPoint) {
    const position = doc.caretPositionFromPoint(x, y);
    if (!position) return null;
    const range = document.createRange();
    range.setStart(position.offsetNode, position.offset);
    return range;
  }
  return document.caretRangeFromPoint?.(x, y) ?? null;
}

/**
 * A plain-text box where tool names stay chips: each with an × to remove
 * it, dragged to move it, and new ones dragged in from the Tools panel.
 * What it reports through `onChange` is ordinary text — a chip is just its
 * tool name — so it saves exactly like a textarea would.
 *
 * Uncontrolled: it takes `initialValue` once. Give it a new `key` to load
 * different text (e.g. "Use default").
 */
export function ToolTextEditor({
  id,
  initialValue,
  tools,
  onChange,
  onToolDrop,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string;
  initialValue: string;
  tools: string[];
  onChange: (value: string) => void;
  /** A tool was dropped in — e.g. so the step can be given that tool. */
  onToolDrop?: (name: string) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  // A blinking cursor showing where a dragged tool will land.
  const [dropCaret, setDropCaret] = useState<CaretBox | null>(null);

  // A drag can end anywhere (or be cancelled with Esc); always clear it.
  useEffect(() => {
    const clear = () => setDropCaret(null);
    window.addEventListener("dragend", clear);
    window.addEventListener("drop", clear);
    return () => {
      window.removeEventListener("dragend", clear);
      window.removeEventListener("drop", clear);
    };
  }, []);
  const toolsKey = tools.join("|");

  const loaded = useRef(false);

  // First load: the initial text. When the step's tools change later (one
  // added from the Tools panel), re-chip what is in the box now, so the
  // text being written is kept.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const text = loaded.current ? serialize(root) : initialValue;
    render(root, text, tools);
    loaded.current = true;
    // initialValue is read once per mount; a new key reloads it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsKey]);

  const emit = () => {
    if (rootRef.current) onChange(serialize(rootRef.current));
  };

  const insertChipAt = (range: Range | null, name: string) => {
    const root = rootRef.current;
    if (!root) return;
    const chip = createChip(name);
    const space = document.createTextNode(" ");
    let caretAfter: Node = space;
    if (range && root.contains(range.startContainer)) {
      range.deleteContents();
      const needsGapBefore = /\S/.test(charBefore(range));
      const container = range.startContainer;
      const following =
        container.nodeType === Node.TEXT_NODE
          ? (container.textContent ?? "").slice(range.startOffset)
          : "";
      // A space only where one is missing, so no double spaces appear.
      if (/^\s/.test(following)) {
        range.insertNode(chip);
        caretAfter = chip;
      } else {
        range.insertNode(space);
        range.insertNode(chip);
      }
      // Keep the tool apart from a word it was dropped right after.
      if (needsGapBefore) chip.before(document.createTextNode(" "));
    } else {
      const text = serialize(root);
      if (text && !/\s$/.test(text)) root.append(document.createTextNode(" "));
      root.append(chip, space);
    }
    // Put the cursor after the inserted tool, ready to keep typing.
    const after = document.createRange();
    after.setStartAfter(caretAfter);
    after.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(after);
    root.focus();
    emit();
  };

  return (
    <>
      <div
        id={id}
        ref={rootRef}
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onKeyDown={(event) => {
          // A plain line break, not the <div> browsers add on Enter.
          if (event.key === "Enter") {
            event.preventDefault();
            document.execCommand("insertText", false, "\n");
          }
        }}
        onPaste={(event) => {
          // Text only: pasted formatting would never reach the prompt.
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
        onClick={(event) => {
          const remove = (event.target as HTMLElement).closest(
            "[data-remove-tool]",
          );
          if (remove) {
            event.preventDefault();
            const chip = remove.closest("[data-tool]");
            if (chip) removeChip(chip);
            emit();
          }
        }}
        onDragStart={(event) => {
          const chip = (event.target as HTMLElement).closest?.("[data-tool]");
          if (!(chip instanceof HTMLElement) || !chip.dataset.tool) return;
          draggedChip = chip;
          startToolDrag(event.dataTransfer, chip.dataset.tool, "copyMove");
        }}
        onDragEnd={() => {
          draggedChip = null;
        }}
        onDragEnter={(event) => {
          if (event.dataTransfer.types.includes(TOOL_DRAG_TYPE)) {
            event.preventDefault();
          }
        }}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes(TOOL_DRAG_TYPE)) {
            event.preventDefault();
            event.dataTransfer.dropEffect = draggedChip ? "move" : "copy";
            // Same snapping as the drop, so the cursor shows exactly where
            // the tool will go.
            const range = snapToWordEnd(
              rangeFromPoint(event.clientX, event.clientY),
            );
            const box =
              range && rootRef.current?.contains(range.startContainer)
                ? caretBox(range)
                : null;
            setDropCaret((current) =>
              current &&
              box &&
              current.left === box.left &&
              current.top === box.top
                ? current
                : box,
            );
          }
        }}
        onDragLeave={(event) => {
          const next = event.relatedTarget as Node | null;
          if (!next || !rootRef.current?.contains(next)) setDropCaret(null);
        }}
        onDrop={(event) => {
          const name = event.dataTransfer.getData(TOOL_DRAG_TYPE);
          if (!name) return;
          event.preventDefault();
          setDropCaret(null);
          const moving = draggedChip;
          draggedChip = null;
          const range = snapToWordEnd(
            rangeFromPoint(event.clientX, event.clientY),
          );
          // Dropped back onto itself: nothing to do.
          if (moving && range && moving.contains(range.startContainer)) return;
          insertChipAt(range, name);
          if (moving) {
            // A move, not a copy: take the chip out of where it was, and let
            // the box it came from report its new text too.
            const source = moving.closest('[role="textbox"]');
            removeChip(moving);
            if (source && source !== rootRef.current) {
              source.dispatchEvent(new Event("input", { bubbles: true }));
            }
            emit();
          }
          onToolDrop?.(name);
        }}
        className={cn(
          "min-h-16 w-full overflow-y-auto rounded-md border border-input bg-transparent px-2.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap shadow-xs outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
          className,
        )}
      />
      {dropCaret &&
        createPortal(
          // On <body>, so the canvas zoom can't throw off its position.
          <span
            aria-hidden
            style={{
              left: dropCaret.left - 1,
              top: dropCaret.top,
              height: dropCaret.height,
            }}
            className="pointer-events-none fixed z-50 w-0.5 animate-caret-blink rounded-full bg-primary"
          />,
          document.body,
        )}
    </>
  );
}
