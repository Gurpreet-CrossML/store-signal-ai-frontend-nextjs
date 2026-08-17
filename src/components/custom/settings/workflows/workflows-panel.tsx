"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type CSSProperties } from "react";

import { listRowClassName } from "@/components/custom/conversation-row";
import { CardTitle } from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import {
  getStaticWorkflow,
  getStaticWorkflows,
  updateStaticWorkflowGate,
  updateStaticWorkflowSection,
} from "@/lib/workflow-data";
import {
  isWorkflowId,
  type Workflow,
  type WorkflowGatePatch,
  type WorkflowId,
} from "@/lib/workflow-types";

import { WorkflowDetail } from "./workflow-detail";
import { RISK_TONE } from "./workflow-risk";

const WORKFLOWS = getStaticWorkflows();

/**
 * The Workflows settings screen: a fixed list of the 3 order workflows on
 * the left, the selected one's configuration on the right — same shell as
 * the Social AI post feed (its own SidebarProvider nested inside the app
 * shell), just with a static nav instead of a fetched, paginated one.
 *
 * The open workflow lives in the URL (?workflow=) so a link lands on the
 * same tab a teammate was looking at, exactly like the post feed's ?post=.
 */
export default function WorkflowsPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const workflowParam = searchParams?.get("workflow") ?? null;
  const initialId = isWorkflowId(workflowParam)
    ? workflowParam
    : WORKFLOWS[0].id;

  const [selectedId, setSelectedId] = useState<WorkflowId>(initialId);
  const [workflow, setWorkflow] = useState<Workflow>(
    () => getStaticWorkflow(initialId) ?? WORKFLOWS[0],
  );

  const handleSelect = (id: WorkflowId) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setWorkflow(getStaticWorkflow(id) ?? WORKFLOWS[0]);
    router.replace(`${pathname}?workflow=${id}`, { scroll: false });
  };

  const handleGateChange = (gateId: string, patch: WorkflowGatePatch) => {
    setWorkflow((prev) => updateStaticWorkflowGate(prev, gateId, patch));
  };

  const handleSectionToggle = (sectionId: string, enabled: boolean) => {
    setWorkflow((prev) =>
      updateStaticWorkflowSection(prev, sectionId, enabled),
    );
  };

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "280px" } as CSSProperties}
      className="h-svh min-h-0 w-full overflow-hidden"
    >
      <Sidebar
        collapsible="none"
        className="hidden border-r bg-background md:flex"
      >
        <SidebarHeader className="h-16 shrink-0 justify-center border-b px-4 py-0">
          <div className="flex w-full items-center justify-left">
            <CardTitle>Workflows</CardTitle>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-2 py-2">
            <SidebarGroupContent className="flex flex-col gap-0.5">
              {WORKFLOWS.map((item) => {
                const Icon = item.icon;
                const isSelected = item.id === selectedId;
                const tone = RISK_TONE[item.risk];

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`${listRowClassName(isSelected)} !items-center`}
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        BADGE_TONE_STYLES[tone],
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {item.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="min-h-0 overflow-hidden">
        <WorkflowDetail
          workflow={workflow}
          onGateChange={handleGateChange}
          onSectionToggle={handleSectionToggle}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
