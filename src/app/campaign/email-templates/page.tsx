import EmailTemplates from "@/clients/email-templates";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/campaign/email-templates";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <EmailTemplates />
    </AreaSubPage>
  );
}
