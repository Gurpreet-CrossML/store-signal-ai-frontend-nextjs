import Workflows from "@/clients/workflows";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { WORKFLOWS_HREF } from "@/lib/workflows";
import { areaSectionMetadata } from "@/lib/nav-areas";

export const metadata = areaSectionMetadata(WORKFLOWS_HREF);

export default function Page() {
  return (
    <AreaSubPage href={WORKFLOWS_HREF}>
      <Workflows />
    </AreaSubPage>
  );
}
