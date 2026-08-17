import RetrievalMatchingTabContent from "@/components/custom/knowledge/retrieval-matching-tab-content";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/knowledge/retrieval";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <RetrievalMatchingTabContent />
    </AreaSubPage>
  );
}
