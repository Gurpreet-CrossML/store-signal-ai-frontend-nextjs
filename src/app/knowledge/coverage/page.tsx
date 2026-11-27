import { KnowledgeCoveragePage } from "@/components/custom/knowledge/knowledge-coverage-page";

export const metadata = {
  title: "KB Coverage",
};

// Opened by "View All" on the KB Coverage card of the Knowledge screen. The
// knowledge layout already gates it to the roles with knowledge access.
export default function Page() {
  return <KnowledgeCoveragePage />;
}
