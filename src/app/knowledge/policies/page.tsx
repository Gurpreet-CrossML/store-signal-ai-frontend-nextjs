import StorePolicyTabContent from "@/components/custom/store-policy-tab-content";
import SubPageShell from "@/components/custom/sub-page-shell";

export const metadata = {
  title: "Company Policies",
};

export default function Page() {
  return (
    <SubPageShell
      backHref="/knowledge"
      backLabel="Back to knowledge"
      title="Company Policies"
      description="Link your refund, shipping, and other policies so the AI can reference them."
    >
      <StorePolicyTabContent />
    </SubPageShell>
  );
}
