import {
  IconAlertOctagon,
  IconBan,
  IconBriefcase,
  IconBulb,
  IconCircleX,
  IconDotsCircleHorizontal,
  IconFlame,
  IconHeartHandshake,
  IconHelpCircle,
  IconLifebuoy,
  IconMessageReport,
  IconMoodAngry,
  IconMoodConfuzed,
  IconMoodSmile,
  IconScale,
  IconShieldExclamation,
  IconShoppingCartPlus,
  IconUserSearch,
  type Icon,
} from "@tabler/icons-react";

import type { BadgeTone } from "@/lib/badge-tones";

/**
 * The comment-handling vocabulary: what a comment can be tagged as, what
 * the AI may do about it, and how far it goes on its own.
 *
 * Kept apart from the screen the way workflow-data.ts is — the screen
 * renders this, it does not own it. When the social-AI settings endpoints
 * land, the constants below become the response and only this file changes.
 *
 * ponytail: static defaults, held in memory. ceiling: nothing persists —
 * a refresh restores what is written here.
 * upgrade: fetch these instead of exporting them.
 */
/* -------------------------------------------------------------------- */
/* What the AI may do                                                    */
/* -------------------------------------------------------------------- */

export type ActionId = "reply" | "like" | "offer_dm" | "move_dm" | "hide";

/** `tone` colours a chip by where the action lands: public, private, removed. */
export const ACTIONS: {
  id: ActionId;
  label: string;
  description: string;
  tone: BadgeTone;
}[] = [
  {
    id: "reply",
    label: "Reply publicly",
    description: "Answers underneath the comment, where everyone can see it.",
    tone: "accent",
  },
  {
    id: "like",
    label: "Like the comment",
    description: "A small acknowledgement that costs nothing.",
    tone: "accent",
  },
  {
    id: "offer_dm",
    label: "Offer to DM",
    description: "Replies in public inviting them to continue privately.",
    tone: "info",
  },
  {
    id: "move_dm",
    label: "Move to DM",
    description:
      "Opens the conversation in the inbox, where order details belong.",
    tone: "info",
  },
  {
    id: "hide",
    label: "Hide the comment",
    description: "Stays visible to its author, hidden from everyone else.",
    tone: "danger",
  },
];

/* -------------------------------------------------------------------- */
/* How far the AI goes                                                   */
/* -------------------------------------------------------------------- */

export type Autonomy = "manual" | "draft" | "auto";

/** Least to most autonomous. The order is what the picker lists. */
export const AUTONOMY: { value: Autonomy; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "draft", label: "Draft Automatically" },
  { value: "auto", label: "Auto" },
];

export const SECTION_INFO =
  "Every comment is tagged as one of these as it arrives, and its card decides what the AI may do about it. " +
  "How far it goes is the dropdown: Manual — the AI takes none of the actions and the comment waits for a teammate. " +
  "Draft Automatically — it prepares them and a teammate approves before anything is public. " +
  "Auto — it takes them on its own. " +
  "A topic rule below overrides the card when the comment is about that subject.";

/* -------------------------------------------------------------------- */
/* What a comment is tagged as                                           */
/* -------------------------------------------------------------------- */

/**
 * The order intents are shown in, and the headings they sit under.
 *
 * Eighteen cards in one run is a wall; grouped, the list reads as a journey
 * — what someone asks before buying, what goes wrong after, who else turns
 * up, and what you would rather not see at all. It also puts the settings
 * a merchant tunes most often at the top.
 */
export const INTENT_GROUPS = [
  "Before They Buy",
  "Orders & Problems",
  "Business & People",
  "Reactions & Everything Else",
  "Unwanted",
] as const;

export type IntentRule = {
  id: string;
  label: string;
  /** The one line under the title — what the person is doing, not what they typed. */
  tagline: string;
  /** The ⓘ beside the title: the fuller description, with real examples. */
  info: string;
  /** Why this intent suits the level it defaults to. Not repeated in `info`. */
  hint: string;
  /** Which heading it sits under. Must be one of INTENT_GROUPS. */
  group: (typeof INTENT_GROUPS)[number];
  icon: Icon;
  actions: ActionId[];
  autonomy: Autonomy;
};

// Every entry here is an intent: the tagger picks exactly one per comment.
//
// Six of them are what it emits today — Question, Purchase Intent,
// Complaint, Feedback, Praise and Other (social_comment_analysis.intent).
// The rest are commissioned backend work, including Spam, Trolling, Abuse &
// Threat and Sarcastic, which move from the booleans they are today
// (is_spam / is_sarcastic) to intent values of their own. Until the
// classifier emits them, those cards configure an intent nothing is tagged
// with yet.
export const DEFAULT_INTENTS: IntentRule[] = [
  {
    id: "question",
    label: "Question",
    tagline: "Seeking information before deciding",
    info: "Someone wants information before they commit — “Is this BPA-free?”, “what sizes do you have?”",
    hint: "Answered from your knowledge base — read the drafts for a week before going Auto.",
    icon: IconHelpCircle,
    actions: ["reply", "offer_dm"],
    autonomy: "draft",
    group: "Before They Buy",
  },
  {
    id: "competitor_comparison",
    label: "Competitor Comparison",
    tagline: "Weighing you against another brand",
    info: "Names a rival and asks you to justify the difference — “Is this better than Nike?”, “how does it compare?”",
    hint: "Bottom-of-funnel, and the easiest reply on this screen to get wrong in public — worth reading each one before it goes out.",
    icon: IconScale,
    // Answer briefly in public, then take the detail private rather than
    // arguing with a rival brand underneath your own post.
    actions: ["reply", "offer_dm"],
    autonomy: "draft",
    group: "Before They Buy",
  },
  {
    id: "purchase_intent",
    label: "Purchase Intent",
    tagline: "Ready to buy, needs the last nudge",
    info: "A clear buying signal — “How do I buy this?”, “I want to order this”, “does it ship to me?”",
    hint: "A buying signal — the sooner it moves to DM, the more of them convert.",
    icon: IconShoppingCartPlus,
    actions: ["reply", "move_dm"],
    autonomy: "draft",
    group: "Before They Buy",
  },
  {
    id: "support_request",
    label: "Support Request",
    tagline: "Asking for help with something",
    info: "Asking you to resolve something, with no dissatisfaction yet — “Can someone help me with my order?”",
    hint: "Moving it to DM early is what stops it turning into a complaint.",
    icon: IconLifebuoy,
    actions: ["reply", "move_dm"],
    autonomy: "draft",
    group: "Orders & Problems",
  },
  {
    id: "withdrawal",
    label: "Cancellation / Withdrawal",
    tagline: "Wants to stop or reverse an order",
    info: "Cancelling an order, stopping a subscription, or undoing something — “I want to cancel my order.”",
    hint: "Time-critical, and it hands over to the Order Cancellation workflow — the order is confirmed in DM rather than from a public comment.",
    icon: IconCircleX,
    actions: ["move_dm"],
    autonomy: "draft",
    group: "Orders & Problems",
  },
  {
    id: "complaint",
    label: "Complaint",
    tagline: "Something went wrong, said in public",
    info: "Dissatisfaction stated where everyone can see it — a defect, a delay, or a bad experience.",
    hint: "Public and reputational — worth a teammate reading every reply.",
    icon: IconMoodAngry,
    actions: ["reply", "move_dm"],
    autonomy: "draft",
    group: "Orders & Problems",
  },
  {
    id: "fraud_report",
    label: "Fraud & Scam Report",
    tagline: "Flagging impersonation or a fake seller",
    info: "Reporting a fake account, counterfeit goods or a scam — “This account is pretending to be you.”",
    hint: "Rare, and the customer is doing you a favour — acknowledging in public reassures everyone else reading.",
    icon: IconShieldExclamation,
    actions: ["reply", "move_dm"],
    autonomy: "draft",
    group: "Orders & Problems",
  },
  {
    id: "business_enquiry",
    label: "Business Enquiry",
    tagline: "Wholesale, reseller or bulk interest",
    info: "B2B interest rather than a single purchase — “Do you offer bulk pricing?”, distributor and reseller asks.",
    hint: "Low volume, high value — worth a person rather than a template.",
    icon: IconBriefcase,
    actions: ["move_dm"],
    autonomy: "draft",
    group: "Business & People",
  },
  {
    id: "collaboration",
    label: "Collaboration Request",
    tagline: "A creator or partner reaching out",
    info: "An influencer, affiliate or brand proposing a partnership — “Can we collaborate?”",
    hint: "Marketing's call rather than support's, and plenty of stores leave these unanswered on purpose.",
    icon: IconHeartHandshake,
    actions: [],
    autonomy: "manual",
    group: "Business & People",
  },
  {
    id: "career",
    label: "Employment / Career",
    tagline: "Asking about jobs",
    info: "Hiring and recruitment questions — “Are you hiring?”, “how do I apply?”",
    hint: "Low volume and not time-sensitive — one link to your careers page clears it.",
    icon: IconUserSearch,
    actions: ["reply"],
    autonomy: "draft",
    group: "Business & People",
  },
  {
    id: "praise",
    label: "Positive / Praise",
    tagline: "A happy customer saying so",
    info: "Compliments, love and enthusiasm — “Love your products!”, “best purchase this year”.",
    hint: "Amplifies your brand publicly — safe to fully automate.",
    icon: IconMoodSmile,
    actions: ["reply", "like"],
    autonomy: "auto",
    group: "Reactions & Everything Else",
  },
  {
    id: "feedback",
    label: "Feedback",
    tagline: "An opinion or a suggestion",
    info: "A view on the product or brand, or an idea for improving it — “Please add more colours.”",
    hint: "Rarely urgent, but a reply is what makes people leave more of it.",
    icon: IconBulb,
    actions: ["like"],
    autonomy: "draft",
    group: "Reactions & Everything Else",
  },
  {
    id: "engagement",
    label: "Engagement",
    tagline: "Casual reaction, nothing to answer",
    info: "A reaction with no question in it — “🔥🔥”, “First!”, “Haha 😂”",
    hint: "The highest-volume bucket on Instagram. Liking and moving on keeps it out of the queue.",
    icon: IconFlame,
    actions: ["like"],
    autonomy: "auto",
    group: "Reactions & Everything Else",
  },
  {
    id: "other",
    label: "Other",
    tagline: "Nothing else fits",
    info: "Anything the tagger could not confidently place in an intent above.",
    hint: "Unknown by definition — leaving this Manual is the safe default.",
    icon: IconDotsCircleHorizontal,
    actions: [],
    autonomy: "manual",
    group: "Reactions & Everything Else",
  },
  {
    id: "spam",
    label: "Spam",
    tagline: "Bots, promos and link drops",
    info: "Unwanted, repetitive or promotional content — “Earn $5000 from home, DM me.”",
    hint: "Nothing here is a real customer — hiding it costs you nothing.",
    icon: IconBan,
    actions: ["hide"],
    autonomy: "auto",
    group: "Unwanted",
  },
  {
    id: "trolling",
    label: "Trolling",
    tagline: "Baiting for a reaction",
    info: "Deliberately provocative or in bad faith — “Your brand is a complete joke 😂”",
    hint: "A reply is the point of the exercise for them — hiding quietly beats engaging.",
    icon: IconMessageReport,
    actions: ["hide"],
    autonomy: "draft",
    group: "Unwanted",
  },
  {
    id: "abuse",
    label: "Abuse & Threat",
    tagline: "Harmful or dangerous content",
    info: "Threats, harassment, hate speech and anything unsafe.",
    hint: "A platform-policy matter rather than a support one — hidden on sight, then a person looks at it.",
    icon: IconAlertOctagon,
    actions: ["hide"],
    autonomy: "auto",
    group: "Unwanted",
  },
  {
    id: "sarcastic",
    label: "Sarcastic",
    tagline: "Means the opposite of what it says",
    info: "Communicating indirectly through irony — “Great job delivering 10 days late 🙄”",
    hint: "The case a reply is most likely to misread — a teammate should take it.",
    icon: IconMoodConfuzed,
    actions: [],
    autonomy: "manual",
    group: "Unwanted",
  },
];

/* -------------------------------------------------------------------- */
/* Topics                                                                */
/* -------------------------------------------------------------------- */

// The tagger attaches topics per comment; a settings screen has no comment
// to read them from, so the vocabulary is listed here for now.
export const TOPICS: { value: string; label: string }[] = [
  { value: "shipping", label: "Shipping & delivery" },
  { value: "sizing", label: "Sizing & fit" },
  { value: "price", label: "Price & offers" },
  { value: "stock", label: "Stock & availability" },
  { value: "quality", label: "Product quality" },
  { value: "ingredients", label: "Ingredients & materials" },
  { value: "returns", label: "Returns & refunds" },
  { value: "wholesale", label: "Wholesale & bulk" },
  { value: "collab", label: "Collabs & influencers" },
];

export type TopicRule = {
  id: string;
  topic: string;
  actions: ActionId[];
  autonomy: Autonomy;
};

export const DEFAULT_TOPIC_RULES: TopicRule[] = [
  {
    id: "topic-returns",
    topic: "returns",
    actions: ["move_dm"],
    autonomy: "draft",
  },
];

export const MANUAL_NOTE =
  "A teammate handles these. Switch to Draft Automatically or Auto to choose what the AI may do.";
