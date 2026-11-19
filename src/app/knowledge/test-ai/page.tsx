import { TestAiPage } from "@/components/custom/knowledge/test-ai/test-ai-page";

export const metadata = {
  title: "Test AI",
};

// Opened by the Test AI button on the Knowledge screen. The knowledge layout
// already gates it to the roles with knowledge access.
export default function Page() {
  return <TestAiPage />;
}
