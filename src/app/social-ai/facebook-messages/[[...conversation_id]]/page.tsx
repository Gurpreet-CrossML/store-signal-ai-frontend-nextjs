import { Suspense } from "react";

import DmsInbox from "@/components/custom/social-ai/dms-inbox";

/**
 * One optional catch-all segment serves both the bare list and a selected
 * item, so choosing an item changes only `params` and the client component
 * below keeps its state, sockets and scroll. Rendered per request because
 * the filters live in the query string.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Facebook Messages",
};

export default async function Page({
  params,
}: {
  params: Promise<{ conversation_id?: string[] }>;
}) {
  const { conversation_id } = await params;
  const id = conversation_id?.[0];
  return (
    <Suspense fallback={null}>
      <DmsInbox channelType="facebook" conversationId={id} />
    </Suspense>
  );
}
