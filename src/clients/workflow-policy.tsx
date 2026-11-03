"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBulb,
  IconCircleX,
  IconDeviceFloppy,
  IconFileText,
  IconGitBranch,
  IconHelpCircle,
  IconHistory,
  IconInfoCircle,
  IconLock,
  IconPlus,
  IconRestore,
  IconSparkles,
  IconTrash,
  IconX,
  type Icon,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { FieldError } from "@/components/custom/field-error";
import { LoadingState } from "@/components/custom/loading-state";
import { PageHeading } from "@/components/custom/page-heading";
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { serverFieldErrors } from "@/lib/form-errors";
import { formatDateTime } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  DeleteWorkflowPolicyVersion,
  FetchWorkflowPolicy,
  RollbackWorkflowPolicy,
  SaveWorkflowPolicy,
  type PolicyFinding,
  type PolicyIdea,
  type WorkflowPolicy as Policy,
} from "@/redux/api-slice/store-settings-slice";

// Tiptap touches the DOM, so the editor loads on the client only.
const RichTextArea = dynamic(
  () => import("@/components/custom/rich-text-area"),
  { ssr: false },
);

// React Flow measures the page, so the flowchart loads on the client only.
const WorkflowPolicyFlow = dynamic(
  () => import("@/components/custom/settings/workflows/workflow-policy-flow"),
  {
    ssr: false,
    loading: () => (
      <LoadingState
        label="Loading flowchart…"
        className="h-[560px] rounded-xl border sm:h-[640px]"
      />
    ),
  },
);

const BACK_HREF = "/settings/workflows";

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

/** How each finding looks, by how serious it is. */
const SEVERITY: Record<
  PolicyFinding["severity"],
  { tone: BadgeTone; icon: Icon }
> = {
  error: { tone: "danger", icon: IconCircleX },
  warning: { tone: "warning", icon: IconAlertTriangle },
  info: { tone: "info", icon: IconInfoCircle },
};

/** What the other sentences of a finding are to it. */
const OTHERS_LABEL: Record<PolicyFinding["kind"], string> = {
  impossible: "",
  overridden: "Always decided first by",
  conflict: "Wins over it",
  redundant: "Already covered by",
  gap: "",
};

type Tab = "flow" | "suggestions" | "history";

/** A yes/no question asked before a save, restore, delete or leaving. */
type Confirm = {
  title: string;
  description: string;
  label: string;
  run: () => void;
  /** Can't be undone: the button is red. */
  destructive?: boolean;
};

/**
 * One workflow's policy for the selected store, opened from its row on
 * Settings → Workflows. The merchant writes on the left; on the right,
 * three tabs: How the AI decides (the saved policy as a flowchart),
 * Suggestions (what code found and the AI's ideas) and History (earlier
 * versions, each restorable or deletable).
 */
export default function WorkflowPolicy({ code }: { code: string }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchWorkflowPolicyData, FetchWorkflowPolicyIsError } =
    useAppSelector(
      (state) => state.GetStoreSettingsReducer.FetchWorkflowPolicyState,
    );
  // The slot may still hold another workflow's policy; never show that one.
  const policy =
    FetchWorkflowPolicyData?.workflow === code ? FetchWorkflowPolicyData : null;
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
  const deletingVersion = useAppSelector(
    (state) =>
      state.GetStoreSettingsReducer.DeleteWorkflowPolicyVersionState
        .DeleteWorkflowPolicyVersionPendingVersion,
  );

  // Null until the merchant types, so the box shows the saved text.
  const [draft, setDraft] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [tab, setTab] = useState<Tab>("flow");

  const load = () => {
    if (storeCode) dispatch(FetchWorkflowPolicy({ storeCode, workflow: code }));
  };

  useEffect(() => {
    if (storeCode) dispatch(FetchWorkflowPolicy({ storeCode, workflow: code }));
  }, [dispatch, storeCode, code]);

  const savedText = policy?.text ?? "";
  const text = draft ?? savedText;
  // The backend trims what it saves, so compare trimmed.
  const isDirty = policy !== null && text.trim() !== savedText;
  const tooLong = text.length > POLICY_MAX_LENGTH;
  const busy = saving || restoringVersion !== null || deletingVersion !== null;

  // Closing the tab with unsaved edits asks the browser to confirm.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  // Adds a sentence as its own paragraph (a blank line in Markdown).
  const addSentence = (line: string) =>
    setDraft(text.trim() ? `${text.trimEnd()}\n\n${line}` : line);

  const save = async () => {
    if (!storeCode) return;
    setErrors({});
    try {
      const saved = await dispatch(
        SaveWorkflowPolicy({ storeCode, workflow: code, text }),
      ).unwrap();
      setDraft(null);
      // Show anything to check first, else what the AI made of it.
      setTab(noteCount(saved) ? "suggestions" : "flow");
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
      await dispatch(
        RollbackWorkflowPolicy({ storeCode, workflow: code, version }),
      ).unwrap();
      setDraft(null);
      setErrors({});
      setTab("flow");
      toast.success(`v${version} is live again`);
    } catch {
      // The thunk already showed the error toast.
    }
  };

  const remove = async (version: number) => {
    if (!storeCode) return;
    try {
      await dispatch(
        DeleteWorkflowPolicyVersion({ storeCode, workflow: code, version }),
      ).unwrap();
      toast.success(`v${version} deleted`);
    } catch {
      // The thunk already showed the error toast.
    }
  };

  const requestBack = () => {
    if (!isDirty) {
      router.push(BACK_HREF);
      return;
    }
    setConfirm({
      title: "Discard your changes?",
      description: "Your edits to this policy haven't been saved.",
      label: "Discard",
      run: () => router.push(BACK_HREF),
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to workflows"
          onClick={requestBack}
        >
          <IconArrowLeft />
        </Button>
        <PageHeading
          className="min-w-0 flex-1"
          title={policy ? `${policy.name} policy` : "Workflow policy"}
          description="Tell the AI how to handle these requests, in your own words. It applies to this store only."
          action={
            policy &&
            policy.policy_version > 0 && (
              <Badge variant="secondary">
                v{policy.policy_version}
                {policy.policy_published_at &&
                  ` · saved ${formatDateTime(policy.policy_published_at)}`}
                {policy.policy_published_by &&
                  ` by ${policy.policy_published_by}`}
              </Badge>
            )
          }
        />
      </div>

      {!policy && !FetchWorkflowPolicyIsError && (
        <LoadingState label="Loading policy…" />
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
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <section className="flex flex-col gap-5">
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
                minHeight="14rem"
                maxHeight="32rem"
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
                    ? "This can take up to 20 seconds."
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
              workflowCode={code}
              text={text}
              disabled={busy}
              onAdd={addSentence}
            />
          </section>

          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as Tab)}
            className="flex min-w-0 flex-col gap-4"
          >
            <TabsList variant="line">
              <TabsTrigger value="flow">
                <IconGitBranch className="max-sm:hidden" />
                How the AI decides
              </TabsTrigger>
              <TabsTrigger value="suggestions">
                <IconBulb className="max-sm:hidden" />
                Suggestions
                {noteCount(policy) > 0 && (
                  <Badge
                    variant="outline"
                    className={cn("h-4 px-1.5", BADGE_TONE_STYLES.warning)}
                    aria-label={`${noteCount(policy)} to check`}
                  >
                    {noteCount(policy)}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">
                <IconHistory className="max-sm:hidden" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="flow" className="flex flex-col gap-3">
              <FlowNotes
                policy={policy}
                onSuggestions={() => setTab("suggestions")}
              />
              {/* A new version gets a fresh chart, laid out again. */}
              <WorkflowPolicyFlow
                key={policy.policy_version}
                flow={policy.flow}
              />
            </TabsContent>

            <TabsContent value="suggestions">
              <Suggestions
                policy={policy}
                text={text}
                disabled={busy}
                onAdd={(idea) => {
                  addSentence(idea.sentence);
                  toast.success("Added to your policy", {
                    description: "Save it to start using it.",
                  });
                }}
              />
            </TabsContent>

            <TabsContent value="history">
              <History
                policy={policy}
                restoringVersion={restoringVersion}
                deletingVersion={deletingVersion}
                disabled={busy}
                onRestore={(version) =>
                  setConfirm({
                    title: `Restore v${version}?`,
                    description: `v${version} becomes the policy in use and the AI follows it right away. Newer versions stay in the history.`,
                    label: "Restore",
                    run: () => restore(version),
                  })
                }
                onDelete={(version) =>
                  setConfirm({
                    title: `Delete v${version}?`,
                    description: `v${version} is removed from the history for good and can't be restored. The policy in use doesn't change.`,
                    label: "Delete",
                    run: () => remove(version),
                    destructive: true,
                  })
                }
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

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
              className={cn(
                confirm?.destructive &&
                  buttonVariants({ variant: "destructive" }),
              )}
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
    </div>
  );
}

/** How many things the merchant should look at in the saved version. */
function noteCount(policy: Policy) {
  const { warnings, ambiguities, unsupported } = policy.review;
  return (
    warnings.length +
    ambiguities.length +
    unsupported.length +
    policy.suggestions.findings.length
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
            <AddButton
              key={example}
              text={example}
              disabled={
                disabled ||
                text.includes(example) ||
                text.length + example.length + 2 > POLICY_MAX_LENGTH
              }
              onClick={() => onAdd(example)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** A sentence that clicks into the policy box. */
function AddButton({
  text,
  hint,
  disabled,
  onClick,
}: {
  text: string;
  hint?: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-start gap-2 rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
    >
      <IconPlus className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="break-words">{text}</span>
        {hint && (
          <span className="text-xs break-words text-muted-foreground">
            {hint}
          </span>
        )}
      </span>
    </button>
  );
}

/** What to know before reading the chart: no policy yet, or a hold. */
function FlowNotes({
  policy,
  onSuggestions,
}: {
  policy: Policy;
  onSuggestions: () => void;
}) {
  if (!policy.text)
    return (
      <Typography variant="muted">
        No policy saved yet. Until you save one, only the built-in checks (
        <IconLock className="inline size-3.5" />) run and everything else goes
        to your team.
      </Typography>
    );
  if (!policy.flow.held.length) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
      <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 break-words">
        {policy.flow.action} never happens on its own yet: some of your
        sentences can&apos;t be checked, so requests your policy would allow go
        to your team.{" "}
        <button
          type="button"
          className="font-medium underline underline-offset-2"
          onClick={onSuggestions}
        >
          See which sentences
        </button>
      </p>
    </div>
  );
}

/** Why requests go to the team while a sentence can't be used. */
function HeldNote() {
  return (
    <span className="font-medium">
      {" "}
      Until you reword or remove it, requests your policy would allow go to your
      team.
    </span>
  );
}

/**
 * Suggestions for the saved version: sentences the AI can't use, what code
 * found about how the sentences work together (with the AI's read on each
 * overlap), and sentences the AI suggests adding.
 */
function Suggestions({
  policy,
  text,
  disabled,
  onAdd,
}: {
  policy: Policy;
  text: string;
  disabled: boolean;
  onAdd: (idea: PolicyIdea) => void;
}) {
  const { findings, ideas } = policy.suggestions;
  const { warnings, ambiguities, unsupported } = policy.review;
  const hasNotes = warnings.length + ambiguities.length + unsupported.length;

  if (!hasNotes && !findings.length && !ideas.length)
    return (
      <Typography variant="muted">
        {policy.text
          ? "Nothing to improve: your sentences work together as written."
          : "Save a policy to get suggestions."}
      </Typography>
    );

  return (
    <div className="flex flex-col gap-6">
      {hasNotes > 0 && <ReviewNotes review={policy.review} />}

      {findings.length > 0 && (
        <section className="flex flex-col gap-2">
          <Typography variant="small" as="h3">
            How your sentences work together
          </Typography>
          <ul className="flex flex-col gap-2">
            {findings.map((finding) => (
              <FindingItem key={finding.key} finding={finding} />
            ))}
          </ul>
        </section>
      )}

      {ideas.length > 0 && (
        <section className="flex flex-col gap-2">
          <Typography
            variant="small"
            as="h3"
            className="flex items-center gap-1.5"
          >
            <IconSparkles className="size-4 text-primary" />
            Ideas to add
            <Typography variant="caption" className="font-normal">
              Suggested by AI. Click to add, then save.
            </Typography>
          </Typography>
          <div className="flex flex-col gap-1.5">
            {ideas.map((idea) => (
              <AddButton
                key={idea.sentence}
                text={idea.sentence}
                hint={idea.why}
                disabled={
                  disabled ||
                  text.includes(idea.sentence) ||
                  text.length + idea.sentence.length + 2 > POLICY_MAX_LENGTH
                }
                onClick={() => onAdd(idea)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** One thing code found, the sentences it is about, and the AI's read. */
function FindingItem({ finding }: { finding: PolicyFinding }) {
  const { tone, icon: SeverityIcon } = SEVERITY[finding.severity];
  return (
    <li className="flex items-start gap-2.5 rounded-lg border p-3 text-sm">
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border",
          BADGE_TONE_STYLES[tone],
        )}
      >
        <SeverityIcon className="size-3.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="break-words">{finding.text}</p>
        {finding.sentence && (
          <p className="text-xs break-words text-muted-foreground italic">
            You wrote: &ldquo;{finding.sentence}&rdquo;
          </p>
        )}
        {finding.others.length > 0 && (
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            <span>{OTHERS_LABEL[finding.kind]}:</span>
            {finding.others.map((other) => (
              <span
                key={other.text}
                className="flex items-start gap-1 break-words"
              >
                {other.platform && (
                  <IconLock
                    className="mt-0.5 size-3 shrink-0"
                    aria-label="Built-in check"
                  />
                )}
                &ldquo;{other.text}&rdquo;
              </span>
            ))}
          </div>
        )}
        {finding.note && (
          <div className="flex flex-wrap items-start gap-1.5 text-xs">
            <Badge
              variant="outline"
              className={
                finding.note.verdict === "contradiction"
                  ? BADGE_TONE_STYLES.danger
                  : BADGE_TONE_STYLES.success
              }
            >
              {finding.note.verdict === "contradiction"
                ? "Looks like a contradiction"
                : "Looks intended"}
            </Badge>
            <span className="min-w-0 break-words text-muted-foreground">
              {finding.note.text}
            </span>
          </div>
        )}
      </div>
    </li>
  );
}

/** Sentences the AI can't use as written. */
function ReviewNotes({ review }: { review: Policy["review"] }) {
  const { warnings, ambiguities, unsupported } = review;
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
                      className="h-auto border-amber-300/60 font-normal whitespace-normal text-amber-800 dark:border-amber-900/60 dark:text-amber-300"
                    >
                      {option}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-amber-800 dark:text-amber-300">
                This sentence isn&apos;t used yet. Reword it to say exactly
                which one you mean.
                {ambiguity.limits && <HeldNote />}
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
                {item.limits && <HeldNote />}
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

/**
 * Published versions, newest first, as a timeline. Any but the one in use
 * can be restored or deleted.
 */
function History({
  policy,
  restoringVersion,
  deletingVersion,
  disabled,
  onRestore,
  onDelete,
}: {
  policy: Policy;
  restoringVersion: number | null;
  deletingVersion: number | null;
  disabled: boolean;
  onRestore: (version: number) => void;
  onDelete: (version: number) => void;
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
                </Typography>
                {entry.rollbacks.length > 0 && (
                  <ol className="flex flex-col gap-0.5">
                    {entry.rollbacks.map((rollback) => (
                      <li key={rollback.order}>
                        <Typography variant="caption" as="p">
                          <IconRestore className="mr-1 inline size-3" />
                          Restored #{rollback.order} over v
                          {rollback.from_version} ·{" "}
                          {formatDateTime(rollback.rolled_back_at)} ·{" "}
                          {rollback.rolled_back_by}
                        </Typography>
                      </li>
                    ))}
                  </ol>
                )}
                <PolicyText text={entry.text} />
              </div>
              {!current && (
                <div className="flex shrink-0 items-center gap-1.5">
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
                  <Button
                    variant="outline"
                    size="icon-xs"
                    className="text-destructive hover:text-destructive"
                    disabled={disabled}
                    onClick={() => onDelete(entry.version)}
                    aria-label={`Delete version ${entry.version}`}
                  >
                    {deletingVersion === entry.version ? (
                      <Spinner />
                    ) : (
                      <IconTrash />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
