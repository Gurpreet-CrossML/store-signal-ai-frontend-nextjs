import KnowledgeOverview from "@/components/custom/knowledge/knowledge-overview";

export const metadata = {
  title: "Knowledge",
};

// Knowledge is a single area, so the main sidebar's "Knowledge" entry opens
// it directly — no area menu or sub-sidebar in between. It shows the storage
// used and the knowledge categories; each category opens its own list under
// /knowledge/categories/[slug]. The screen renders its own heading, because
// its actions depend on what it has loaded.
export default function Page() {
  return <KnowledgeOverview />;
}
