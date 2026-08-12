import StoreIntegrationsTabContent from "@/components/custom/store-integrations-tab-content";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/settings/integrations";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <StoreIntegrationsTabContent />
    </AreaSubPage>
  );
}
