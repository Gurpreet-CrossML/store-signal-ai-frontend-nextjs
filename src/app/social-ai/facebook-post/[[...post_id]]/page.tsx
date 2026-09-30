import { Suspense } from "react";

import SocialPostsFeed from "@/components/custom/social-ai/social-posts-feed";

/**
 * One optional catch-all segment serves both the bare list and a selected
 * item, so choosing an item changes only `params` and the client component
 * below keeps its state, sockets and scroll. Rendered per request because
 * the filters live in the query string.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Facebook Posts",
};

export default async function Page({
  params,
}: {
  params: Promise<{ post_id?: string[] }>;
}) {
  const { post_id } = await params;
  const id = post_id?.[0];
  return (
    <Suspense fallback={null}>
      <SocialPostsFeed channelType="facebook" postId={id} />
    </Suspense>
  );
}
