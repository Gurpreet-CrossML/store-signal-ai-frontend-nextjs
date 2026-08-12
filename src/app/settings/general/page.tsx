import CompanyProfileForm from "@/components/custom/company-profile-form";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/settings/general";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <CompanyProfileForm />
    </AreaSubPage>
  );
}
