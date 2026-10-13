/**
 * The one list of languages the help desk offers, for a ticket's language
 * and for message translation alike. Mirrors the backend's LANGUAGE_CHOICES
 * (core/constants.py), which validates a ticket's language: add a language
 * there first, then here.
 */
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "tr", name: "Turkish" },
  { code: "nl", name: "Dutch" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
  { code: "bn", name: "Bengali" },
  { code: "ur", name: "Urdu" },
] as const;

export type TicketLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const DEFAULT_TICKET_LANGUAGE: TicketLanguage = "en";

/** The customer's overall tone when a ticket is raised. */
export const TICKET_SENTIMENTS = [
  { value: "positive", label: "Positive" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negative" },
] as const;

export type TicketSentiment = (typeof TICKET_SENTIMENTS)[number]["value"];

export const DEFAULT_TICKET_SENTIMENT: TicketSentiment = "neutral";
