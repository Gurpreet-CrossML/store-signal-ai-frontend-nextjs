import {
  IconArrowsExchange,
  IconAward,
  IconBuildingStore,
  IconCloudUpload,
  IconCreditCard,
  IconFolder,
  IconGift,
  IconHeadset,
  IconInfoCircle,
  IconLink,
  IconLock,
  IconMessageQuestion,
  IconNotes,
  IconPackage,
  IconPercentage,
  IconReceiptRefund,
  IconRulerMeasure,
  IconShieldCheck,
  IconShirt,
  IconShoppingBag,
  IconTool,
  IconTruckDelivery,
  IconUserCircle,
  IconWash,
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
};

export const KNOWLEDGE_SOURCE_LABEL: Record<KnowledgeSource, string> = {
  article: "Article",
  file: "File Upload",
  url: "URL",
  google_drive: "Google Drive",
  product: "Product Catalog",
  category: "Category Catalog",
  faq: "FAQ",
  offer: "Offers",
};

export const FAQ_ANSWER_MAX_LENGTH = 10_000;

export const KNOWLEDGE_SOURCE_ICON: Record<KnowledgeSource, Icon> = {
  article: IconNotes,
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
  draft: { label: "Draft", variant: "outline" },
  published: { label: "Published", variant: "outline" },
  pending: { label: "Pending", variant: "secondary" },
  processing: { label: "Processing", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
};

/** Only drafts and published items can be edited; the rest are mid-pipeline or failed. */
export function isKnowledgeItemEditable(status: KnowledgeStatus) {
  return status === "draft" || status === "published";
}

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
 * "policy" picks a fixed policy type (privacy, shipping, etc.) and derives
 * its title from that type. "url" is the product-scoped equivalent: a plain
 * link with its own title, not tied to a policy type.
 */
export type AddKnowledgeSource = "file" | "faq" | "policy" | "url";

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
  url: {
    label: "Link / URL",
    description: "Add a page URL as this product's knowledge source.",
    icon: IconLink,
    tone: "info",
  },
};

function sourceOption(value: AddKnowledgeSource) {
  return { value, ...ADD_KNOWLEDGE_SOURCE_META[value] };
}

export const GENERAL_SOURCE_OPTIONS = (["file", "faq", "policy"] as const).map(
  sourceOption,
);

export const PRODUCT_SOURCE_OPTIONS = (["file", "faq", "url"] as const).map(
  sourceOption,
);

/** The icon of a knowledge category's tile or chip, with the classes that colour it. */
export type KnowledgeCategoryIcon = { icon: Icon; className: string };

// The icon and colour of each category, by its slug (lower case). A category
// added later (no entry here) gets the folder icon.
export const KNOWLEDGE_CATEGORY_ICONS: Record<string, KnowledgeCategoryIcon> = {
  "shipping-and-delivery": {
    icon: IconTruckDelivery,
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  "returns-refunds-and-exchanges": {
    icon: IconReceiptRefund,
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  "orders-and-payments": {
    icon: IconShoppingBag,
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  },
  "products-and-usage": {
    icon: IconShirt,
    className:
      "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
  },
  "safety-and-suitability": {
    icon: IconShieldCheck,
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
  "account-privacy-and-legal": {
    icon: IconLock,
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  },
  "store-and-brand": {
    icon: IconBuildingStore,
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
  "warranty-and-repairs": {
    icon: IconTool,
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  "customer-support-and-contact": {
    icon: IconHeadset,
    className:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  },
  "payments-and-billing": {
    icon: IconCreditCard,
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  },
  "product-care-and-maintenance": {
    icon: IconWash,
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  },
  "sizing-and-fit": {
    icon: IconRulerMeasure,
    className:
      "bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300",
  },
  "returns-and-refunds": {
    icon: IconReceiptRefund,
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  exchanges: {
    icon: IconArrowsExchange,
    className: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  },
  "order-management": {
    icon: IconPackage,
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  },
  "product-information": {
    icon: IconShirt,
    className:
      "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
  },
  "care-and-maintenance": {
    icon: IconWash,
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  },
  "offers-and-discounts": {
    icon: IconPercentage,
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
  "gift-cards-and-store-credit": {
    icon: IconGift,
    className:
      "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
  },
  "loyalty-and-rewards": {
    icon: IconAward,
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300",
  },
  "account-and-login": {
    icon: IconUserCircle,
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  },
  "about-us": {
    icon: IconInfoCircle,
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
  "contact-and-support": {
    icon: IconHeadset,
    className:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  },
};

const DEFAULT_CATEGORY_ICON: KnowledgeCategoryIcon = {
  icon: IconFolder,
  className: "bg-muted text-muted-foreground",
};

/** The icon and colour of a category, by its slug; the folder icon for one with no entry. */
export function getKnowledgeCategoryIcon(slug: string): KnowledgeCategoryIcon {
  return KNOWLEDGE_CATEGORY_ICONS[slug.toLowerCase()] ?? DEFAULT_CATEGORY_ICON;
}
