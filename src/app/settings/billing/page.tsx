import { AccessGate } from "@/components/custom/access-gate";
import Billing from "@/clients/billing";
import { areaSectionMetadata, findAreaSection } from "@/lib/nav-areas";

const HREF = "/settings/billing";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  const { section } = findAreaSection(HREF)!;
  // Owner-only, like the billing APIs.
  return (
    <AccessGate>
      <Billing
        title={section.title}
        description={section.pageDescription ?? section.description}
      />
    </AccessGate>
  );
}
