import StorePolicyTabContent from "@/components/custom/store-policy-tab-content";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/knowledge/policies";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <StorePolicyTabContent />
    </AreaSubPage>
  );
}
