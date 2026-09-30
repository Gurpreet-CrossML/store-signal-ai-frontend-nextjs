import { Suspense } from "react";

import HelpDesk from "@/clients/helpdesk";

/**
 * One optional catch-all segment serves both the bare list and a selected
 * item, so choosing an item changes only `params` and the client component
 * below keeps its state, sockets and scroll. Rendered per request because
 * the filters live in the query string.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Help Desk",
};

export default async function Page({
  params,
}: {
  params: Promise<{ ticket_id?: string[] }>;
}) {
  const { ticket_id } = await params;
  const id = ticket_id?.[0];
  return (
    <Suspense fallback={null}>
      <HelpDesk ticketId={id} />
    </Suspense>
  );
}
