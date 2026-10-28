import AIUsage from "@/clients/ai-usage";
import { areaSectionMetadata, findAreaSection } from "@/lib/nav-areas";

const HREF = "/settings/ai-usage";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  // The date filter sits on the heading line, so the screen draws its own
  // heading (as the dashboard does); the copy still comes from NAV_AREAS.
  const { section } = findAreaSection(HREF)!;
  return (
    <AIUsage
      title={section.title}
      description={section.pageDescription ?? section.description}
    />
  );
}
