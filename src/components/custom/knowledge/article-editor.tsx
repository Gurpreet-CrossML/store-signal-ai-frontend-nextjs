"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBold,
  IconCode,
  IconH2,
  IconH3,
  IconItalic,
  IconLink,
  IconList,
  IconListNumbers,
  IconMinus,
  IconQuote,
  IconStrikethrough,
  IconTable,
  IconUnderline,
  type Icon,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EXTENSIONS = [
  StarterKit.configure({
    // The article's title is its own field, so the body starts at level 2.
    heading: { levels: [2, 3] },
    link: { openOnClick: false, autolink: true },
  }),
  Placeholder.configure({
    placeholder: "Start writing, or type / to add a heading, list or table.",
  }),
  Table,
  TableRow,
  TableHeader,
  TableCell,
];

/** Blocks offered by the "/" menu. */
type SlashItem = {
  label: string;
  hint: string;
  icon: Icon;
  run: (editor: Editor) => void;
};

const SLASH_ITEMS: SlashItem[] = [
  {
    label: "Heading 2",
    hint: "Section title",
    icon: IconH2,
    run: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
  },
  {
    label: "Heading 3",
    hint: "Smaller title",
    icon: IconH3,
    run: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
  },
  {
    label: "Bulleted list",
    hint: "Simple list",
    icon: IconList,
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Numbered list",
    hint: "Steps in order",
    icon: IconListNumbers,
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "Quote",
    hint: "Call out a note",
    icon: IconQuote,
    run: (editor) => editor.chain().focus().setBlockquote().run(),
  },
  {
    label: "Table",
    hint: "Rows and columns",
    icon: IconTable,
    run: (editor) =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    label: "Divider",
    hint: "Split sections",
    icon: IconMinus,
    run: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
];

/** The text after a "/" that starts an empty-ish line, and where to draw the menu. */
type SlashState = { query: string; top: number; left: number } | null;

function readSlashState(editor: Editor): SlashState {
  const { selection } = editor.state;
  if (!selection.empty) return null;

  const { $from } = selection;
  if ($from.parent.type.name !== "paragraph") return null;

  const text = $from.parent.textContent;
  if (!text.startsWith("/") || /\s/.test(text)) return null;

  const coords = editor.view.coordsAtPos(selection.from);
  return { query: text.slice(1), top: coords.bottom + 6, left: coords.left };
}

function ToolbarButton({
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
}) {
  return (
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
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />;
}

function LinkButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState("");
  const isLink = useEditorState({
    editor,
    selector: ({ editor: e }) => e.isActive("link"),
  });

  const apply = () => {
    const value = href.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (value) chain.setLink({ href: value }).run();
    else chain.unsetLink().run();
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setHref(editor.getAttributes("link").href ?? "");
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Link"
          title="Link"
          aria-pressed={isLink}
          className={cn(isLink && "bg-muted text-primary")}
          onMouseDown={(event) => event.preventDefault()}
        >
          <IconLink className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 gap-2">
        <Input
          autoFocus
          placeholder="https://…"
          aria-label="Link address"
          value={href}
          onChange={(event) => setHref(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              apply();
            }
          }}
        />
        <div className="flex justify-end gap-2">
          {isLink && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setHref("");
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .unsetLink()
                  .run();
                setOpen(false);
              }}
            >
              Remove
            </Button>
          )}
          <Button type="button" size="sm" onClick={apply}>
            {isLink ? "Update" : "Add link"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Toolbar({ editor, words }: { editor: Editor; words: number }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      heading: e.isActive("heading", { level: 2 })
        ? 2
        : e.isActive("heading", { level: 3 })
          ? 3
          : 0,
    }),
  });

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex items-center gap-1 overflow-x-auto border-b px-3 py-1.5"
    >
      <ToolbarButton
        label="Undo"
        disabled={!state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <IconArrowBackUp className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={!state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <IconArrowForwardUp className="size-4" />
      </ToolbarButton>
      <Divider />

      <Select
        value={String(state.heading)}
        onValueChange={(next) => {
          const chain = editor.chain().focus();
          if (next === "0") chain.setParagraph().run();
          else chain.setHeading({ level: Number(next) as 2 | 3 }).run();
        }}
      >
        <SelectTrigger
          size="sm"
          className="w-32 shrink-0"
          aria-label="Text style"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Paragraph</SelectItem>
          <SelectItem value="2">Heading 2</SelectItem>
          <SelectItem value="3">Heading 3</SelectItem>
        </SelectContent>
      </Select>
      <Divider />

      <ToolbarButton
        label="Bold"
        active={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <IconBold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <IconItalic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={state.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <IconUnderline className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={state.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <IconStrikethrough className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Code"
        active={state.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <IconCode className="size-4" />
      </ToolbarButton>
      <Divider />

      <ToolbarButton
        label="Bulleted list"
        active={state.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <IconList className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={state.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <IconListNumbers className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={state.quote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <IconQuote className="size-4" />
      </ToolbarButton>
      <Divider />

      <LinkButton editor={editor} />
      <ToolbarButton
        label="Table"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
      >
        <IconTable className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <IconMinus className="size-4" />
      </ToolbarButton>

      <span className="ml-auto shrink-0 pl-3 text-xs whitespace-nowrap text-muted-foreground">
        {words.toLocaleString()} {words === 1 ? "word" : "words"}
        <span className="hidden sm:inline">
          {" · Type "}
          <kbd className="rounded border px-1 font-mono">/</kbd>
          {" for blocks"}
        </span>
      </span>
    </div>
  );
}

/**
 * The article body: a rich-text editor with a toolbar and a "/" menu for
 * adding blocks. Emits HTML (`""` while empty) and hands the editor up, so the
 * page can read back its cleaned HTML (e.g. for a preview).
 */
export function ArticleEditor({
  initialHtml,
  onChange,
  onReady,
  disabled = false,
}: {
  /** Read once, when the editor is created. */
  initialHtml: string;
  onChange: (html: string) => void;
  onReady?: (editor: Editor) => void;
  disabled?: boolean;
}) {
  // Latest list and highlighted entry, for the key handler below, which the
  // editor holds on to from when it was created.
  const slashRef = useRef<{
    items: SlashItem[];
    index: number;
    pick: (item: SlashItem) => void;
    setIndex: (index: number) => void;
  } | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: EXTENSIONS,
    content: initialHtml,
    editable: !disabled,
    // Next renders this on the server first; defer until the client mounts.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text-content article-content",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Article body",
      },
      handleKeyDown: (_view, event) => {
        const menu = slashRef.current;
        if (!menu || menu.items.length === 0) return false;

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          const step = event.key === "ArrowDown" ? 1 : -1;
          menu.setIndex(
            (menu.index + step + menu.items.length) % menu.items.length,
          );
          return true;
        }
        if (event.key === "Enter") {
          menu.pick(menu.items[menu.index]);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) =>
      onChangeRef.current(e.isEmpty ? "" : e.getHTML()),
  });

  useEffect(() => {
    if (editor) onReady?.(editor);
    // Handing the editor up once it exists is all this does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEffect(() => {
    // `false`: changing editability is not an edit, so it must not emit an update.
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);

  const slash = useEditorState({
    editor,
    selector: ({ editor: e }) => (e ? readSlashState(e) : null),
    equalityFn: (a, b) =>
      a?.query === b?.query && a?.top === b?.top && a?.left === b?.left,
  });
  const words = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e ? e.getText().split(/\s+/).filter(Boolean).length : 0,
  });

  // The highlighted entry resets whenever the typed filter changes.
  const [active, setActive] = useState({ query: "", index: 0 });
  const query = slash?.query ?? "";
  const items = SLASH_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );
  const index =
    active.query === query ? Math.min(active.index, items.length - 1) : 0;

  const pick = (item: SlashItem) => {
    if (!editor) return;
    // Remove the "/…" the user typed, then insert the block in its place.
    const { $from } = editor.state.selection;
    editor
      .chain()
      .focus()
      .deleteRange({ from: $from.start(), to: $from.pos })
      .run();
    item.run(editor);
  };

  useEffect(() => {
    slashRef.current = slash
      ? {
          items,
          index,
          pick,
          setIndex: (next) => setActive({ query, index: next }),
        }
      : null;
  });

  if (!editor) return <div className="min-h-80" aria-busy />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Toolbar editor={editor} words={words ?? 0} />
      <div className="px-4 py-6 sm:px-8">
        <EditorContent editor={editor} />
      </div>

      {slash && items.length > 0 && (
        <div
          role="listbox"
          aria-label="Blocks"
          style={{
            position: "fixed",
            top: slash.top,
            left: Math.min(slash.left, window.innerWidth - 240),
          }}
          className="z-50 w-56 rounded-lg border bg-popover p-1 shadow-md"
        >
          {items.map((item, itemIndex) => (
            <button
              key={item.label}
              type="button"
              role="option"
              aria-selected={itemIndex === index}
              // Keep the caret in the editor while choosing.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick(item)}
              onMouseEnter={() => setActive({ query, index: itemIndex })}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm",
                itemIndex === index && "bg-muted",
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background">
                <item.icon className="size-4" />
              </span>
              <span className="flex flex-col">
                <span className="font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">
                  {item.hint}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
