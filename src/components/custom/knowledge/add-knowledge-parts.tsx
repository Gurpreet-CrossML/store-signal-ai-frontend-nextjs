"use client";

import {
  IconArticle,
  IconBolt,
  IconCheck,
  IconFileText,
  IconGlobe,
  IconMessageQuestion,
  type Icon,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/** What can be added. Articles open the editor; the rest continue here. */
export type AddableSource = "url" | "file" | "article" | "faq";

export type AddStep = "source" | "content" | "done";

const STEPS: { key: AddStep; label: string }[] = [
  { key: "source", label: "Choose A Source" },
  { key: "content", label: "Add Content" },
  { key: "done", label: "Done" },
];

/** The three numbered steps along the top, with the finished ones ticked. */
export function AddKnowledgeStepper({ step }: { step: AddStep }) {
  const current = STEPS.findIndex(({ key }) => key === step);

  return (
    <ol
      aria-label="Progress"
      className="flex items-center gap-4 overflow-x-auto border-b sm:gap-6"
    >
      {STEPS.map(({ key, label }, index) => {
        const isCurrent = index === current;
        const isDone = index < current;
        return (
          <li
            key={key}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 py-2.5 text-sm",
              isCurrent
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full border text-xs font-medium",
                isCurrent &&
                  "border-primary bg-primary text-primary-foreground",
                isDone && "border-emerald-500 bg-emerald-500 text-white",
              )}
            >
              {isDone ? <IconCheck className="size-3" /> : index + 1}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The bar pinned to the bottom of the page: a hint on the left, the actions
 * on the right. Stacks on a phone so the buttons keep their full width.
 */
export function StepFooter({
  message,
  children,
}: {
  message: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-auto flex flex-col gap-3 border-t bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="flex items-center justify-end gap-2">{children}</div>
    </div>
  );
}

/** A primary footer button that shows a spinner while its request runs. */
export function PrimaryAction({
  loading,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { loading?: boolean }) {
  return (
    <Button {...props} disabled={props.disabled || loading}>
      {loading && <Spinner data-icon="inline-start" />}
      {children}
    </Button>
  );
}

const SOURCE_CARDS: {
  value: AddableSource;
  title: string;
  description: string;
  tag?: string;
  icon: Icon;
  tone: string;
}[] = [
  {
    value: "url",
    title: "Website Pages",
    description:
      "Pages from your store, like shipping, refunds or contact us. We read the text on each page.",
    icon: IconGlobe,
    tone: "bg-blue-50 text-blue-600 dark:bg-blue-950/40",
  },
  {
    value: "file",
    title: "Documents",
    description:
      "PDF or Word files, like size guides, care instructions or policy documents.",
    tag: "PDF · Word",
    icon: IconFileText,
    tone: "bg-violet-50 text-violet-600 dark:bg-violet-950/40",
  },
  {
    value: "article",
    title: "Article",
    description:
      "Write a help article in the editor, with headings, lists and tables. Keep it as a draft until it's ready.",
    tag: "Draft Or Publish",
    icon: IconArticle,
    tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40",
  },
  {
    value: "faq",
    title: "Questions And Answers",
    description:
      "Write the answer to a question shoppers ask, in your own words. The quickest way to fix a wrong answer.",
    icon: IconMessageQuestion,
    tone: "bg-orange-50 text-orange-600 dark:bg-orange-950/40",
  },
];

/** Step 1: one card per kind of knowledge, picked like a radio button. */
export function SourceCards({
  value,
  onChange,
}: {
  value: AddableSource | null;
  onChange: (source: AddableSource) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="What to add"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {SOURCE_CARDS.map(
        ({ value: source, title, description, tag, icon: Icon, tone }) => {
          const selected = value === source;
          return (
            <button
              key={source}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(source)}
              className={cn(
                "flex flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/50",
                selected && "border-primary ring-1 ring-primary",
              )}
            >
              <span className="flex items-start justify-between">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    tone,
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full border",
                    selected && "border-primary bg-primary",
                  )}
                >
                  {selected && (
                    <span className="size-1.5 rounded-full bg-primary-foreground" />
                  )}
                </span>
              </span>
              <span className="font-semibold">{title}</span>
              <span className="text-xs text-muted-foreground">
                {description}
              </span>
              {tag && (
                <span className="mt-auto w-fit rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {tag}
                </span>
              )}
            </button>
          );
        },
      )}
    </div>
  );
}

/** The note that products and collections never need adding by hand. */
export function ShopifySyncedNote() {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
      <IconBolt className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="font-semibold">
          Your Shopify products and collections are already synced
        </p>
        <p className="text-xs text-muted-foreground">
          They update automatically when you change them in Shopify, so you
          don&apos;t need to add them here. Orders are read live.
        </p>
      </div>
    </div>
  );
}

/**
 * Step 2's layout: a card holding the source's own form, and the "who uses it
 * and where" panel beside it on a wide screen or under it on a narrow one.
 */
export function ContentLayout({
  title,
  icon: Icon,
  tone,
  onChangeSource,
  changeSourceDisabled = false,
  side,
  children,
}: {
  title: string;
  icon: Icon;
  tone: string;
  onChangeSource: () => void;
  /** Off while something is being saved. */
  changeSourceDisabled?: boolean;
  side: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <h2 className="flex items-center gap-2.5 font-semibold">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-md",
                tone,
              )}
            >
              <Icon className="size-4" />
            </span>
            {title}
          </h2>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0"
            disabled={changeSourceDisabled}
            onClick={onChangeSource}
          >
            Change Source
          </Button>
        </div>
        {children}
      </section>
      <div className="flex flex-col gap-4">{side}</div>
    </div>
  );
}

/** The tinted tip under the scope panel. */
export function TipCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
      <p className="font-semibold text-primary">{title}</p>
      <p className="mt-1 text-xs text-primary/80">{children}</p>
    </aside>
  );
}

export const SOURCE_META: Record<
  Exclude<AddableSource, "article">,
  { title: string; icon: Icon; tone: string }
> = {
  url: {
    title: "Website Pages",
    icon: IconGlobe,
    tone: "bg-blue-50 text-blue-600 dark:bg-blue-950/40",
  },
  file: {
    title: "Documents",
    icon: IconFileText,
    tone: "bg-violet-50 text-violet-600 dark:bg-violet-950/40",
  },
  faq: {
    title: "Questions And Answers",
    icon: IconMessageQuestion,
    tone: "bg-orange-50 text-orange-600 dark:bg-orange-950/40",
  },
};
