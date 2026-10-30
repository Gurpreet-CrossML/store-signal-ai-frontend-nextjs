import { notFound } from "next/navigation";

import WorkflowPolicy from "@/clients/workflow-policy";

export const metadata = {
  title: "Workflow policy",
};

// Workflow codes are lower-case words joined by underscores.
const CODE_PATTERN = /^[a-z0-9_]+$/;

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!CODE_PATTERN.test(code)) notFound();
  return <WorkflowPolicy code={code} />;
}
