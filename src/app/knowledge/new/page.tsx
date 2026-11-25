import { Suspense } from "react";

import { NewKnowledgePage } from "@/components/custom/knowledge/new-knowledge-page";

export const metadata = {
  title: "New Knowledge Item",
};

// No SubPageShell here: its heading would sit directly above this page's
// own "New Knowledge Item" heading — see NewKnowledgePage's own header.
export default function Page() {
  return (
    // The form reads ?source= (useSearchParams); prerender needs a Suspense boundary.
    <Suspense fallback={null}>
      <NewKnowledgePage />
    </Suspense>
  );
}
