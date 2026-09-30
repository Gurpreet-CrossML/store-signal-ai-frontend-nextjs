import { Suspense } from "react";

import Support from "@/clients/support";

/**
 * One optional catch-all segment serves both the bare list and a selected
 * item, so choosing an item changes only `params` and the client component
 * below keeps its state, sockets and scroll. Rendered per request because
 * the filters live in the query string.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Support",
};

export default async function Page({
  params,
}: {
  params: Promise<{ thread_id?: string[] }>;
}) {
  const { thread_id } = await params;
  const id = thread_id?.[0];
  return (
    <Suspense fallback={null}>
      <Support threadId={id} />
    </Suspense>
  );
}
