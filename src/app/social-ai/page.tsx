import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandMessenger,
  IconSend,
} from "@tabler/icons-react";

import {
  SectionNav,
  type SectionNavItem,
} from "@/components/custom/section-nav";
import { PageHeading } from "@/components/custom/page-heading";

export const metadata = {
  title: "Social AI",
};

const SOCIAL_AI_SECTIONS: SectionNavItem[] = [
  {
    href: "/social-ai/facebook-post",
    title: "Facebook Posts",
    description: "AI replies to comments on your Facebook posts.",
    icon: IconBrandFacebook,
  },
  {
    href: "/social-ai/facebook-messages",
    title: "Facebook Messages",
    description: "AI conversations in your Facebook page inbox.",
    icon: IconBrandMessenger,
  },
  {
    href: "/social-ai/instagram-post",
    title: "Instagram Posts",
    description: "AI replies to comments on your Instagram posts.",
    icon: IconBrandInstagram,
  },
  {
    href: "/social-ai/instagram-messages",
    title: "Instagram Messages",
    description: "AI conversations in your Instagram direct messages.",
    icon: IconSend,
  },
];

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeading
        title="Social AI"
        description="AI-handled comments and messages across your connected social accounts."
      />
      <SectionNav items={SOCIAL_AI_SECTIONS} ariaLabel="Social AI sections" />
    </div>
  );
}
