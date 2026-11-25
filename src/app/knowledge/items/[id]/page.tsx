import { Suspense } from "react";
import { notFound } from "next/navigation";

import { KnowledgeItemPage } from "@/components/custom/knowledge/knowledge-item-page";
import { decryptUrlId } from "@/lib/url-id";

export const metadata = {
  title: "Knowledge",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const itemId = decryptUrlId("KnowledgeItem", id);
  if (!itemId) notFound();
  return (
    // The page reads ?edit= (useSearchParams), which needs a Suspense boundary.
    <Suspense fallback={null}>
      <KnowledgeItemPage itemId={itemId} />
    </Suspense>
  );
}
