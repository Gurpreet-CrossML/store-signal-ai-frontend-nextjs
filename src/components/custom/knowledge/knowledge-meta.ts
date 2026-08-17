import {
  IconBrandGoogleDrive,
  IconCategory2,
  IconDiscount,
  IconFileText,
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
    description: "Manuals, usage, care, FAQs, warranty tied to one product.",
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

export const KNOWLEDGE_STATUS_META: Record<
  KnowledgeStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  active: { label: "Active", variant: "default" },
  processing: { label: "Processing", variant: "secondary" },
  syncing: { label: "Syncing", variant: "secondary" },
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

export const POLICY_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "return", label: "Return" },
  { value: "refund", label: "Refund" },
  { value: "shipping", label: "Shipping" },
  { value: "cancellation", label: "Cancellation" },
  { value: "warranty", label: "Warranty" },
  { value: "privacy", label: "Privacy" },
  { value: "terms", label: "Terms & Conditions" },
  { value: "other", label: "Other" },
];
