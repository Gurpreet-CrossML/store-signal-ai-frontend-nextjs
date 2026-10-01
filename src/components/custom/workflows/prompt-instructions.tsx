import { Fragment } from "react";

import { ToolChip } from "./tool-chip";
import { parseInstructions, splitToolMentions } from "@/lib/workflows";
import { cn } from "@/lib/utils";

/** Text with every mention of one of the step's tools shown as a chip. */
function WithTools({ text, tools }: { text: string; tools: string[] }) {
  return (
    <>
      {splitToolMentions(text, tools).map((part, i) =>
        "tool" in part ? (
          <ToolChip key={i} name={part.tool} />
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}

// Each nesting level indents by the width of a marker column.
const DEPTH_INDENT = ["ml-0", "ml-6", "ml-12", "ml-18"];

/**
 * Prompt text as the reader sees it: `<tag>` sections as headings, rules
 * and points nested by their indentation, tool names as chips. The text
 * itself is untouched — this only lays it out.
 */
export function PromptInstructions({
  text,
  tools = [],
  className,
}: {
  text: string;
  tools?: string[];
  className?: string;
}) {
  const blocks = parseInstructions(text);

  if (blocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No instructions yet.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          return (
            <h4
              key={i}
              className={cn(
                "text-[11px] font-semibold tracking-wide text-muted-foreground uppercase",
                i > 0 && "mt-3",
              )}
            >
              {block.text}
            </h4>
          );
        }

        if (block.kind === "paragraph") {
          return (
            <p
              key={i}
              className={cn(
                "text-sm leading-relaxed text-foreground/80",
                // Explanations sit under the text of the point they belong to.
                block.depth > 0 &&
                  DEPTH_INDENT[Math.min(block.depth, DEPTH_INDENT.length - 1)],
              )}
            >
              <WithTools text={block.text} tools={tools} />
            </p>
          );
        }

        const isBullet = ["-", "•", "*"].includes(block.marker);
        return (
          <div
            key={i}
            className={cn(
              "flex gap-2 text-sm leading-relaxed",
              DEPTH_INDENT[block.depth],
              block.depth === 0 && !isBullet
                ? "font-medium"
                : "text-foreground/80",
            )}
          >
            <span
              className={cn(
                "w-4 shrink-0 text-right text-muted-foreground tabular-nums",
                isBullet && "text-muted-foreground/60",
              )}
            >
              {isBullet ? "•" : block.marker}
            </span>
            <span className="min-w-0">
              <WithTools text={block.text} tools={tools} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
