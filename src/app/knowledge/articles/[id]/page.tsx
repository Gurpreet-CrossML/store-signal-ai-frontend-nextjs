import { notFound } from "next/navigation";

import { ArticleEditorPage } from "@/components/custom/knowledge/article-editor-page";
import { decryptUrlId } from "@/lib/url-id";

export const metadata = {
  title: "Edit Article",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const articleId = decryptUrlId("KnowledgeItem", id);
  if (!articleId) notFound();
  return <ArticleEditorPage articleId={articleId} />;
}
