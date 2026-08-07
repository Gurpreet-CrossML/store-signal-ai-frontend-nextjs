import StoreFaqTabContent from "@/components/custom/store-faq-tab-content";
import SubPageShell from "@/components/custom/sub-page-shell";

export const metadata = {
  title: "Quick FAQs",
};

export default function Page() {
  return (
    <SubPageShell
      backHref="/knowledge"
      backLabel="Back to knowledge"
      title="Quick FAQs"
      description="Question-and-answer pairs the chatbot can respond with instantly."
    >
      <StoreFaqTabContent />
    </SubPageShell>
  );
}
