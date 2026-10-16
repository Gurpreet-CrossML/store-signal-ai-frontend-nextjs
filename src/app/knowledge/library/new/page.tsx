import { NewKnowledgePage } from "@/components/custom/knowledge/new-knowledge-page";

export const metadata = {
  title: "New Knowledge Item",
};

// No SubPageShell here: its heading would sit directly above this page's
// own "New Knowledge Item" heading, and this route isn't a knowledge
// sub-sidebar destination — see NewKnowledgePage's own header.
export default function Page() {
  return <NewKnowledgePage />;
}
