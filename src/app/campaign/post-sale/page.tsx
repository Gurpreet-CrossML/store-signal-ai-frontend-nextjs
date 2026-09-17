import CampaignPostSale from "@/clients/campaign-post-sale";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/campaign/post-sale";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <CampaignPostSale />
    </AreaSubPage>
  );
}
