import { Suspense } from "react";

import InstagramPosts from "@/clients/instagram-post";

/**
 * Rendered per request. What this screen shows is decided by the
 * query string (post), and a statically prerendered page is
 * served from the client router cache for the path alone — so
 * changing only the query could leave the previous view on screen.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Instagram Posts",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <InstagramPosts />
    </Suspense>
  );
}
