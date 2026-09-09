import SocialGuardrails from "@/clients/social-guardrails";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/settings/social-ai/guardrails";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <SocialGuardrails />
    </AreaSubPage>
  );
}
