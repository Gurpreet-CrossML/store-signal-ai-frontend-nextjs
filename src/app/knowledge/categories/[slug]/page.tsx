import { Suspense } from "react";

import KnowledgeLibraryTabContent from "@/components/custom/knowledge/knowledge-library-tab-content";

export const metadata = {
  title: "Knowledge",
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    // The list reads useSearchParams; prerender needs a Suspense boundary.
    <Suspense fallback={null}>
      <KnowledgeLibraryTabContent categorySlug={decodeURIComponent(slug)} />
    </Suspense>
  );
}
