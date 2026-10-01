import { notFound } from "next/navigation";

import WorkflowDetail from "@/clients/workflow-detail";

export const metadata = {
  title: "Workflow",
};

export default async function Page({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  // Workflow ids are YAML file stems: lowercase letters, digits, underscores.
  if (!/^[a-z0-9_]+$/.test(workflowId)) notFound();

  // Full-bleed like Help Desk: the workflow list and canvas fill the
  // viewport, and the workflow's own header is the heading of this page.
  return <WorkflowDetail workflowId={workflowId} />;
}
