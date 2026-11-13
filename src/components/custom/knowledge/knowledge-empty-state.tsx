import Link from "next/link";
import {
  IconChevronRight,
  IconFileText,
  IconLink,
  IconMessageQuestion,
  type Icon,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";

// `shortDescription` is the wording on a phone, where there is less room.
const STEPS = [
  {
    title: "Add what you know",
    description: "Upload files, add pages or write answers.",
    shortDescription: "Files, pages or answers.",
  },
  {
    title: "Choose who uses it",
    description: "Sales, Support, or both. Defaults are set.",
    shortDescription: "Defaults are set for you.",
  },
  {
    title: "Test it",
    description: "Ask a question and see where the answer came from.",
    shortDescription: "See where each answer came from.",
  },
];

const OPTIONS: {
  source: "file" | "url" | "faq";
  icon: Icon;
  iconClassName: string;
  title: string;
  description: string;
  shortDescription: string;
  note: string;
  action: string;
}[] = [
  {
    source: "file",
    icon: IconFileText,
    iconClassName: "bg-violet-100 text-violet-700",
    title: "Upload documents",
    description: "Policies, catalogues, size charts or price lists.",
    shortDescription: "Policies, catalogues, size charts or price lists.",
    note: "PDF, Word, Excel, CSV, PowerPoint, images",
    action: "Upload files",
  },
  {
    source: "url",
    icon: IconLink,
    iconClassName: "bg-blue-100 text-blue-700",
    title: "Add website pages",
    description:
      "Paste links to pages on your store, like Shipping or Contact us.",
    shortDescription: "Paste links to pages on your store.",
    note: "We read the text on each page",
    action: "Add links",
  },
  {
    source: "faq",
    icon: IconMessageQuestion,
    iconClassName: "bg-orange-100 text-orange-700",
    title: "Write questions & answers",
    description: "Short answers to things customers ask all the time.",
    shortDescription: "Short answers to things customers ask all the time.",
    note: "e.g. Do you ship to Dubai?",
    action: "Write Q&A",
  },
];

/** What a store with no knowledge yet sees: three ways to add some, and what comes next. */
export function KnowledgeEmptyState() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 text-left sm:items-center sm:py-8 sm:text-center">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">
          Teach your AI about your store
        </h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground sm:hidden">
          Your AI already knows your products, prices and orders from Shopify.
          Add your policies and the answers you give customers every day.
        </p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground max-sm:hidden">
          Your AI already knows your products, prices, stock and orders from
          Shopify. Add the rest here: your policies and the answers you give
          customers every day.
        </p>
      </div>

      <ol className="grid w-full gap-1 rounded-xl border bg-card p-1 text-left sm:grid-cols-3 sm:gap-0 sm:divide-x sm:p-0">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="flex items-start gap-2 p-3 max-sm:gap-3"
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                index === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold">
                {step.title}
                <span className="sm:hidden">.</span>
              </span>
              <span className="text-xs text-muted-foreground sm:hidden">
                {step.shortDescription}
              </span>
              <span className="text-xs text-muted-foreground max-sm:hidden">
                {step.description}
              </span>
            </div>
          </li>
        ))}
      </ol>

      <div className="grid w-full gap-3 text-left sm:grid-cols-3 sm:gap-4">
        {OPTIONS.map(
          ({
            source,
            icon: OptionIcon,
            iconClassName,
            title,
            description,
            shortDescription,
            note,
            action,
          }) => (
            <Link
              key={source}
              href={`/knowledge/new?source=${source}`}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30 sm:flex-col sm:items-stretch"
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  iconClassName,
                )}
              >
                <OptionIcon className="size-5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-none">
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground sm:hidden">
                  {shortDescription}
                </p>
                <p className="text-xs text-muted-foreground max-sm:hidden">
                  {description}
                </p>
                <p className="text-xs text-muted-foreground/70 max-sm:hidden">
                  {note}
                </p>
              </div>
              <IconChevronRight className="size-4 shrink-0 text-muted-foreground sm:hidden" />
              <span className="mt-auto text-xs font-medium text-primary max-sm:hidden">
                {action} →
              </span>
            </Link>
          ),
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Not sure where to start? Add your shipping, returns and payment policies
        first. They answer most customer questions.
      </p>
    </div>
  );
}
