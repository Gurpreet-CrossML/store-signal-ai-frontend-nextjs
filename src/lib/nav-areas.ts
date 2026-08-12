import {
  IconAdjustmentsSpark,
  IconBan,
  IconBook,
  IconBook2,
  IconBooks,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandMessenger,
  IconBrandMeta,
  IconBuildingSkyscraper,
  IconImageGeneration,
  IconMessageQuestion,
  IconPlugConnected,
  IconSend,
  IconSettings,
  IconShield,
  IconShieldLock,
  IconUserHexagon,
  IconUsers,
  IconVolume,
  type Icon,
} from "@tabler/icons-react";

/**
 * One screen inside a multi-screen area.
 *
 * `description` is the short line on the area's menu card; `pageDescription`
 * is the longer one under the screen's own heading, falling back to the
 * short one when a screen doesn't need the distinction.
 */
export type AreaSection = {
  href: string;
  title: string;
  description: string;
  pageDescription?: string;
  icon: Icon;
};

export type NavArea = {
  href: string;
  title: string;
  description: string;
  icon: Icon;
  sections: AreaSection[];
};

/**
 * THE source for every multi-screen area: its menu page, its sub-sidebar,
 * and each screen's own heading all read from here.
 *
 * Adding a screen is one entry plus a page file — previously its title,
 * description and icon had to be repeated in the landing array, the page
 * itself, and the sidebar nav, which is how they drifted apart.
 *
 * Help Desk is deliberately absent: its sub-nav are query-string filters on
 * one screen (`/helpdesk?filter=…`), not separate pages, so it stays hand
 * written in sidebar-navs.
 */
export const NAV_AREAS = {
  settings: {
    href: "/settings",
    title: "Settings",
    description: "Manage your company, team, and connected platforms.",
    icon: IconSettings,
    sections: [
      {
        href: "/settings/general",
        title: "General",
        description: "Company profile — name, logo, and identity details.",
        pageDescription:
          "Your company's contact details, logo, and address. The name and code are managed by the platform operator.",
        icon: IconBuildingSkyscraper,
      },
      {
        href: "/settings/staff-management",
        title: "Staff Management",
        description: "Invite teammates and control who has access.",
        pageDescription:
          "Manage your company's users. New staff receive an emailed temporary password.",
        icon: IconUsers,
      },
      {
        href: "/settings/store",
        title: "Store Settings",
        description: "Restrict which visitors can see the chat widget.",
        pageDescription: "Controls that apply to the store you have selected.",
        icon: IconShieldLock,
      },
      {
        href: "/settings/integrations",
        title: "Integrations",
        description: "Connect your store and third-party platforms.",
        icon: IconPlugConnected,
      },
      {
        href: "/settings/social-ai",
        title: "Social AI",
        description:
          "Facebook and Instagram accounts connected to Store Signal AI.",
        pageDescription:
          "Manage the Facebook and Instagram accounts connected to Store Signal AI.",
        icon: IconBrandMeta,
      },
    ],
  },

  brandVoice: {
    href: "/brand-voice",
    title: "Brand Voice",
    description:
      "Everything that shapes how the AI sounds and looks to your customers.",
    icon: IconVolume,
    sections: [
      {
        href: "/brand-voice/persona-identity",
        title: "Persona Identity",
        description: "Who the AI is — its name, role, and how it signs off.",
        pageDescription:
          "Who the AI is when it talks to your customers — its name, role, how it refers to itself, and how it signs off.",
        icon: IconUserHexagon,
      },
      {
        href: "/brand-voice/tone-and-style",
        title: "Tone & Style",
        description: "Presets, tone dials, and writing preferences.",
        pageDescription:
          "Define how your assistant communicates. Choose a preset and fine-tune the tone to match your brand and customers.",
        icon: IconAdjustmentsSpark,
      },
      {
        href: "/brand-voice/vocabulary",
        title: "Vocabulary",
        description:
          "Preferred words, banned words, signature phrases, and word swaps.",
        pageDescription:
          "The specific words that make your brand sound like you — phrases to lean into, words to avoid, and swaps the AI applies.",
        icon: IconBook2,
      },
      {
        href: "/brand-voice/never-say-rules",
        title: "Never-Say Rules",
        description:
          "Language guardrails — phrases, claims, and behaviors the AI avoids.",
        pageDescription:
          "Language guardrails — the phrases, claims, and behaviors the AI avoids in conversation.",
        icon: IconBan,
      },
      {
        href: "/brand-voice/customisation",
        title: "Widget Customisation",
        description:
          "Colors, logo, messages, and quick links for the chat widget.",
        pageDescription:
          "How the chat widget looks on your storefront — colors, branding, messages, and quick links.",
        icon: IconImageGeneration,
      },
    ],
  },

  knowledge: {
    href: "/knowledge",
    title: "Knowledge",
    description:
      "Everything the chatbot knows about your store — FAQs, policies, and documents.",
    icon: IconBooks,
    sections: [
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
    ],
  },

  socialAI: {
    href: "/social-ai",
    title: "Social AI",
    description:
      "AI-handled comments and messages across your connected social accounts.",
    icon: IconBrandMeta,
    sections: [
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
    ],
  },
} as const satisfies Record<string, NavArea>;

export type NavAreaKey = keyof typeof NAV_AREAS;

/**
 * The section at `href`, with the area it belongs to. Typed as the wide
 * AreaSection so callers see optional fields that `as const` narrows away
 * on the sections which don't set them.
 */
export function findAreaSection(
  href: string,
): { key: NavAreaKey; area: NavArea; section: AreaSection } | undefined {
  for (const [key, area] of Object.entries(NAV_AREAS)) {
    const section = area.sections.find((item) => item.href === href);
    if (section) return { key: key as NavAreaKey, area, section };
  }
  return undefined;
}

/**
 * `metadata` for a screen's page file, so the browser tab title and the
 * page heading can never disagree.
 */
export function areaSectionMetadata(href: string) {
  return { title: findAreaSection(href)?.section.title };
}
