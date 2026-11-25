import { Suspense } from "react";

import Threads from "@/clients/threads";
import { decryptUrlId } from "@/lib/url-id";

/**
 * Rendered per request. What this screen shows is decided by the
 * query string (page and filters), and a statically prerendered page is
 * served from the client router cache for the path alone — so
 * changing only the query could leave the previous view on screen.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Threads",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { before_thread_id } = await searchParams;
  return (
    <Suspense fallback={null}>
      <Threads
        beforeThreadId={decryptUrlId("Thread", before_thread_id) ?? undefined}
      />
    </Suspense>
  );
}
