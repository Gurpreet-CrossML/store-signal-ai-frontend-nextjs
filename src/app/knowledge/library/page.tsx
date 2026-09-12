import KnowledgeLibraryTabContent from "@/components/custom/knowledge/knowledge-library-tab-content";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/knowledge/library";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <KnowledgeLibraryTabContent />
    </AreaSubPage>
  );
}
