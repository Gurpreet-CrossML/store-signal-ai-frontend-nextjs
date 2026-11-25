import { notFound } from "next/navigation";

import ThreadDetail from "@/clients/thread-detail";
import { decryptUrlId } from "@/lib/url-id";

export const metadata = {
  title: "Thread Details",
};

export default async function Page({
  params,
}: {
  params: Promise<{ thread_id: string }>;
}) {
  const { thread_id } = await params;
  const threadId = decryptUrlId("Thread", thread_id);
  if (!threadId) notFound();
  return <ThreadDetail threadId={threadId} />;
}
