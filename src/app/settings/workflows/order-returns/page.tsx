import WorkflowScreen from "@/clients/workflow-screen";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/settings/workflows/order-returns";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <WorkflowScreen workflowId="return-refund" />
    </AreaSubPage>
  );
}
