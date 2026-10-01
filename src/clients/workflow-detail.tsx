"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconHistory,
  IconRocket,
  IconRoute,
  IconTool,
} from "@tabler/icons-react";

import { InfoIcon } from "@/components/custom/info-icon";
import { LoadingState } from "@/components/custom/loading-state";
import { PublishDialog } from "@/components/custom/workflows/publish-dialog";
import { ToolsPanel } from "@/components/custom/workflows/tools-panel";
import { WorkflowListPanel } from "@/components/custom/workflows/workflow-list-panel";
import { useWorkflowToggle } from "@/components/custom/workflows/use-workflow-toggle";
import { VersionHistorySheet } from "@/components/custom/workflows/version-history-sheet";
import { WarningNote } from "@/components/custom/workflows/warning-note";
import {
  WorkflowCanvas,
  type EditingNode,
} from "@/components/custom/workflows/workflow-canvas";
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Switch } from "@/components/ui/switch";
import {
  describeChanges,
  resolveWorkflow,
  triggerOverrideFrom,
  withStepText,
  withStepTools,
  withTrigger,
  WORKFLOWS_HREF,
  workflowHref,
  type PromptOverride,
  type StepText,
  type WorkflowTrigger,
} from "@/lib/workflows";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import {
  DiscardWorkflowDraft,
  FetchWorkflow,
  FetchWorkflowTools,
  FetchWorkflows,
  PublishWorkflow,
  RestoreWorkflowVersion,
  SaveWorkflowDraft,
} from "@/redux/api-slice/workflows-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/**
 * One workflow as a canvas: its trigger, steps and branches, with the
 * on/off switch, history, discard and publish for the selected store.
 */
export default function WorkflowDetail({ workflowId }: { workflowId: string }) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const stores = useAppSelector(
    (state) => state.GetStoresReducer.GetStoresState.GetStoresListData,
  );
  const storeName =
    stores.find((store) => store.code === storeCode)?.name ?? "this store";

  const { FetchWorkflowData: detail, FetchWorkflowIsLoading } = useAppSelector(
    (state) => state.GetWorkflowsReducer.FetchWorkflowState,
  );
  const isSaving = useAppSelector(
    (state) => state.GetWorkflowsReducer.SaveWorkflowDraftState.IsLoading,
  );
  const isPublishing = useAppSelector(
    (state) => state.GetWorkflowsReducer.PublishWorkflowState.IsLoading,
  );
  const isRestoring = useAppSelector(
    (state) => state.GetWorkflowsReducer.RestoreWorkflowVersionState.IsLoading,
  );
  const { FetchWorkflowToolsData: toolCatalog, FetchWorkflowToolsIsLoading } =
    useAppSelector(
      (state) => state.GetWorkflowsReducer.FetchWorkflowToolsState,
    );
  const isDiscarding = useAppSelector(
    (state) => state.GetWorkflowsReducer.DiscardWorkflowDraftState.IsLoading,
  );
  const {
    FetchWorkflowsListData: workflows,
    FetchWorkflowsIsLoading: isListLoading,
  } = useAppSelector((state) => state.GetWorkflowsReducer.FetchWorkflowsState);

  const [editing, setEditing] = useState<EditingNode>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const {
    requestToggle,
    togglingId,
    dialog: toggleDialog,
  } = useWorkflowToggle();

  // The list beside the canvas; the workflow itself is fetched below.
  useEffect(() => {
    if (storeCode) dispatch(FetchWorkflows(storeCode));
  }, [dispatch, storeCode]);

  useEffect(() => {
    if (storeCode) {
      dispatch(FetchWorkflow({ storeCode, workflowId }));
    }
  }, [dispatch, storeCode, workflowId]);

  // A detail for another workflow can still be in the store while the new
  // one loads; showing it under the new name would mislead.
  const current = detail?.workflow_id === workflowId ? detail : null;

  const saveDraft = async (draft: PromptOverride) => {
    if (!storeCode || !current) return;
    const result = await dispatch(
      SaveWorkflowDraft({ storeCode, workflowId: current.workflow_id, draft }),
    );
    if (SaveWorkflowDraft.fulfilled.match(result)) setEditing(null);
  };

  const onSaveTrigger = (values: WorkflowTrigger) => {
    if (!current) return;
    saveDraft(
      withTrigger(
        current.draft,
        triggerOverrideFrom(current.defaults.trigger, values),
      ),
    );
  };

  const onSaveStep = (key: string, values: StepText) => {
    const defaults = current?.defaults.steps.find((step) => step.key === key);
    if (!current || !defaults) return;
    saveDraft(withStepText(current.draft, defaults, values));
  };

  // The catalog asks the store's tool server, so it is loaded only when the
  // Tools panel is first opened.
  const openTools = () => {
    setToolsOpen(true);
    if (storeCode && !toolCatalog && !FetchWorkflowToolsIsLoading) {
      dispatch(FetchWorkflowTools(storeCode));
    }
  };

  // A tool dragged into a step's text: give the step that tool if it
  // doesn't have it yet, so the AI can actually call it there.
  const onToolDrop = (key: string, tool: string) => {
    const step = resolved?.steps.find((s) => s.key === key);
    if (!step || step.tools.includes(tool)) return;
    onChangeStepTools(key, [...step.addedTools, tool]);
  };

  // Saved straight to the draft without closing an open step editor, so
  // adding a tool mid-edit doesn't lose the text being written.
  const onChangeStepTools = (key: string, tools: string[]) => {
    if (!storeCode || !current) return;
    dispatch(
      SaveWorkflowDraft({
        storeCode,
        workflowId: current.workflow_id,
        draft: withStepTools(current.draft, key, tools),
      }),
    );
  };

  const onPublish = async (note: string) => {
    if (!storeCode || !current) return;
    const result = await dispatch(
      PublishWorkflow({
        storeCode,
        workflowId: current.workflow_id,
        note,
      }),
    );
    if (PublishWorkflow.fulfilled.match(result)) setPublishOpen(false);
  };

  const onDiscard = async () => {
    if (!storeCode || !current) return;
    setEditing(null);
    await dispatch(
      DiscardWorkflowDraft({ storeCode, workflowId: current.workflow_id }),
    );
    setDiscardOpen(false);
  };

  const onRestore = async (version: number | "default") => {
    if (!storeCode || !current) return;
    setEditing(null);
    const result = await dispatch(
      RestoreWorkflowVersion({
        storeCode,
        workflowId: current.workflow_id,
        version,
      }),
    );
    if (RestoreWorkflowVersion.fulfilled.match(result)) setHistoryOpen(false);
  };

  // The switch only asks; the change is made once the dialog confirms it.
  const onToggle = (isEnabled: boolean) => {
    if (!current || !resolved) return;
    requestToggle({
      workflowId: current.workflow_id,
      name: resolved.trigger.name,
      isEnabled,
    });
  };

  const resolved = current
    ? resolveWorkflow(current.defaults, current.draft)
    : null;
  const changes = current
    ? describeChanges(current.defaults, current.draft, current.published)
    : [];

  return (
    <div className="flex h-svh min-h-0 overflow-hidden">
      {/* The Tools panel takes the room the list would; it comes back on close. */}
      {!toolsOpen && (
        <WorkflowListPanel
          workflows={workflows}
          activeId={workflowId}
          isLoading={isListLoading}
          onSelect={(id) => {
            setEditing(null);
            router.push(workflowHref(id));
          }}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {!current || !resolved ? (
          FetchWorkflowIsLoading || !storeCode ? (
            <LoadingState className="flex-1" label="Loading workflow…" />
          ) : (
            <Empty className="flex-1">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconRoute />
                </EmptyMedia>
                <EmptyTitle>Workflow not found</EmptyTitle>
                <EmptyDescription>
                  It may have been renamed or removed.
                </EmptyDescription>
              </EmptyHeader>
              <Button variant="outline" size="sm" asChild>
                <Link href={WORKFLOWS_HREF}>
                  <IconArrowLeft />
                  All workflows
                </Link>
              </Button>
            </Empty>
          )
        ) : (
          <>
            <header className="flex h-16 shrink-0 items-center gap-3 overflow-x-auto border-b px-4">
              <div className="flex min-w-0 flex-col">
                <h2 className="truncate text-base font-semibold">
                  {resolved.trigger.name}
                </h2>
                <span className="font-mono text-xs text-muted-foreground">
                  {current.workflow_id}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {current.is_enabled ? (
                  <Badge
                    variant="outline"
                    className={BADGE_TONE_STYLES.success}
                  >
                    Live
                    {current.published_version > 0
                      ? ` v${current.published_version}`
                      : " · default prompt"}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className={BADGE_TONE_STYLES.neutral}
                  >
                    Off
                  </Badge>
                )}
                {changes.length > 0 && (
                  <Badge
                    variant="outline"
                    className={BADGE_TONE_STYLES.warning}
                  >
                    Unpublished · {changes.length} change
                    {changes.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              <span className="flex-1" />

              <Button
                variant="outline"
                size="sm"
                aria-pressed={toolsOpen}
                className={cn(
                  toolsOpen && "border-primary/40 bg-primary/10 text-primary",
                )}
                onClick={toolsOpen ? () => setToolsOpen(false) : openTools}
              >
                <IconTool />
                Tools
              </Button>
              <label className="flex shrink-0 items-center gap-2 text-sm whitespace-nowrap text-muted-foreground">
                Workflow on
                {current.is_required && (
                  <InfoIcon text="The assistant needs this workflow, so it can't be turned off." />
                )}
                <Switch
                  checked={current.is_enabled}
                  disabled={current.is_required || togglingId !== null}
                  onCheckedChange={onToggle}
                  aria-label="Workflow on"
                />
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryOpen(true)}
              >
                <IconHistory />
                History
              </Button>
              {changes.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDiscardOpen(true)}
                >
                  Discard
                </Button>
              )}
              <Button
                size="sm"
                disabled={changes.length === 0}
                onClick={() => setPublishOpen(true)}
              >
                <IconRocket />
                Publish
              </Button>
            </header>

            {current.yaml_changed && (
              <WarningNote className="border-x-0 border-t-0 px-4 text-sm">
                The default prompt in {current.defaults.source_file} changed
                after this store last published. Parts you edited still use your
                text — check they fit the new default.
              </WarningNote>
            )}

            <WorkflowCanvas
              key={current.workflow_id}
              workflow={resolved}
              definition={current.defaults}
              editing={editing}
              isSaving={isSaving}
              onEdit={setEditing}
              onCancel={() => setEditing(null)}
              onSaveTrigger={onSaveTrigger}
              onSaveStep={onSaveStep}
              onToolDrop={onToolDrop}
            />

            {toggleDialog}

            <VersionHistorySheet
              open={historyOpen}
              onOpenChange={setHistoryOpen}
              versions={current.versions}
              publishedVersion={current.published_version}
              sourceFile={current.defaults.source_file}
              isRestoring={isRestoring}
              onRestore={onRestore}
            />

            <PublishDialog
              open={publishOpen}
              onOpenChange={setPublishOpen}
              workflowName={resolved.trigger.name}
              storeName={storeName}
              changes={changes}
              isPublishing={isPublishing}
              onPublish={onPublish}
            />

            <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Discard unpublished changes?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    The draft goes back to what live chats use now
                    {current.published_version > 0
                      ? ` (v${current.published_version})`
                      : ""}
                    . This can&apos;t be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep editing</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={isDiscarding}
                    onClick={(event) => {
                      event.preventDefault();
                      onDiscard();
                    }}
                  >
                    Discard
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
      {toolsOpen && current && resolved && (
        <ToolsPanel
          // Resets the chosen step when another workflow opens.
          key={`tools-${current.workflow_id}`}
          onClose={() => setToolsOpen(false)}
          steps={resolved.steps}
          catalog={toolCatalog}
          isLoading={FetchWorkflowToolsIsLoading}
          isSaving={isSaving}
          onChangeStepTools={onChangeStepTools}
        />
      )}
    </div>
  );
}
