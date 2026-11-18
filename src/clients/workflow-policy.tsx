"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconBulb,
  IconCheck,
  IconCircle,
  IconCircleCheck,
  IconEye,
  IconFileText,
  IconLock,
  IconRefresh,
  IconRestore,
  IconTrash,
  IconWand,
  type Icon,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { ConfirmSwitch, type SwitchChange } from "@/clients/settings-workflows";
import { FieldError } from "@/components/custom/field-error";
import { LoadingState } from "@/components/custom/loading-state";
import type { TextMark } from "@/components/custom/rich-text-area";
import { useInfiniteScroll } from "@/components/custom/social-ai/use-infinite-scroll";
import WorkflowPolicyFlow, {
  OUTCOMES,
} from "@/components/custom/settings/workflows/workflow-policy-flow";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { serverFieldErrors } from "@/lib/form-errors";
import { formatDateTime } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  CheckWorkflowPolicy,
  DeleteWorkflowPolicyVersion,
  DismissPolicySuggestion,
  FetchPolicyVersions,
  FetchStoreWorkflows,
  FetchWorkflowActivity,
  FetchWorkflowPolicy,
  RollbackWorkflowPolicy,
  SaveWorkflowPolicy,
  UpdateStoreWorkflow,
  type PagedList,
  type PolicyActivity,
  type PolicyHistoryEntry,
  type PolicySuggestion,
  type PolicySuggestionFix,
  type PolicySuggestionKind,
  type StoreWorkflow,
  type WorkflowPolicy as Policy,
} from "@/redux/api-slice/store-settings-slice";

// Tiptap touches the DOM, so the editor loads on the client only.
const RichTextArea = dynamic(
  () => import("@/components/custom/rich-text-area"),
  { ssr: false },
);

const BACK_HREF = "/settings/workflows";

// Same limit the backend enforces on the policy text.
const POLICY_MAX_LENGTH = 3000;

/**
 * Under the policy box: how the AI reads what the merchant writes. Rules
 * have no order; the engine settles overlaps by effect (decline, then the
 * team, then allow).
 */
const WRITING_TIPS = [
  "One rule per line. Say what the AI should do: allow, decline, or send to your team.",
  "Define words like “high value” with a number.",
  "When two rules overlap, the stricter one wins: decline, then your team, then allow.",
];

// The tabs as line tabs with the brand underline.
const TAB_CLASS = "flex-none px-3 after:bg-primary";
// A count beside a tab's name.
const TAB_COUNT_CLASS = "min-w-5 rounded-full px-1.5 tabular-nums";

/** How each kind of suggestion looks. */
const SUGGESTION_KINDS: Record<
  PolicySuggestionKind,
  { label: string; tone: BadgeTone; icon: Icon }
> = {
  contradiction: {
    label: "Contradiction",
    tone: "danger",
    icon: IconAlertTriangle,
  },
  never_applies: {
    label: "Never applies",
    tone: "danger",
    icon: IconAlertTriangle,
  },
  unclear: { label: "Unclear", tone: "warning", icon: IconAlertCircle },
  missing: {
    label: "Missing coverage",
    tone: "warning",
    icon: IconAlertCircle,
  },
};

// The icon colour for each tone a suggestion can have.
const TONE_TEXT: Partial<Record<BadgeTone, string>> = {
  danger: "text-rose-600 dark:text-rose-400",
  warning: "text-amber-600 dark:text-amber-400",
};

/** How each activity entry reads. */
const ACTIVITY: Record<
  PolicyActivity["kind"],
  { label: string; icon: Icon; color: string }
> = {
  status_changed: {
    label: "Status changed",
    icon: IconCircleCheck,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  policy_added: {
    label: "Custom policy added",
    icon: IconFileText,
    color: "text-sky-600 dark:text-sky-400",
  },
  policy_updated: {
    label: "Policy updated",
    icon: IconFileText,
    color: "text-sky-600 dark:text-sky-400",
  },
  policy_removed: {
    label: "Custom policy removed",
    icon: IconFileText,
    color: "text-sky-600 dark:text-sky-400",
  },
  policy_restored: {
    label: "Policy restored",
    icon: IconRestore,
    color: "text-sky-600 dark:text-sky-400",
  },
  version_deleted: {
    label: "Version deleted",
    icon: IconTrash,
    color: "text-muted-foreground",
  },
};

type Tab = "flow" | "suggestions" | "history" | "activity";

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
 * The saved text with fixes put in at the places the backend gave, the
 * last place first so the earlier places still hold.
 */
function withFixes(saved: string, fixes: PolicySuggestionFix[]) {
  return [...fixes]
    .sort((a, b) => b.start_index - a.start_index)
    .reduce(
      (out, fix) =>
        out.slice(0, fix.start_index) + fix.insert + out.slice(fix.end_index),
      saved,
    );
}

/** Two fixes change the same words (two adds at the end never do). */
const overlaps = (a: PolicySuggestionFix, b: PolicySuggestionFix) =>
  a.start_index < b.end_index && b.start_index < a.end_index;

/**
 * One workflow's policy for the selected store, opened from its row on
 * Settings → Workflows. The header carries the workflow's on/off switch.
 * The merchant writes on the left (on top on smaller screens); beside it,
 * tabs: What the AI will do (the saved policy as numbered steps),
 * Suggestions (the live policy's check, run after every save), Versions
 * (earlier versions, each restorable or deletable) and Activity (who
 * changed what).
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
  const { CheckWorkflowPolicyPendingWorkflow, CheckWorkflowPolicyIsError } =
    useAppSelector(
      (state) => state.GetStoreSettingsReducer.CheckWorkflowPolicyState,
    );
  const checking = CheckWorkflowPolicyPendingWorkflow === code;
  const dismissingKey = useAppSelector(
    (state) =>
      state.GetStoreSettingsReducer.DismissPolicySuggestionState
        .DismissPolicySuggestionPendingKey,
  );
  // The workflow's row on Settings → Workflows: its AI, description and
  // on/off switch for the header.
  const workflows = useAppSelector(
    (state) =>
      state.GetStoreSettingsReducer.FetchStoreWorkflowsState
        .FetchStoreWorkflowsData,
  );
  const workflow = workflows.find((item) => item.code === code);
  const switching = useAppSelector(
    (state) =>
      state.GetStoreSettingsReducer.UpdateStoreWorkflowState
        .UpdateStoreWorkflowPendingCode !== null,
  );
  // Versions and activity come a page at a time from their own endpoints;
  // pages for another store or workflow are never shown.
  const owner = `${storeCode}:${code}`;
  const versionsState = useAppSelector(
    (state) => state.GetStoreSettingsReducer.FetchPolicyVersionsState,
  );
  const activityState = useAppSelector(
    (state) => state.GetStoreSettingsReducer.FetchWorkflowActivityState,
  );
  const versions = versionsState.FetchPolicyVersionsData;
  const activity = activityState.FetchWorkflowActivityData;
  const storeName = useAppSelector(
    (state) =>
      state.GetStoresReducer.GetStoresState.GetStoresListData.find(
        (store) => store.code === storeCode,
      )?.name,
  );

  // Null until the merchant types, so the box shows the saved text.
  const [draft, setDraft] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [tab, setTab] = useState<Tab>("flow");
  const [change, setChange] = useState<SwitchChange | null>(null);
  // The suggestion last shown in the policy, and the fixes put into the draft.
  const [selected, setSelected] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, PolicySuggestionFix>>({});

  const loadVersions = (page = 1) => {
    if (storeCode)
      dispatch(FetchPolicyVersions({ storeCode, workflow: code, page }));
  };
  const loadActivity = (page = 1) => {
    if (storeCode)
      dispatch(FetchWorkflowActivity({ storeCode, workflow: code, page }));
  };
  // A save, restore or delete adds a version (or takes one away) and an
  // activity entry: both lists start again from their newest page.
  const reloadLists = () => {
    loadVersions();
    loadActivity();
  };
  const load = () => {
    if (!storeCode) return;
    dispatch(FetchWorkflowPolicy({ storeCode, workflow: code }));
    reloadLists();
  };

  const check = () => {
    if (storeCode) dispatch(CheckWorkflowPolicy({ storeCode, workflow: code }));
  };

  // The policy, its versions and its activity load together.
  useEffect(() => {
    if (!storeCode) return;
    dispatch(FetchWorkflowPolicy({ storeCode, workflow: code }));
    dispatch(FetchPolicyVersions({ storeCode, workflow: code, page: 1 }));
    dispatch(FetchWorkflowActivity({ storeCode, workflow: code, page: 1 }));
    dispatch(FetchStoreWorkflows(storeCode));
  }, [dispatch, storeCode, code]);

  // Turns the workflow on or off once the merchant approves it in the dialog.
  const toggle = async ({ workflow: target, isEnabled }: SwitchChange) => {
    if (!storeCode) return;
    try {
      const saved = await dispatch(
        UpdateStoreWorkflow({ storeCode, code: target.code, isEnabled }),
      ).unwrap();
      const others = saved.also_changed.length
        ? ` with ${saved.also_changed.length} linked workflow${saved.also_changed.length > 1 ? "s" : ""}`
        : "";
      toast.success(
        `${target.name} turned ${isEnabled ? "on" : "off"}${others}`,
      );
      // The switch shows up in the activity.
      loadActivity();
    } catch {
      // The thunk already showed the error toast.
    } finally {
      setChange(null);
    }
  };

  const savedText = policy?.text ?? "";
  const text = draft ?? savedText;
  // The backend trims what it saves, so compare trimmed.
  const isDirty = policy !== null && text.trim() !== savedText;
  const tooLong = text.length > POLICY_MAX_LENGTH;
  // Fixes go in at the backend's places in the saved text, so they can't
  // once the merchant has edited it by hand.
  const handEdited =
    draft !== null && draft !== withFixes(savedText, Object.values(added));
  const busy = saving || restoringVersion !== null || deletingVersion !== null;

  // Closing the tab with unsaved edits asks the browser to confirm.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  // Back to the saved text, with no fixes pending.
  const discard = () => {
    setDraft(null);
    setErrors({});
    setAdded({});
  };

  const save = async () => {
    if (!storeCode) return;
    setErrors({});
    try {
      const saved = await dispatch(
        SaveWorkflowPolicy({ storeCode, workflow: code, text }),
      ).unwrap();
      setDraft(null);
      setAdded({});
      setSelected(null);
      setTab("flow");
      reloadLists();
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
      discard();
      setTab("flow");
      reloadLists();
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
      reloadLists();
      toast.success(`v${version} deleted`);
    } catch {
      // The thunk already showed the error toast.
    }
  };

  const dismiss = (key: string) => {
    if (storeCode)
      dispatch(DismissPolicySuggestion({ storeCode, workflow: code, key }));
  };

  // Select the card and bring its first marked line into view.
  const showInPolicy = (suggestion: PolicySuggestion) => {
    setSelected(suggestion.key);
    const first = suggestion.lines[0];
    if (!first) return;
    document
      .querySelector(`#workflow-policy-card [data-mark="${first.start_index}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Put the fixes chosen so far, and this one, into the saved text.
  const addFix = (suggestion: PolicySuggestion) => {
    const fix = suggestion.fix;
    if (!fix || handEdited) return;
    const next = { ...added, [suggestion.key]: fix };
    setDraft(withFixes(savedText, Object.values(next)));
    setAdded(next);
    setSelected(suggestion.key);
  };

  const takeBack = (suggestion: PolicySuggestion) => {
    if (handEdited) return;
    const next = { ...added };
    delete next[suggestion.key];
    setDraft(withFixes(savedText, Object.values(next)));
    setAdded(next);
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

  const items = policy?.suggestions.items ?? [];
  const marks = Object.values(
    items
      .flatMap((item) => item.lines)
      .reduce<Record<string, TextMark>>((out, line) => {
        const place = `${line.start_index}:${line.end_index}`;
        out[place] = {
          start: line.start_index,
          end: line.end_index,
          count: (out[place]?.count ?? 0) + 1,
        };
        return out;
      }, {}),
  );

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={requestBack}
          className="flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconArrowLeft className="size-4" />
          AI workflows
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <Typography variant="h4" as="h2">
                {policy?.name ?? workflow?.name ?? "Workflow policy"}
              </Typography>
              {workflow && (
                <Badge variant="secondary">{workflow.agent_label}</Badge>
              )}
              {policy && policy.policy_version > 0 && (
                <Badge variant="outline" className={BADGE_TONE_STYLES.accent}>
                  Custom policy
                </Badge>
              )}
            </div>
            <Typography variant="muted">
              {workflow?.description}
              {storeName && ` Applies to ${storeName} only.`}
            </Typography>
          </div>
          {workflow && (
            <WorkflowSwitch
              workflow={workflow}
              disabled={switching}
              onToggle={(isEnabled) => setChange({ workflow, isEnabled })}
            />
          )}
        </div>
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
          <section className="flex min-w-0 flex-col gap-4">
            <div
              id="workflow-policy-card"
              className="flex flex-col overflow-hidden rounded-xl border bg-card"
            >
              <div className="flex items-center justify-between gap-2 px-4 py-3">
                <Label htmlFor="workflow-policy-text" className="font-semibold">
                  Your policy
                </Label>
                {policy.policy_version > 0 && (
                  <Badge variant="secondary">
                    Version {policy.policy_version} · current
                  </Badge>
                )}
              </div>
              {/* Saved as Markdown, the same as the widget's greeting. The
                  card draws the frame, so the editor drops its own. On the
                  Suggestions tab the lines they are about are marked. */}
              <RichTextArea
                id="workflow-policy-text"
                value={text}
                onChange={setDraft}
                useMarkdown
                disabled={busy}
                placeholder="e.g. Orders can be cancelled within 12 hours. Orders above 5000 need my approval."
                minHeight="14rem"
                maxHeight="32rem"
                marks={tab === "suggestions" ? marks : undefined}
                marksSource={savedText}
                className="rounded-none border-0 border-t border-border focus-within:border-border focus-within:ring-0 [&_[role=toolbar]]:bg-muted/40 [&_[role=toolbar]]:px-3"
              />
              <div className="px-4 empty:hidden">
                <FieldError errors={errors} name="text" />
                <FieldError errors={errors} name="workflow" />
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-4 py-3">
                {/* Over the limit reads as an error before the server says so. */}
                <Typography
                  variant="caption"
                  className={cn(
                    "mr-auto",
                    tooLong && !saving && "text-destructive",
                    isDirty &&
                      !tooLong &&
                      !saving &&
                      "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {saving
                    ? "This can take up to 20 seconds."
                    : tooLong
                      ? `${text.length} / ${POLICY_MAX_LENGTH}: your policy can be up to ${POLICY_MAX_LENGTH} characters. Please shorten it.`
                      : isDirty
                        ? `Unsaved changes · ${text.length} / ${POLICY_MAX_LENGTH}`
                        : `${text.length} / ${POLICY_MAX_LENGTH} · plain language works best`}
                </Typography>
                {isDirty && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={discard}
                  >
                    Discard
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={requestSave}
                  // Only a changed text makes a new version.
                  disabled={busy || tooLong || !isDirty}
                >
                  {saving && <Spinner data-icon="inline-start" />}
                  {saving
                    ? "Converting and checking your policy…"
                    : `Save as version ${policy.next_version}`}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold">Writing tips</h3>
              <ul className="flex flex-col gap-2">
                {WRITING_TIPS.map((tip) => (
                  <li
                    key={tip}
                    className="flex items-start gap-2 text-xs leading-[18px] text-muted-foreground"
                  >
                    <IconCircle className="mt-0.5 size-3.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as Tab)}
            className="min-w-0 gap-0 overflow-hidden rounded-xl border bg-card"
          >
            <TabsList
              variant="line"
              className="w-full justify-start overflow-x-auto overflow-y-hidden border-b px-4"
            >
              <TabsTrigger value="flow" className={TAB_CLASS}>
                What the AI will do
              </TabsTrigger>
              <TabsTrigger value="suggestions" className={TAB_CLASS}>
                Suggestions
                {checking ? (
                  <Spinner className="size-3.5" />
                ) : (
                  items.length > 0 && (
                    <Badge
                      variant="outline"
                      className={cn(TAB_COUNT_CLASS, BADGE_TONE_STYLES.danger)}
                    >
                      {items.length}
                    </Badge>
                  )
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className={TAB_CLASS}>
                Versions
                {versions.owner === owner && (
                  <Badge variant="secondary" className={TAB_COUNT_CLASS}>
                    {versions.count}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="activity" className={TAB_CLASS}>
                Activity
                {activity.owner === owner && (
                  <Badge variant="secondary" className={TAB_COUNT_CLASS}>
                    {activity.count}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="flow" className="flex flex-col gap-3 p-5">
              <FlowNotes
                policy={policy}
                onSuggestions={() => setTab("suggestions")}
              />
              <WorkflowPolicyFlow
                flow={policy.flow}
                title={`How the AI handles ${policy.name.toLowerCase()} requests`}
              />
            </TabsContent>

            <TabsContent value="suggestions" className="p-5">
              <Suggestions
                policy={policy}
                checking={checking}
                failed={!checking && CheckWorkflowPolicyIsError !== null}
                selected={selected}
                added={added}
                handEdited={handEdited}
                dismissingKey={dismissingKey}
                disabled={busy}
                onCheck={check}
                onDismiss={dismiss}
                onShow={showInPolicy}
                onAdd={addFix}
                onUndo={takeBack}
              />
            </TabsContent>

            <TabsContent value="history" className="p-5">
              <History
                list={versions}
                shown={versions.owner === owner}
                loading={versionsState.FetchPolicyVersionsIsLoading}
                liveVersion={policy.policy_version}
                onMore={() => loadVersions(versions.page + 1)}
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

            <TabsContent value="activity" className="p-5">
              <ActivityLog
                list={activity}
                shown={activity.owner === owner}
                loading={activityState.FetchWorkflowActivityIsLoading}
                onMore={() => loadActivity(activity.page + 1)}
                workflows={workflows}
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

      <ConfirmSwitch
        change={change}
        workflows={workflows}
        saving={switching}
        onCancel={() => setChange(null)}
        onConfirm={toggle}
      />
    </div>
  );
}

/** The workflow's on/off switch; a locked workflow shows a lock instead. */
function WorkflowSwitch({
  workflow,
  disabled,
  onToggle,
}: {
  workflow: StoreWorkflow;
  disabled: boolean;
  onToggle: (isEnabled: boolean) => void;
}) {
  const on = workflow.is_enabled;
  const [title, detail] = !workflow.can_disable
    ? ["Always on", "Core to Store Signal, so it can't be turned off"]
    : on
      ? ["Workflow on", "The AI handles these requests"]
      : ["Workflow off", "The AI offers a support ticket instead"];

  return (
    // On a phone only the switch shows, beside the title.
    <div className="flex shrink-0 items-center gap-3 sm:rounded-xl sm:border sm:bg-card sm:px-4 sm:py-2.5">
      <div className="flex flex-col max-sm:hidden">
        <span className="text-[13px] font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </div>
      {workflow.can_disable ? (
        <Switch
          checked={on}
          disabled={disabled}
          onCheckedChange={onToggle}
          aria-label={`Turn ${workflow.name} ${on ? "off" : "on"}`}
        />
      ) : (
        <IconLock className="size-4 text-muted-foreground" aria-label={title} />
      )}
    </div>
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

/** One thing a suggestion points at: where it is, and what is there. */
function RefLine({
  where,
  text,
  after,
}: {
  where: string;
  text: string;
  after?: string;
}) {
  return (
    <p className="border-l-2 border-border pl-3 text-[13px] break-words">
      <span className="text-muted-foreground">{where}: </span>
      {text}
      {after && <span className="text-muted-foreground"> {after}</span>}
    </p>
  );
}

/**
 * The live policy's check, made when it was saved: what to look at, each
 * with a fix. A card can be dismissed (for everyone), shown in the policy
 * (its lines are marked while this tab is open), or its fix put into the
 * draft, to save like any edit; the next save checks again, so a fixed
 * one is gone.
 */
function Suggestions({
  policy,
  checking,
  failed,
  selected,
  added,
  handEdited,
  dismissingKey,
  disabled,
  onCheck,
  onDismiss,
  onShow,
  onAdd,
  onUndo,
}: {
  policy: Policy;
  checking: boolean;
  failed: boolean;
  selected: string | null;
  added: Record<string, PolicySuggestionFix>;
  /** The draft was edited by hand, so fixes can't go in. */
  handEdited: boolean;
  dismissingKey: string | null;
  disabled: boolean;
  onCheck: () => void;
  onDismiss: (key: string) => void;
  onShow: (suggestion: PolicySuggestion) => void;
  onAdd: (suggestion: PolicySuggestion) => void;
  onUndo: (suggestion: PolicySuggestion) => void;
}) {
  const { checked_at, items, dismissed } = policy.suggestions;

  if (!policy.text || policy.policy_version === 0)
    return (
      <Typography variant="muted">
        Save a policy of your own and it is checked here: rules that disagree,
        rules that never apply, and anything unclear.
      </Typography>
    );
  if (!checked_at)
    return checking ? (
      <LoadingState label="Checking your policy… this takes about 10 seconds." />
    ) : (
      <div className="flex flex-col items-start gap-2">
        <Typography variant="muted">
          {failed
            ? "Couldn't check your policy just now."
            : "This version couldn't be checked when it was saved."}
        </Typography>
        <Button variant="outline" size="sm" onClick={onCheck}>
          <IconRefresh data-icon="inline-start" />
          Check now
        </Button>
      </div>
    );

  // Per kind, for the counts in the header, named like the cards' badges.
  const counts = (
    Object.entries(SUGGESTION_KINDS) as [
      PolicySuggestionKind,
      (typeof SUGGESTION_KINDS)[PolicySuggestionKind],
    ][]
  ).map(([kind, look]) => {
    const value = items.filter((item) => item.type === kind).length;
    const plural = kind === "contradiction" && value > 1 ? "s" : "";
    return {
      label: `${look.label.toLowerCase()}${plural}`,
      tone: look.tone,
      value,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h3 className="text-sm font-semibold">
            {items.length
              ? `${items.length} thing${items.length > 1 ? "s" : ""} to check in your policy`
              : "Nothing to check"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {checking
              ? "Checking your policy…"
              : `Checked after every save · last checked ${formatDateTime(checked_at)}`}
            {dismissed > 0 && ` · ${dismissed} dismissed`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {counts
            .filter((entry) => entry.value > 0)
            .map((entry) => (
              <Badge
                key={entry.label}
                variant="outline"
                className={BADGE_TONE_STYLES[entry.tone]}
              >
                {entry.value} {entry.label}
              </Badge>
            ))}
          <Button
            variant="outline"
            size="sm"
            onClick={onCheck}
            disabled={checking}
          >
            {checking ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <IconRefresh data-icon="inline-start" />
            )}
            Check again
          </Button>
        </div>
      </div>

      {!items.length && (
        <Typography variant="muted">
          Your rules work together as written.
        </Typography>
      )}

      {items.map((item) => (
        <SuggestionCard
          key={item.key}
          suggestion={item}
          selected={selected === item.key}
          added={added[item.key]}
          dismissing={dismissingKey === item.key}
          disabled={
            disabled ||
            handEdited ||
            Object.entries(added).some(
              ([key, fix]) =>
                key !== item.key &&
                item.fix !== null &&
                overlaps(fix, item.fix),
            )
          }
          onDismiss={() => onDismiss(item.key)}
          onShow={() => onShow(item)}
          onAdd={() => onAdd(item)}
          onUndo={() => onUndo(item)}
        />
      ))}
    </div>
  );
}

/** One suggestion: what was found, where, the fix, and what to do with it. */
function SuggestionCard({
  suggestion,
  selected,
  added,
  dismissing,
  disabled,
  onDismiss,
  onShow,
  onAdd,
  onUndo,
}: {
  suggestion: PolicySuggestion;
  selected: boolean;
  added?: PolicySuggestionFix;
  dismissing: boolean;
  disabled: boolean;
  onDismiss: () => void;
  onShow: () => void;
  onAdd: () => void;
  onUndo: () => void;
}) {
  const kind = SUGGESTION_KINDS[suggestion.type];
  const { fix, quote } = suggestion;
  const KindIcon = kind.icon;

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border transition-colors",
        selected && "border-primary ring-1 ring-primary/30",
      )}
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <KindIcon className={cn("size-4 shrink-0", TONE_TEXT[kind.tone])} />
          <Badge variant="outline" className={BADGE_TONE_STYLES[kind.tone]}>
            {kind.label}
          </Badge>
          <h4 className="min-w-0 text-sm font-semibold break-words">
            {suggestion.name}
          </h4>
        </div>
        <p className="text-[13px] break-words text-muted-foreground">
          {suggestion.description}
        </p>
        {(quote ||
          suggestion.lines.length > 0 ||
          suggestion.steps.length > 0) && (
          <div className="flex flex-col gap-1.5">
            {quote && (
              <RefLine
                where={`Knowledge · ${quote.source}`}
                text={`“${quote.text}”`}
              />
            )}
            {suggestion.lines.map((line) => (
              <RefLine
                key={line.start_index}
                where={`Rule ${line.rule}`}
                text={line.text}
              />
            ))}
            {suggestion.steps.map((step) => (
              <RefLine
                key={step.step}
                where={`Step ${step.step}`}
                text={step.text}
                after={`→ ${OUTCOMES[step.effect].title}`}
              />
            ))}
          </div>
        )}
        {(suggestion.explanation || fix) && (
          <div className="flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2.5 text-[13px] text-primary">
            <IconBulb className="mt-0.5 size-4 shrink-0" />
            <p className="min-w-0 break-words">
              {suggestion.explanation}
              {fix && (
                <>
                  {suggestion.explanation && " "}
                  {fix.action === "replace"
                    ? `Change rule ${fix.rule} to`
                    : "Add"}
                  : “{fix.text}”
                </>
              )}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3">
        <p className="mr-auto text-xs text-muted-foreground">
          {suggestion.source === "knowledge"
            ? "Found by checking your policy against your Knowledge."
            : "Found by checking your policy against what the AI will do."}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          disabled={dismissing}
        >
          {dismissing && <Spinner data-icon="inline-start" />}
          Dismiss
        </Button>
        {suggestion.lines.length > 0 && (
          <Button variant="outline" size="sm" onClick={onShow}>
            <IconEye data-icon="inline-start" />
            Show in policy
          </Button>
        )}
        {added ? (
          <>
            <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <IconCheck className="size-3.5" />
              {added.action === "add" ? "Added as" : "Changed"} rule{" "}
              {added.rule} · save to apply
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={disabled}
            >
              Undo
            </Button>
          </>
        ) : (
          fix && (
            <Button size="sm" onClick={onAdd} disabled={disabled}>
              <IconWand data-icon="inline-start" />
              Add suggested fix
            </Button>
          )
        )}
      </div>
    </article>
  );
}

/**
 * The end of a paged list: loads the next page as it scrolls into view,
 * with a spinner while it comes.
 */
function ListEnd({
  hasMore,
  loading,
  onMore,
}: {
  hasMore: boolean;
  loading: boolean;
  onMore: () => void;
}) {
  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    onLoadMore: onMore,
    hasMore,
    loading,
  });
  if (!hasMore) return null;
  return (
    <div ref={sentinelRef} className="flex justify-center py-2">
      {loading && <Spinner />}
    </div>
  );
}

/** One side of a change: a version, on/off, or the default rules. */
function ActivityValue({ value }: { value: string }) {
  const [label, tone]: [string, BadgeTone] =
    value === "on"
      ? ["On", "success"]
      : value === "off"
        ? ["Off", "neutral"]
        : value === "default"
          ? ["Default rules", "neutral"]
          : [value, "accent"];
  return (
    <Badge variant="outline" className={BADGE_TONE_STYLES[tone]}>
      {label}
    </Badge>
  );
}

/** Who changed what and when, newest first, as a timeline. */
function ActivityLog({
  list,
  shown,
  loading,
  onMore,
  workflows,
}: {
  list: PagedList<PolicyActivity>;
  /** The list is this page's, not another workflow's still showing. */
  shown: boolean;
  loading: boolean;
  onMore: () => void;
  workflows: StoreWorkflow[];
}) {
  if (!shown) return <LoadingState label="Loading activity…" />;
  if (!list.items.length)
    return <Typography variant="muted">No changes yet.</Typography>;

  return (
    <ol className="flex flex-col">
      {list.items.map((entry, index) => {
        const { label, icon: EntryIcon, color } = ACTIVITY[entry.kind];
        const last = !list.hasMore && index === list.items.length - 1;
        const linked =
          entry.metadata.with &&
          (workflows.find((item) => item.code === entry.metadata.with)?.name ??
            entry.metadata.with);
        return (
          <li key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-card">
                <EntryIcon className={cn("size-4", color)} />
              </span>
              {!last && <span className="my-1 w-px flex-1 bg-border" />}
            </div>
            <div
              className={cn("flex min-w-0 flex-col gap-0.5", !last && "pb-4")}
            >
              <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                {label}
                {entry.from_value && <ActivityValue value={entry.from_value} />}
                {entry.to_value && (
                  <>
                    <IconArrowRight className="size-3 text-muted-foreground" />
                    <ActivityValue value={entry.to_value} />
                  </>
                )}
              </div>
              <Typography variant="caption" as="p">
                {entry.done_by || "System"} · {formatDateTime(entry.created_at)}
                {linked && ` · with ${linked}`}
              </Typography>
            </div>
          </li>
        );
      })}
      <ListEnd hasMore={list.hasMore} loading={loading} onMore={onMore} />
    </ol>
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
  list,
  shown,
  loading,
  liveVersion,
  onMore,
  restoringVersion,
  deletingVersion,
  disabled,
  onRestore,
  onDelete,
}: {
  list: PagedList<PolicyHistoryEntry>;
  /** The list is this page's, not another workflow's still showing. */
  shown: boolean;
  loading: boolean;
  liveVersion: number;
  onMore: () => void;
  restoringVersion: number | null;
  deletingVersion: number | null;
  disabled: boolean;
  onRestore: (version: number) => void;
  onDelete: (version: number) => void;
}) {
  if (!shown) return <LoadingState label="Loading versions…" />;
  if (!list.items.length)
    return <Typography variant="muted">No versions saved yet.</Typography>;

  return (
    <ol className="flex flex-col">
      {list.items.map((entry, index) => {
        const current = entry.version === liveVersion;
        const last = !list.hasMore && index === list.items.length - 1;
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
      <ListEnd hasMore={list.hasMore} loading={loading} onMore={onMore} />
    </ol>
  );
}
