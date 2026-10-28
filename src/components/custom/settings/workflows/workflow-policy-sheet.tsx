"use client";

import { Fragment, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import {
  IconAlertTriangle,
  IconBan,
  IconCheck,
  IconChevronDown,
  IconDeviceFloppy,
  IconFileText,
  IconHelpCircle,
  IconHistory,
  IconListCheck,
  IconLock,
  IconPencil,
  IconPlus,
  IconRestore,
  IconUsers,
  IconX,
  type Icon,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { FieldError } from "@/components/custom/field-error";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { serverFieldErrors } from "@/lib/form-errors";
import { formatDateTime } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchWorkflowPolicy,
  RollbackWorkflowPolicy,
  SaveWorkflowPolicy,
  type PolicyAlwaysCheck,
  type PolicySummaryItem,
  type StoreWorkflow,
  type WorkflowPolicy,
} from "@/redux/api-slice/store-settings-slice";

// Tiptap touches the DOM, so the editor loads on the client only.
const RichTextArea = dynamic(
  () => import("@/components/custom/rich-text-area"),
  { ssr: false },
);

// Same limit the backend enforces on the policy text.
const POLICY_MAX_LENGTH = 4000;

/**
 * What a merchant can write about, per workflow code: the facts that
 * workflow's rules can use, and sentences that click into the box. A
 * workflow missing here gets the box alone.
 */
const POLICY_GUIDES: Record<string, { topics: string[]; examples: string[] }> =
  {
    order_cancellation: {
      topics: [
        "Time since the order was placed",
        "Order total",
        "Payment method (COD or prepaid)",
        "A discount code was used",
        "Number of items",
        "The customer's reason",
      ],
      examples: [
        "Orders can be cancelled within 12 hours of purchase.",
        "Cash on delivery orders can be cancelled anytime. Prepaid orders only within 2 hours.",
        "Orders above 5000 need my approval.",
      ],
    },
  };

/** The three outcomes, each with its heading and colour. */
const GROUPS: {
  key: "allowed" | "declined" | "team";
  title: string;
  tone: BadgeTone;
  icon: Icon;
}[] = [
  { key: "allowed", title: "Allowed if", tone: "success", icon: IconCheck },
  { key: "declined", title: "Declined if", tone: "danger", icon: IconBan },
  {
    key: "team",
    title: "Sent to your team if",
    tone: "info",
    icon: IconUsers,
  },
];

/** What a built-in check does to a request. */
const OUTCOMES: Record<
  PolicyAlwaysCheck["outcome"],
  { label: string; tone: BadgeTone }
> = {
  declined: { label: "Declined", tone: "danger" },
  team: { label: "Sent to your team", tone: "info" },
  ask: { label: "Customer is asked", tone: "neutral" },
};

/** First letter up, the rest as written: "any request" → "Any request". */
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

type Tab = "write" | "summary" | "history";

/** A yes/no question asked before a save, restore or discard. */
type Confirm = {
  title: string;
  description: string;
  label: string;
  run: () => void;
};

/**
 * One workflow's policy for the selected store, opened from its card on
 * Settings → Workflows. Three tabs: Write (the merchant's own words, with
 * ideas to start from), What the AI will do (the saved policy as readable
 * rules, plus anything to check), and History (earlier versions, each
 * restorable).
 *
 * Mounted only while open, so every open starts from a fresh fetch and an
 * untouched box.
 */
export function WorkflowPolicySheet({
  workflow,
  onClose,
}: {
  workflow: StoreWorkflow;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchWorkflowPolicyData, FetchWorkflowPolicyIsError } =
    useAppSelector(
      (state) => state.GetStoreSettingsReducer.FetchWorkflowPolicyState,
    );
  // The slot still holds the last opened workflow's policy until this
  // fetch starts; never show that one under this name.
  const policy =
    FetchWorkflowPolicyData?.workflow === workflow.code
      ? FetchWorkflowPolicyData
      : null;
  const saving = useAppSelector(
    (state) =>
      state.GetStoreSettingsReducer.SaveWorkflowPolicyState
        .SaveWorkflowPolicyIsLoading,
  );
  const restoringVersion = useAppSelector(
    (state) =>
      state.GetStoreSettingsReducer.RollbackWorkflowPolicyState
        .RollbackWorkflowPolicyPendingVersion,
  );

  // Null until the merchant types, so the box shows the saved text.
  const [draft, setDraft] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [tab, setTab] = useState<Tab>("write");

  const load = () => {
    if (storeCode)
      dispatch(FetchWorkflowPolicy({ storeCode, workflow: workflow.code }));
  };

  useEffect(() => {
    if (storeCode)
      dispatch(FetchWorkflowPolicy({ storeCode, workflow: workflow.code }));
  }, [dispatch, storeCode, workflow.code]);

  const savedText = policy?.text ?? "";
  const text = draft ?? savedText;
  // The backend trims what it saves, so compare trimmed.
  const isDirty = policy !== null && text.trim() !== savedText;
  const tooLong = text.length > POLICY_MAX_LENGTH;
  const busy = saving || restoringVersion !== null;
  const noteCount = policy
    ? policy.review.warnings.length +
      policy.review.ambiguities.length +
      policy.review.unsupported.length
    : 0;

  const save = async () => {
    if (!storeCode) return;
    setErrors({});
    try {
      const saved = await dispatch(
        SaveWorkflowPolicy({ storeCode, workflow: workflow.code, text }),
      ).unwrap();
      setDraft(null);
      // Show what the AI made of it, and anything to check, right away.
      setTab("summary");
      toast.success(
        saved.text
          ? `Policy saved as v${saved.policy_version}`
          : "Policy turned off",
      );
    } catch (rejected) {
      // Nothing was saved; say why under the box.
      setErrors(serverFieldErrors(rejected));
    }
  };

  const requestSave = () => {
    if (text.trim()) {
      save();
      return;
    }
    setConfirm({
      title: "Turn off your policy?",
      description:
        "With no policy, the AI sends these requests to your team. You can bring this version back later from the history.",
      label: "Turn off",
      run: save,
    });
  };

  const restore = async (version: number) => {
    if (!storeCode) return;
    try {
      const restored = await dispatch(
        RollbackWorkflowPolicy({ storeCode, workflow: workflow.code, version }),
      ).unwrap();
      setDraft(null);
      setErrors({});
      setTab("summary");
      toast.success(`v${version} restored as v${restored.policy_version}`);
    } catch {
      // The thunk already showed the error toast.
    }
  };

  const requestClose = () => {
    // A save in flight takes seconds; closing would lose its errors.
    if (busy) return;
    if (isDirty) {
      setConfirm({
        title: "Discard your changes?",
        description: "Your edits to this policy haven't been saved.",
        label: "Discard",
        run: onClose,
      });
      return;
    }
    onClose();
  };

  return (
    <>
      <Sheet
        open
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        {/* Full width on phones, 3/4 on tablets, 40% of the screen from laptops up. */}
        <SheetContent className="gap-0 data-[side=right]:w-full sm:max-w-2xl sm:data-[side=right]:w-3/4 lg:data-[side=right]:w-[40vw] lg:data-[side=right]:max-w-none">
          <SheetHeader className="border-b">
            <div className="mr-8 flex items-center gap-2">
              <SheetTitle>{workflow.name} policy</SheetTitle>
              {policy && policy.policy_version > 0 && (
                <Badge variant="secondary">v{policy.policy_version}</Badge>
              )}
            </div>
            <SheetDescription>
              Tell the AI how to handle these requests, in your own words. It
              applies to this store only.
            </SheetDescription>
          </SheetHeader>

          {!policy && !FetchWorkflowPolicyIsError && (
            <div className="flex flex-col gap-4 p-4">
              <Skeleton className="h-9 w-72 max-w-full rounded-lg" />
              <Skeleton className="h-40 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
          )}

          {!policy && FetchWorkflowPolicyIsError && (
            <Empty className="w-full">
              <EmptyHeader>
                <EmptyMedia>
                  <IconFileText />
                </EmptyMedia>
                <EmptyTitle>Couldn&apos;t load this policy</EmptyTitle>
                <EmptyDescription>
                  Check your connection and try again.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" size="sm" onClick={load}>
                  Try again
                </Button>
              </EmptyContent>
            </Empty>
          )}

          {policy && (
            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as Tab)}
              className="flex min-h-0 flex-1 flex-col gap-0"
            >
              <div className="border-b px-4">
                <TabsList variant="line">
                  <TabsTrigger value="write">
                    <IconPencil className="max-sm:hidden" />
                    Write
                  </TabsTrigger>
                  <TabsTrigger value="summary">
                    <IconListCheck className="max-sm:hidden" />
                    What the AI will do
                    {noteCount > 0 && (
                      <Badge
                        variant="outline"
                        className={cn("h-4 px-1.5", BADGE_TONE_STYLES.warning)}
                        aria-label={`${noteCount} to check`}
                      >
                        {noteCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <IconHistory className="max-sm:hidden" />
                    History
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
                <TabsContent value="write" className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="workflow-policy-text">Your policy</Label>
                    {/* Saved as Markdown, the same as the widget's greeting. */}
                    <RichTextArea
                      id="workflow-policy-text"
                      value={text}
                      onChange={setDraft}
                      useMarkdown
                      disabled={busy}
                      placeholder="e.g. Orders can be cancelled within 12 hours. Orders above 5000 need my approval."
                      minHeight="10rem"
                      maxHeight="20rem"
                    />
                    <FieldError errors={errors} name="text" />
                    <FieldError errors={errors} name="workflow" />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Over the limit reads as an error before the server says so. */}
                      <Typography
                        variant="caption"
                        className={cn(tooLong && !saving && "text-destructive")}
                      >
                        {saving
                          ? "This can take up to 15 seconds."
                          : `${text.length} / ${POLICY_MAX_LENGTH}`}
                      </Typography>
                      <Button
                        size="sm"
                        onClick={requestSave}
                        // Only a changed text makes a new version.
                        disabled={busy || tooLong || !isDirty}
                      >
                        {saving ? (
                          <>
                            <Spinner data-icon="inline-start" />
                            Converting your policy…
                          </>
                        ) : (
                          <>
                            <IconDeviceFloppy data-icon="inline-start" />
                            Save policy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <WritingGuide
                    workflowCode={workflow.code}
                    text={text}
                    disabled={busy}
                    onAdd={(example) =>
                      // A blank line starts a new paragraph in Markdown.
                      setDraft(
                        text.trim()
                          ? `${text.trimEnd()}\n\n${example}`
                          : example,
                      )
                    }
                  />
                </TabsContent>

                <TabsContent value="summary" className="flex flex-col gap-6">
                  <ReviewNotes review={policy.review} />
                  <Summary
                    summary={policy.summary}
                    onWrite={() => setTab("write")}
                  />
                </TabsContent>

                <TabsContent value="history">
                  <History
                    policy={policy}
                    restoringVersion={restoringVersion}
                    disabled={busy}
                    onRestore={(version) =>
                      setConfirm({
                        title: `Restore v${version}?`,
                        description: `v${version} is saved again as a new version, and the AI starts following it right away.`,
                        label: "Restore",
                        run: () => restore(version),
                      })
                    }
                  />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirm?.run();
                setConfirm(null);
              }}
            >
              {confirm?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SectionTitle({
  title,
  hint,
}: {
  title: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <Typography variant="small" as="h3">
        {title}
      </Typography>
      {hint && (
        <Typography variant="caption" as="p">
          {hint}
        </Typography>
      )}
    </div>
  );
}

/** What the merchant can write about, and sentences to start from. */
function WritingGuide({
  workflowCode,
  text,
  disabled,
  onAdd,
}: {
  workflowCode: string;
  text: string;
  disabled: boolean;
  onAdd: (example: string) => void;
}) {
  const guide = POLICY_GUIDES[workflowCode];
  if (!guide) return null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex flex-col gap-2">
        <Typography variant="small" as="p">
          You can mention
        </Typography>
        <div className="flex flex-wrap gap-1.5">
          {guide.topics.map((topic) => (
            <Badge key={topic} variant="outline" className="bg-background">
              {topic}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Typography variant="small" as="p">
          Examples
          <Typography variant="caption" className="ml-1.5 font-normal">
            Click to add
          </Typography>
        </Typography>
        <div className="flex flex-col gap-1.5">
          {guide.examples.map((example) => (
            <button
              key={example}
              type="button"
              disabled={
                disabled ||
                text.includes(example) ||
                text.length + example.length + 2 > POLICY_MAX_LENGTH
              }
              onClick={() => onAdd(example)}
              className="flex items-start gap-2 rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            >
              <IconPlus className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 break-words">{example}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** One outcome's checks: "Allowed if" and a bullet per check. */
function CheckGroup({
  title,
  tone,
  icon: GroupIcon,
  items,
}: {
  title: string;
  tone: BadgeTone;
  icon: Icon;
  items: PolicySummaryItem[];
}) {
  if (!items.length) return null;
  return (
    <section className="flex flex-col gap-2">
      <Badge variant="outline" className={cn("w-fit", BADGE_TONE_STYLES[tone])}>
        <GroupIcon data-icon="inline-start" />
        {title}
      </Badge>
      <ul className="flex flex-col gap-2 pl-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <span
              aria-hidden
              className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/60"
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="break-words">{sentence(item.check)}</p>
              {item.told && (
                <p className="text-xs break-words text-muted-foreground">
                  Customer is told: &ldquo;{item.told}&rdquo;
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The built-in checks every store gets, folded into one quiet row. */
function AlwaysChecks({ checks }: { checks: PolicyAlwaysCheck[] }) {
  if (!checks.length) return null;
  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-left text-sm text-muted-foreground transition-colors outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <IconLock className="size-4 shrink-0" />
        <span className="min-w-0 flex-1">
          Always checked first ({checks.length})
        </span>
        <IconChevronDown className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-2 px-3 pt-3 pb-1">
          <Typography variant="caption" as="p">
            Every store gets these, before your own policy.
          </Typography>
          <ul className="flex flex-col gap-2">
            {checks.map((check, index) => {
              const outcome = OUTCOMES[check.outcome] ?? OUTCOMES.declined;
              return (
                <li
                  key={index}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
                >
                  <Badge
                    variant="outline"
                    className={BADGE_TONE_STYLES[outcome.tone]}
                  >
                    {outcome.label}
                  </Badge>
                  <span className="min-w-0 break-words">{check.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** "What the AI will do": the saved policy in plain English. */
function Summary({
  summary,
  onWrite,
}: {
  summary: WorkflowPolicy["summary"];
  onWrite: () => void;
}) {
  const how = summary?.how ?? [];
  const always = summary?.always ?? [];
  const hasPolicy = GROUPS.some(({ key }) => (summary?.[key] ?? []).length);

  if (!hasPolicy)
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-4">
          <Typography variant="muted">
            No policy saved yet. Until you save one, these requests go to your
            team.
          </Typography>
          <Button variant="outline" size="sm" onClick={onWrite}>
            <IconPencil data-icon="inline-start" />
            Write your policy
          </Button>
        </div>
        <AlwaysChecks checks={always} />
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      {GROUPS.map((group) => (
        <CheckGroup
          key={group.key}
          title={group.title}
          tone={group.tone}
          icon={group.icon}
          items={summary?.[group.key] ?? []}
        />
      ))}

      {how.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionTitle title="How it's done" />
          <div className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
            {how.map((line, index) => (
              <p key={index} className="break-words">
                {line}
              </p>
            ))}
          </div>
        </section>
      )}

      <AlwaysChecks checks={always} />
    </div>
  );
}

/** What the merchant should check about the saved version. */
function ReviewNotes({ review }: { review: WorkflowPolicy["review"] }) {
  const { warnings, ambiguities, unsupported } = review;
  if (!warnings.length && !ambiguities.length && !unsupported.length)
    return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
      <p className="flex items-center gap-2 font-medium">
        <IconAlertTriangle className="size-4 shrink-0" />
        Please check these
      </p>
      <ul className="flex flex-col gap-3">
        {warnings.map((warning, index) => (
          <li key={`warning-${index}`} className="flex items-start gap-2">
            <IconAlertTriangle className="mt-0.5 size-4 shrink-0 opacity-70" />
            <p className="min-w-0 break-words">{warning}</p>
          </li>
        ))}
        {ambiguities.map((ambiguity, index) => (
          <li key={`ambiguity-${index}`} className="flex items-start gap-2">
            <IconHelpCircle className="mt-0.5 size-4 shrink-0 opacity-70" />
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="break-words">{ambiguity.question}</p>
              {ambiguity.options.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ambiguity.options.map((option, optionIndex) => (
                    <Badge
                      key={optionIndex}
                      variant="outline"
                      className={cn(
                        "h-auto font-normal whitespace-normal",
                        option === ambiguity.assumed
                          ? "border-amber-500/60 bg-amber-100 font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                          : "border-amber-300/60 text-amber-800 dark:border-amber-900/60 dark:text-amber-300",
                      )}
                    >
                      {option === ambiguity.assumed && (
                        <IconCheck data-icon="inline-start" />
                      )}
                      {option}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-amber-800 dark:text-amber-300">
                We went with &ldquo;{ambiguity.assumed}&rdquo;. Reword your
                policy to change it.
              </p>
              {ambiguity.source_text && (
                <p className="text-xs break-words text-amber-800 italic dark:text-amber-300">
                  You wrote: &ldquo;{ambiguity.source_text}&rdquo;
                </p>
              )}
            </div>
          </li>
        ))}
        {unsupported.map((item, index) => (
          <li key={`unsupported-${index}`} className="flex items-start gap-2">
            <IconX className="mt-0.5 size-4 shrink-0 opacity-70" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="break-words">
                The AI won&apos;t act on &ldquo;{item.source_text}&rdquo;
              </p>
              <p className="text-xs break-words text-amber-800 dark:text-amber-300">
                {item.why}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A version's policy as the merchant wrote it (Markdown), folded when long. */
function PolicyText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (!text)
    return <p className="text-sm text-muted-foreground">Policy turned off</p>;
  // Roughly more than three short lines: fold it behind "Show more".
  const long = text.length > 180 || text.split("\n").length > 3;
  return (
    <div className="flex flex-col items-start gap-1">
      <div
        className={cn(
          "rich-text-render text-sm break-words text-muted-foreground",
          long &&
            !open &&
            "max-h-16 overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]",
        )}
      >
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
      {long && (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  );
}

/** Published versions, newest first, as a timeline; each one restorable. */
function History({
  policy,
  restoringVersion,
  disabled,
  onRestore,
}: {
  policy: WorkflowPolicy;
  restoringVersion: number | null;
  disabled: boolean;
  onRestore: (version: number) => void;
}) {
  if (!policy.history.length)
    return <Typography variant="muted">No versions saved yet.</Typography>;

  return (
    <ol className="flex flex-col">
      {policy.history.map((entry, index) => {
        const current = entry.version === policy.policy_version;
        const last = index === policy.history.length - 1;
        return (
          <li key={entry.version} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-1 size-2.5 shrink-0 rounded-full border-2",
                  current
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40 bg-background",
                )}
              />
              {!last && <span className="mt-1 w-px flex-1 bg-border" />}
            </div>
            <div
              className={cn(
                "flex min-w-0 flex-1 items-start justify-between gap-3",
                !last && "pb-5",
              )}
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-medium">
                    Version {entry.version}
                  </span>
                  {current && (
                    <Badge
                      variant="outline"
                      className={BADGE_TONE_STYLES.accent}
                    >
                      Current
                    </Badge>
                  )}
                </div>
                <Typography variant="caption" as="p">
                  {formatDateTime(entry.published_at)} · {entry.published_by}
                  {entry.rolled_back_from != null &&
                    ` · Restored from v${entry.rolled_back_from}`}
                </Typography>
                <PolicyText text={entry.text} />
              </div>
              {!current && (
                <Button
                  variant="outline"
                  size="xs"
                  disabled={disabled}
                  onClick={() => onRestore(entry.version)}
                >
                  {restoringVersion === entry.version ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <IconRestore data-icon="inline-start" />
                  )}
                  Restore
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
