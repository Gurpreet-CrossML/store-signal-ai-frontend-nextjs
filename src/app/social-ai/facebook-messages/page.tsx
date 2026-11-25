import { Suspense } from "react";

import FacebookMessages from "@/clients/facebook-messages";

/**
 * Rendered per request. What this screen shows is decided by the
 * query string (chat), and a statically prerendered page is
 * served from the client router cache for the path alone — so
 * changing only the query could leave the previous view on screen.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Facebook Messages",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FacebookMessages />
    </Suspense>
  );
}
