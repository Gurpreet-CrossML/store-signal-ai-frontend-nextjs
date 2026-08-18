import {
  IconCloudUpload,
  IconLink,
  IconMessageQuestion,
  IconNotes,
  IconShieldCheck,
  IconShoppingBag,
  type Icon,
} from "@tabler/icons-react";

import type { BadgeTone } from "@/lib/badge-tones";
import type {
  AIScope,
  KnowledgeSource,
  KnowledgeStatus,
  KnowledgeType,
  PolicyType,
} from "@/redux/api-slice/knowledge-rag-slice";

/**
 * Single source of truth for how each knowledge type / status / AI scope is
 * labelled, described, iconed and coloured — consumed by the type picker,
 * the list rows, the filters, the badges and the forms, so none of them can
 * drift out of sync with each other.
 */

export const KNOWLEDGE_TYPE_META: Record<
  KnowledgeType,
  { label: string; description: string; icon: Icon; tone: BadgeTone }
> = {
  general: {
    label: "General Knowledge",
    description:
      "Store info, brand info, general product or company information.",
    icon: IconNotes,
    tone: "accent",
  },
  product: {
    label: "Product Knowledge",
    description: "Manuals, usage, care, warranty tied to one product.",
    icon: IconShoppingBag,
    tone: "info",
  },
  // category: {
  //   label: "Category Knowledge",
  //   description: "Buying guides and FAQs for a product category.",
  //   icon: IconCategory2,
  //   tone: "info",
  // },
  // faq: {
  //   label: "FAQ",
  //   description: "A question-and-answer pair the AI can respond with.",
  //   icon: IconMessageQuestion,
  //   tone: "success",
  // },
  // policy: {
  //   label: "Policy / URL",
  //   description: "A store policy page the AI can reference and re-sync.",
  //   icon: IconShieldCheck,
  //   tone: "warning",
  // },
  // document: {
  //   label: "Upload Document",
  //   description: "A PDF, DOCX, or TXT file uploaded directly.",
  //   icon: IconFileText,
  //   tone: "neutral",
  // },
  // google_drive: {
  //   label: "Google Drive",
  //   description: "A document linked from a Google Drive file URL.",
  //   icon: IconBrandGoogleDrive,
  //   tone: "neutral",
  // },
  // offer: {
  //   label: "Offer / Coupon",
  //   description: "Promotions, discount rules, and offer terms.",
  //   icon: IconDiscount,
  //   tone: "danger",
  // },
};

export const KNOWLEDGE_SOURCE_LABEL: Record<KnowledgeSource, string> = {
  text: "Text",
  file: "File Upload",
  url: "URL",
  google_drive: "Google Drive",
  product: "Product Catalog",
  category: "Category Catalog",
  faq: "FAQ",
  offer: "Offers",
};

export const KNOWLEDGE_SOURCE_ICON: Record<KnowledgeSource, Icon> = {
  text: IconNotes,
  file: IconCloudUpload,
  url: IconLink,
  google_drive: IconCloudUpload,
  product: IconNotes,
  category: IconNotes,
  faq: IconMessageQuestion,
  offer: IconMessageQuestion,
};

export const KNOWLEDGE_STATUS_META: Record<
  KnowledgeStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  active: { label: "Active", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  processing: { label: "Processing", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
  disabled: { label: "Disabled", variant: "outline" },
};

export const AI_SCOPE_META: Record<
  AIScope,
  { label: string; description: string; tone: BadgeTone }
> = {
  sales: {
    label: "Sales AI",
    description: "Pre-purchase — product, fit, offers, general questions.",
    tone: "accent",
  },
  support: {
    label: "Support AI",
    description: "Post-purchase — orders, returns, warranty, FAQs.",
    tone: "info",
  },
  social: {
    label: "Social AI",
    description: "Comments & DMs — brand, offers, quick facts.",
    tone: "warning",
  },
  internal: {
    label: "Internal Copilot",
    description: "Agent-facing only — never shown to a customer.",
    tone: "neutral",
  },
};

export const KNOWLEDGE_TYPE_OPTIONS = Object.entries(KNOWLEDGE_TYPE_META).map(
  ([value, meta]) => ({ value: value as KnowledgeType, ...meta }),
);

export const AI_SCOPE_OPTIONS = Object.entries(AI_SCOPE_META).map(
  ([value, meta]) => ({ value: value as AIScope, ...meta }),
);

export const POLICY_TYPE_OPTIONS: { value: PolicyType; label: string }[] = [
  { value: "privacy_policy", label: "Privacy Policy" },
  { value: "terms_conditions", label: "Terms & Conditions" },
  { value: "return_policy", label: "Return & Refund Policy" },
  { value: "shipping_policy", label: "Shipping Policy" },
  { value: "cookie_policy", label: "Cookie Policy" },
  { value: "contact_us", label: "Contact Us" },
  { value: "about_us", label: "About Us" },
  { value: "faq", label: "FAQs" },
  { value: "blog", label: "Blog" },
  { value: "careers", label: "Careers" },
  { value: "size_guide", label: "Size Guide" },
  { value: "generic_link", label: "Generic Link" },
  { value: "cancellation_policy", label: "Cancellation Policy" },
  { value: "terms_of_service", label: "Terms of Service" },
  { value: "refund_policy", label: "Refund Policy" },
  { value: "data_protection_policy", label: "Data Protection Policy" },
];

/**
 * "How do you want to add this knowledge?" step in the Add Knowledge wizard.
 * "policy" isn't a KnowledgeSource — picking it embeds the existing Company
 * Policies widget instead of creating a mock KnowledgeItem.
 */
export type AddKnowledgeSource = "file" | "faq" | "policy";

const ADD_KNOWLEDGE_SOURCE_META: Record<
  AddKnowledgeSource,
  { label: string; description: string; icon: Icon; tone: BadgeTone }
> = {
  file: {
    label: "Upload File",
    description: "Add a PDF, DOCX, or TXT document.",
    icon: IconCloudUpload,
    tone: "info",
  },
  faq: {
    label: "Customer FAQs",
    description: "Add one or more question and answer pairs.",
    icon: IconMessageQuestion,
    tone: "success",
  },
  policy: {
    label: "Policies",
    description: "Link your refund, shipping, and other policy pages.",
    icon: IconShieldCheck,
    tone: "warning",
  },
};

function sourceOption(value: AddKnowledgeSource) {
  return { value, ...ADD_KNOWLEDGE_SOURCE_META[value] };
}

export const GENERAL_SOURCE_OPTIONS = (["file", "faq", "policy"] as const).map(
  sourceOption,
);

export const PRODUCT_SOURCE_OPTIONS = (["file"] as const).map(sourceOption);
