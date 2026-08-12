import StoreDocumentTabContent from "@/components/custom/store-document-tab-content";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/knowledge/documents";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <StoreDocumentTabContent />
    </AreaSubPage>
  );
}
