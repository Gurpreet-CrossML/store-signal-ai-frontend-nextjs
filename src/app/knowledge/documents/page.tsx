import StoreDocumentTabContent from "@/components/custom/store-document-tab-content";
import SubPageShell from "@/components/custom/sub-page-shell";

export const metadata = {
  title: "Document Library",
};

export default function Page() {
  return (
    <SubPageShell
      backHref="/knowledge"
      backLabel="Back to knowledge"
      title="Document Library"
      description="Upload PDFs and DOCX files to enrich the chatbot's knowledge."
    >
      <StoreDocumentTabContent />
    </SubPageShell>
  );
}
