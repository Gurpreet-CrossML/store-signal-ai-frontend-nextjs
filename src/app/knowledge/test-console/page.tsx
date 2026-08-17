import TestConsoleTabContent from "@/components/custom/knowledge/test-console-tab-content";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/knowledge/test-console";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <TestConsoleTabContent />
    </AreaSubPage>
  );
}
