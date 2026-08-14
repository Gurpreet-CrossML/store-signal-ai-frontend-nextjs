import StoreFaqTabContent from "@/components/custom/store-faq-tab-content";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/knowledge/faqs";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <StoreFaqTabContent />
    </AreaSubPage>
  );
}
