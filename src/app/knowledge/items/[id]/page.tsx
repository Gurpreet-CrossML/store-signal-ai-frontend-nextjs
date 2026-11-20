import { Suspense } from "react";

import { KnowledgeItemPage } from "@/components/custom/knowledge/knowledge-item-page";

export const metadata = {
  title: "Knowledge",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    // The page reads ?edit= (useSearchParams), which needs a Suspense boundary.
    <Suspense fallback={null}>
      <KnowledgeItemPage itemId={id} />
    </Suspense>
  );
}
