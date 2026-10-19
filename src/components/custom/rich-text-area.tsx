import { useEffect, useRef } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
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
  /** Read and write Markdown instead of HTML. */
  useMarkdown?: boolean;
  disabled?: boolean;
  /** Extra classes for the frame, e.g. to change its rounding. */
  className?: string;
  /** Typing room before the box grows. Any CSS length. */
  minHeight?: string;
  /** Height at which the box stops growing and scrolls. Any CSS length. */
  maxHeight?: string;
};

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
}: {
  editor: Editor;
  disabled?: boolean;
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
  useMarkdown,
  disabled,
  className,
  minHeight,
  maxHeight,
}) => {
  const contentType = useMarkdown ? "markdown" : "html";

  // The latest value this editor emitted, so the sync effect below can tell
  // an echo of the user's own typing from a genuine external change.
  const lastEmitted = useRef(value ?? "");
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor(
    {
      extensions: [
        ...BASE_EXTENSIONS,
        Placeholder.configure({
          placeholder: placeholder || "Type or paste your content here!",
        }),
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
      onUpdate: ({ editor: e }) => {
        const next = serialize(e, useMarkdown);
        lastEmitted.current = next;
        onChangeRef.current?.(next);
      },
    },
    // Switching between HTML and Markdown changes the schema's extensions.
    [useMarkdown],
  );

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
        "rich-text-shell w-full rounded-md border border-input bg-background text-sm transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
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
      {editor && <Toolbar editor={editor} disabled={disabled} />}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextArea;
