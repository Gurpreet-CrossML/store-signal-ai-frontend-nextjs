import { Suspense } from "react";

import HelpDesk from "@/clients/helpdesk";
import { decryptUrlId } from "@/lib/url-id";

/**
 * Rendered per request. What this screen shows is decided by the
 * query string (filter and ticket), and a statically prerendered page is
 * served from the client router cache for the path alone — so
 * changing only the query could leave the previous view on screen.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Help Desk",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { ticket } = await searchParams;
  return (
    <Suspense fallback={null}>
      <HelpDesk linkedTicketId={Number(decryptUrlId("Ticket", ticket))} />
    </Suspense>
  );
}
