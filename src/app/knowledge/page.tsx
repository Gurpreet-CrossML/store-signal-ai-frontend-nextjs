import { IconBook, IconMessageQuestion, IconShield } from "@tabler/icons-react";

import {
  SectionNav,
  type SectionNavItem,
} from "@/components/custom/section-nav";
import { Typography } from "@/components/ui/typography";

export const metadata = {
  title: "Knowledge",
};

const KNOWLEDGE_SECTIONS: SectionNavItem[] = [
  {
    href: "/knowledge/faqs",
    title: "Quick FAQs",
    description:
      "Question-and-answer pairs the chatbot can respond with instantly.",
    icon: IconMessageQuestion,
  },
  {
    href: "/knowledge/policies",
    title: "Company Policies",
    description:
      "Link your refund, shipping, and other policies so the AI can reference them.",
    icon: IconShield,
  },
  {
    href: "/knowledge/documents",
    title: "Document Library",
    description:
      "Upload PDFs and DOCX files to enrich the chatbot's knowledge.",
    icon: IconBook,
  },
];

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <Typography variant="h4" as="h2">
          Knowledge
        </Typography>
        <Typography variant="muted">
          Everything the chatbot knows about your store — FAQs, policies, and
          documents.
        </Typography>
      </div>
      <SectionNav items={KNOWLEDGE_SECTIONS} ariaLabel="Knowledge sections" />
    </div>
  );
}
