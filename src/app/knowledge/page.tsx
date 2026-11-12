import { Suspense } from "react";
import KnowledgeLibraryTabContent from "@/components/custom/knowledge/knowledge-library-tab-content";

export const metadata = {
  title: "Knowledge",
};

// Knowledge is a single screen, so the main sidebar's "Knowledge" entry opens
// the library directly — no area menu or sub-sidebar in between. The library
// renders its own heading, because its actions depend on what it has loaded.
export default function Page() {
  return (
    // The library reads useSearchParams; prerender needs a Suspense boundary.
    <Suspense fallback={null}>
      <KnowledgeLibraryTabContent />
    </Suspense>
  );
}
