import { ArticleEditorPage } from "@/components/custom/knowledge/article-editor-page";

export const metadata = {
  title: "Edit article",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArticleEditorPage articleId={id} />;
}
