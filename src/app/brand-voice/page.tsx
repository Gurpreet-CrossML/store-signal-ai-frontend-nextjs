import {
  IconAdjustmentsSpark,
  IconBan,
  IconBook2,
  IconImageGeneration,
  IconUserHexagon,
} from "@tabler/icons-react";

import {
  SectionNav,
  type SectionNavItem,
} from "@/components/custom/section-nav";
import { PageHeading } from "@/components/custom/page-heading";

export const metadata = {
  title: "Brand Voice",
};

const BRAND_VOICE_SECTIONS: SectionNavItem[] = [
  {
    href: "/brand-voice/persona-identity",
    title: "Persona Identity",
    description: "Who the AI is — its name, role, and how it signs off.",
    icon: IconUserHexagon,
  },
  {
    href: "/brand-voice/tone-and-style",
    title: "Tone & Style",
    description: "Presets, tone dials, and writing preferences.",
    icon: IconAdjustmentsSpark,
  },
  {
    href: "/brand-voice/vocabulary",
    title: "Vocabulary",
    description:
      "Preferred words, banned words, signature phrases, and word swaps.",
    icon: IconBook2,
  },
  {
    href: "/brand-voice/never-say-rules",
    title: "Never-Say Rules",
    description:
      "Language guardrails — phrases, claims, and behaviors the AI avoids.",
    icon: IconBan,
  },
  {
    href: "/brand-voice/customisation",
    title: "Widget Customisation",
    description: "Colors, logo, messages, and quick links for the chat widget.",
    icon: IconImageGeneration,
  },
];

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeading
        title="Brand Voice"
        description="Everything that shapes how the AI sounds and looks to your customers."
      />
      <SectionNav
        items={BRAND_VOICE_SECTIONS}
        ariaLabel="Brand voice sections"
      />
    </div>
  );
}
