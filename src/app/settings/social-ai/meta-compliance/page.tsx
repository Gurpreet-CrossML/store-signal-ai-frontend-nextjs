import SocialMetaCompliance from "@/clients/social-meta-compliance";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/settings/social-ai/meta-compliance";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <SocialMetaCompliance />
    </AreaSubPage>
  );
}
