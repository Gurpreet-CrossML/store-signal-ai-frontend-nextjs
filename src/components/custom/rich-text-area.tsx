import { useEffect, useRef } from "react";
import { Extension } from "@tiptap/core";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBold,
  IconItalic,
  IconList,
  IconListNumbers,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type RichTextAreaProps = {
  id?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  /** Fires when the editor loses focus. */
  onBlur?: () => void;
  /** Read and write Markdown instead of HTML. */
  useMarkdown?: boolean;
  disabled?: boolean;
  /** Extra classes for the frame, e.g. to change its rounding. */
  className?: string;
  /** Typing room before the box grows. Any CSS length. */
  minHeight?: string;
  /** Height at which the box stops growing and scrolls. Any CSS length. */
  maxHeight?: string;
  /**
   * "compact": bold, italic and the two lists only, with `toolbarEnd` after
   * them, and no frame of its own — for a composer that draws its own card.
   * "none": no toolbar and no frame, for the phone composer.
   */
  toolbar?: "full" | "compact" | "none";
  /** Extra controls at the end of a compact toolbar (attach, translate). */
  toolbarEnd?: React.ReactNode;
  /**
   * Places to mark in the text, found by the backend: `start`/`end` count
   * in `marksSource` (the Markdown they were found in, JavaScript string
   * units), and `count` is how many things point there. A place edited
   * since loses its mark.
   */
  marks?: TextMark[];
  /** The Markdown `marks` count places in. */
  marksSource?: string;
};

/** A place in the text to mark, and how many things point at it. */
export type TextMark = { start: number; end: number; count: number };

// The places to mark and their drawn marks, in the editor's state.
type MarkState = {
  marks: TextMark[];
  source: string;
  decorations: DecorationSet;
};
const MARKS_KEY = new PluginKey<MarkState>("marks");

/**
 * Where each of the editor's text pieces sits in the Markdown it came from
 * (`at`). Pieces are looked up in order, so one edited since isn't found
 * and is left out.
 */
function textPlaces(doc: ProseMirrorNode, source: string) {
  const places: { at: number; pos: number; length: number }[] = [];
  let cursor = 0;
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return true;
    const at = source.indexOf(node.text, cursor);
    if (at >= 0) {
      places.push({ at, pos, length: node.text.length });
      cursor = at + node.text.length;
    }
    return false;
  });
  return places;
}

/** The "⚠ N" shown after a marked place. */
function markCount(count: number) {
  const badge = document.createElement("span");
  badge.className = "rich-text-flag-count";
  badge.contentEditable = "false";
  badge.textContent = `⚠ ${count}`;
  return badge;
}

/** Draw each place: a tint over its text, then its count. */
function markDecorations(
  doc: ProseMirrorNode,
  marks: TextMark[],
  source: string,
) {
  if (!marks.length || !source) return DecorationSet.empty;
  const places = textPlaces(doc, source);
  const decorations: Decoration[] = [];
  for (const mark of marks) {
    let end = -1;
    // A place can span several text pieces (bold words inside it).
    for (const place of places) {
      const from = Math.max(mark.start, place.at);
      const to = Math.min(mark.end, place.at + place.length);
      if (from >= to) continue;
      decorations.push(
        Decoration.inline(
          place.pos + from - place.at,
          place.pos + to - place.at,
          {
            class: "rich-text-flag",
            "data-mark": String(mark.start),
          },
        ),
      );
      end = place.pos + to - place.at;
    }
    if (end >= 0)
      decorations.push(
        Decoration.widget(end, () => markCount(mark.count), {
          side: 1,
          key: `mark-${mark.start}-${mark.count}`,
        }),
      );
  }
  return DecorationSet.create(doc, decorations);
}

/**
 * Marks places in the text. They come in on a transaction (see the effect
 * in RichTextArea) and are redrawn on every edit.
 */
const Marks = Extension.create({
  name: "marks",
  addProseMirrorPlugins() {
    return [
      new Plugin<MarkState>({
        key: MARKS_KEY,
        state: {
          init: () => ({
            marks: [],
            source: "",
            decorations: DecorationSet.empty,
          }),
          apply: (tr, old) => {
            const next: Omit<MarkState, "decorations"> | undefined =
              tr.getMeta(MARKS_KEY);
            if (next)
              return {
                ...next,
                decorations: markDecorations(tr.doc, next.marks, next.source),
              };
            return tr.docChanged
              ? {
                  ...old,
                  decorations: markDecorations(tr.doc, old.marks, old.source),
                }
              : old;
          },
        },
        props: {
          decorations: (state) => MARKS_KEY.getState(state)?.decorations,
        },
      }),
    ];
  },
});

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

// Only what the toolbar offers is enabled, so pasted content can't smuggle in
// formatting (quotes, code, links…) the user has no way to see or undo.
const BASE_EXTENSIONS = [
  StarterKit.configure({
    blockquote: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    underline: false,
    link: false,
    heading: { levels: [...HEADING_LEVELS] },
  }),
];

const serialize = (editor: Editor, useMarkdown?: boolean) => {
  // An empty document serialises to "<p></p>"; callers treat "" as empty.
  if (editor.isEmpty) return "";
  return useMarkdown ? editor.getMarkdown() : editor.getHTML();
};

const ToolbarButton = ({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="icon-sm"
    aria-label={label}
    title={label}
    aria-pressed={active}
    disabled={disabled}
    className={cn(active && "bg-muted text-primary")}
    // Keep the selection in the editor; a click would otherwise blur it.
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
  >
    {children}
  </Button>
);

const Toolbar = ({
  editor,
  disabled,
  compact,
  end,
}: {
  editor: Editor;
  disabled?: boolean;
  compact?: boolean;
  end?: React.ReactNode;
}) => {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      heading:
        HEADING_LEVELS.find((level) => e.isActive("heading", { level })) ?? 0,
    }),
  });

  if (compact) {
    return (
      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5"
      >
        <ToolbarButton
          label="Bold"
          active={state.bold}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <IconBold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={state.italic}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <IconItalic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Bulleted list"
          active={state.bulletList}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <IconList className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={state.orderedList}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <IconListNumbers className="size-4" />
        </ToolbarButton>
        {end ? (
          <>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden />
            {end}
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-1 border-b border-border p-1"
    >
      <ToolbarButton
        label="Undo"
        disabled={disabled || !state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <IconArrowBackUp className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={disabled || !state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <IconArrowForwardUp className="size-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      <Select
        value={String(state.heading)}
        disabled={disabled}
        onValueChange={(next) => {
          const level = Number(next) as 0 | (typeof HEADING_LEVELS)[number];
          const chain = editor.chain().focus();
          if (level === 0) chain.setParagraph().run();
          else chain.setHeading({ level }).run();
        }}
      >
        <SelectTrigger size="sm" className="w-32" aria-label="Text style">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Paragraph</SelectItem>
          {HEADING_LEVELS.map((level) => (
            <SelectItem key={level} value={String(level)}>
              Heading {level}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      <ToolbarButton
        label="Bold"
        active={state.bold}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <IconBold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={state.italic}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <IconItalic className="size-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      <ToolbarButton
        label="Bulleted list"
        active={state.bulletList}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <IconList className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={state.orderedList}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <IconListNumbers className="size-4" />
      </ToolbarButton>
    </div>
  );
};

const RichTextArea: React.FC<RichTextAreaProps> = ({
  id,
  placeholder,
  value,
  onChange,
  onBlur,
  useMarkdown,
  disabled,
  className,
  minHeight,
  maxHeight,
  toolbar = "full",
  toolbarEnd,
  marks,
  marksSource,
}) => {
  const contentType = useMarkdown ? "markdown" : "html";
  // Both drop the frame: the composer around them draws its own card.
  const compact = toolbar !== "full";
  // One string, so new arrays with the same places change nothing.
  const marksKey = JSON.stringify({
    marks: marks ?? [],
    source: marksSource ?? "",
  });

  // The latest value this editor emitted, so the sync effect below can tell
  // an echo of the user's own typing from a genuine external change.
  const lastEmitted = useRef(value ?? "");
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  useEffect(() => {
    onChangeRef.current = onChange;
    onBlurRef.current = onBlur;
  }, [onChange, onBlur]);

  const editor = useEditor(
    {
      extensions: [
        ...BASE_EXTENSIONS,
        Placeholder.configure({
          placeholder: placeholder || "Type or paste your content here!",
        }),
        Marks,
        ...(useMarkdown ? [Markdown] : []),
      ],
      content: value ?? "",
      contentType,
      editable: !disabled,
      // Next renders this on the server first; defer until the client mounts.
      immediatelyRender: false,
      editorProps: {
        attributes: {
          ...(id ? { id } : {}),
          class: "rich-text-content",
          role: "textbox",
          "aria-multiline": "true",
        },
      },
      onBlur: () => onBlurRef.current?.(),
      onUpdate: ({ editor: e }) => {
        const next = serialize(e, useMarkdown);
        lastEmitted.current = next;
        onChangeRef.current?.(next);
      },
    },
    // Switching between HTML and Markdown changes the schema's extensions.
    [useMarkdown],
  );

  // The editor is made once, so a new placeholder (another customer's name,
  // a note instead of a reply) is set on the extension and redrawn.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const extension = editor.extensionManager.extensions.find(
      (candidate) => candidate.name === "placeholder",
    );
    const next = placeholder || "Type or paste your content here!";
    if (!extension || extension.options.placeholder === next) return;
    extension.options.placeholder = next;
    // An empty transaction redraws the placeholder decoration.
    editor.view.dispatch(editor.state.tr);
  }, [editor, placeholder]);

  // New places to mark: redraw the marks without touching the text.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.view.dispatch(
      editor.state.tr.setMeta(MARKS_KEY, JSON.parse(marksKey)),
    );
  }, [editor, marksKey]);

  useEffect(() => {
    // `false`: by default setEditable fires an update event, which would echo
    // the editor's stale text back through onChange the moment a send disables
    // it — undoing the parent's reset of the reply.
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);

  // Push external changes (a reset, an AI rewrite, a loaded draft) into the
  // editor without echoing them back through onChange.
  useEffect(() => {
    if (!editor) return;
    const next = value ?? "";
    if (next === lastEmitted.current) return;
    lastEmitted.current = next;
    editor.commands.setContent(next, { contentType, emitUpdate: false });
  }, [editor, value, contentType]);

  return (
    // The frame lives here rather than in each caller so the editor reads as
    // the same kind of control as Input — border, rounding, focus ring —
    // wherever it lands.
    <div
      className={cn(
        "rich-text-shell w-full bg-background text-sm transition-[color,box-shadow]",
        compact
          ? "rounded-none border-0"
          : "rounded-md border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        disabled && "opacity-60",
        className,
      )}
      style={
        {
          ...(minHeight && { "--rich-text-min-height": minHeight }),
          ...(maxHeight && { "--rich-text-max-height": maxHeight }),
        } as React.CSSProperties
      }
    >
      {editor && toolbar !== "none" && (
        <Toolbar
          editor={editor}
          disabled={disabled}
          compact={compact}
          end={toolbarEnd}
        />
      )}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextArea;
