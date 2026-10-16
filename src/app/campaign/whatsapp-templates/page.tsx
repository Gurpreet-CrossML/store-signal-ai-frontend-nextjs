import WhatsAppTemplates from "@/clients/whatsapp-templates";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/campaign/whatsapp-templates";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <WhatsAppTemplates />
    </AreaSubPage>
  );
}
