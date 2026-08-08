"use client";

import { Badge } from "@/components/ui/badge";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import type { SocialCommentAnalysis } from "@/redux/api-slice/social-ai-slice";

/**
 * What each intent means for the agent, in colour: something to fix reads
 * red, something good reads green, a question is informational, and a buying
 * signal gets the brand accent so it stands out as an opportunity.
 */
export const INTENT_TONES: Record<string, BadgeTone> = {
  complaint: "danger",
  praise: "success",
  question: "info",
  purchase_intent: "accent",
  feedback: "neutral",
  other: "neutral",
};

const SENTIMENT_TONES: Record<string, BadgeTone> = {
  negative: "danger",
  positive: "success",
  neutral: "neutral",
};

function ToneBadge({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <Badge variant="outline" className={BADGE_TONE_STYLES[tone]}>
      {children}
    </Badge>
  );
}

/**
 * The AI tags on a comment. Intent leads because it's what decides whether
 * the agent needs to act; the flags below it are exceptions worth catching
 * at a glance, and topics stay neutral so they don't compete for attention.
 *
 * Null until the tagging pipeline has run — and it only ever tags incoming
 * customer comments, so the store's own replies never carry these.
 */
export function CommentTags({
  analysis,
}: {
  analysis: SocialCommentAnalysis | null;
}) {
  if (!analysis) return null;

  // Sentiment is only worth its own badge when the intent doesn't already
  // imply it — "Complaint" plus "Negative" is the same fact twice.
  const intentTone = INTENT_TONES[analysis.intent] ?? "neutral";
  const sentimentTone = SENTIMENT_TONES[analysis.sentiment] ?? "neutral";
  const showSentiment =
    analysis.sentiment !== "neutral" && sentimentTone !== intentTone;

  return (
    <>
      {analysis.intent_label && (
        <ToneBadge tone={intentTone}>{analysis.intent_label}</ToneBadge>
      )}
      {showSentiment && (
        <ToneBadge tone={sentimentTone}>{analysis.sentiment_label}</ToneBadge>
      )}
      {analysis.is_sarcastic && <ToneBadge tone="warning">Sarcastic</ToneBadge>}
      {analysis.is_critical && <ToneBadge tone="danger">Critical</ToneBadge>}
      {analysis.is_spam && <ToneBadge tone="neutral">Spam</ToneBadge>}
      {/* Topics carry the intent's colour so a comment reads as one tagged
          unit rather than a colourful badge and some grey ones. */}
      {analysis.topic_labels.map((label) => (
        <ToneBadge key={label} tone={intentTone}>
          {label}
        </ToneBadge>
      ))}
    </>
  );
}
