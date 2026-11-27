/**
 * Checks for the question and answer of a knowledge FAQ, so a bad one is
 * flagged as it is typed instead of after the server refuses it. The length
 * and letter limits mirror the backend (`KNOWLEDGE_FAQ_*` in
 * `knowledge/constants.py`); the "looks like real words" checks mirror
 * `looks_like_real_words` and `looks_like_real_answer` in `core/validators.py`
 * (limits in `core/constants.py`). Keep them in step.
 */

/** The question becomes the item's title, whose column holds 255 characters. */
export const FAQ_QUESTION_MAX_LENGTH = 255;
export const FAQ_QUESTION_MIN_LENGTH = 10;
/** Letters (any language) a question must hold, so numbers and symbols alone fail. */
export const FAQ_QUESTION_MIN_LETTERS = 3;
export const FAQ_ANSWER_MIN_LENGTH = 5;

const NOT_REAL_QUESTION =
  "Enter a real customer question, e.g. “Can I exchange a size after delivery?”";
const NOT_REAL_ANSWER =
  "Enter a real answer, written the way you'd reply to a customer.";

/** A question is at least this many words. */
const QUESTION_MIN_WORDS = 2;
/** An answer fails when this share (or more) of its words is gibberish. */
const ANSWER_MAX_BAD_SHARE = 0.5;

// Runs of keys on a keyboard row, in both directions. Five in a row ("asdfg")
// is mashing, while shorter runs turn up in real words ("property" has "erty").
const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const KEYBOARD_RUNS = KEYBOARD_ROWS.flatMap((row) => {
  const both = [row, [...row].reverse().join("")];
  return both.flatMap((line) =>
    Array.from({ length: line.length - 4 }, (_, i) => line.slice(i, i + 5)),
  );
});

/** Web addresses and emails, which are real in an answer but not words. */
const LINK_OR_EMAIL = /https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+/gi;

/** Letters stuck to a run of digits ("located12345"). Four or more letters and
 * five or more digits, so "iPhone15", "5000mAh", "2000sqft", "1500watt" and
 * "SKU12345" still pass. */
const GLUED_DIGITS = /\p{L}{4,}\d{5,}|\d{5,}\p{L}{4,}/u;

/** A text of at least this many words is checked for repeats. */
const REPEAT_MIN_WORDS = 6;
/** A question whose distinct words are this share (or less) of all its words
 * says the same thing over and over. */
const QUESTION_MAX_REPEATED_SHARE = 0.5;
/** A run of this many words repeated more than the max times is a pasted
 * phrase, in a question or an answer, but only when the repeats are at least
 * this share of all the words. A long answer that says "I would want to" a few
 * times is normal; one that is mostly the same phrase is not. */
const REPEATED_PHRASE_WORDS = 4;
const REPEATED_PHRASE_MAX_COUNT = 2;
const REPEATED_PHRASE_MIN_SHARE = 0.5;

/** True when the words keep repeating (`maxRepeatedShare` null skips the
 * distinct-words check, which is for questions only). */
function isRepetitive(words: string[], maxRepeatedShare: number | null) {
  const lower = words.map((word) => word.toLowerCase());
  if (
    maxRepeatedShare !== null &&
    lower.length >= REPEAT_MIN_WORDS &&
    new Set(lower).size / lower.length <= maxRepeatedShare
  )
    return true;
  const counts = new Map<string, number>();
  for (let i = 0; i + REPEATED_PHRASE_WORDS <= lower.length; i++) {
    const phrase = lower.slice(i, i + REPEATED_PHRASE_WORDS).join(" ");
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
  }
  return [...counts.values()].some(
    (count) =>
      count > REPEATED_PHRASE_MAX_COUNT &&
      (count * REPEATED_PHRASE_WORDS) / lower.length >=
        REPEATED_PHRASE_MIN_SHARE,
  );
}

/** The same symbol three or more times in a row ("????", "!!!"), or four or
 * more dots (three, an ellipsis, is fine). */
const REPEATED_PUNCTUATION = /([^\p{L}\p{N}_\s.])\1{2,}|\.{4,}/u;

const REPEATED_PUNCTUATION_MESSAGE =
  "Remove the repeated punctuation (for example '????' or '!!!').";

/** True for repeated punctuation outside links and emails, which hold runs
 * like "//" or "---" legitimately. */
function hasRepeatedPunctuation(text: string): boolean {
  return REPEATED_PUNCTUATION.test(text.replace(LINK_OR_EMAIL, " "));
}

/** An answer that is only a phone number ("+1 (555) 123-4567") is a real
 * answer too: digits with the usual separators, and at least this many digits. */
const PHONE_NUMBER = /^\+?[\d\s().-]+$/;
const PHONE_MIN_DIGITS = 7;

function isPhoneNumber(text: string): boolean {
  return (
    PHONE_NUMBER.test(text) &&
    (text.match(/\d/g)?.length ?? 0) >= PHONE_MIN_DIGITS
  );
}

/** The words of a text that contain a letter. */
function wordsOf(text: string): string[] {
  return text.split(/[^\p{L}\p{N}'’]+/u).filter((word) => /\p{L}/u.test(word));
}

/** True for a word that is key-mashing or filler rather than a word. */
function isGibberishWord(word: string): boolean {
  const lower = word.toLowerCase();
  // "aaaa", "hhhhh": the same letter four or more times in a row.
  if (/(\p{L})\1{3,}/iu.test(lower)) return true;
  if (KEYBOARD_RUNS.some((run) => lower.includes(run))) return true;
  // A plain English-looking word of four or more letters with no vowel
  // ("hjkl", "xzqw"). Acronyms (all or partly capitals, "PDFs") are left alone.
  return (
    word.length >= 4 && /^[A-Z]?[a-z]+$/.test(word) && !/[aeiouy]/.test(word)
  );
}

/** What is wrong with a question, or undefined when it is fine. */
export function faqQuestionProblem(value: string): string | undefined {
  const text = value.trim();
  if (!text) return "Question is required";
  if (text.length < FAQ_QUESTION_MIN_LENGTH)
    return `Question must be at least ${FAQ_QUESTION_MIN_LENGTH} characters`;
  if (text.length > FAQ_QUESTION_MAX_LENGTH)
    return `Question can't be longer than ${FAQ_QUESTION_MAX_LENGTH} characters`;
  const letters = [...text].filter((char) => /\p{L}/u.test(char)).length;
  if (letters < FAQ_QUESTION_MIN_LETTERS)
    return "Question must contain real words, not just numbers or symbols";
  if (new RegExp(LINK_OR_EMAIL.source, "i").test(text))
    return "A question can't contain a link or an email address.";
  if (hasRepeatedPunctuation(text)) return REPEATED_PUNCTUATION_MESSAGE;
  const words = wordsOf(text);
  if (
    words.length < QUESTION_MIN_WORDS ||
    words.some(isGibberishWord) ||
    GLUED_DIGITS.test(text) ||
    isRepetitive(words, QUESTION_MAX_REPEATED_SHARE)
  )
    return NOT_REAL_QUESTION;
  return undefined;
}

/** What is wrong with an answer, or undefined when it is fine. */
export function faqAnswerProblem(value: string): string | undefined {
  const text = value.trim();
  if (!text) return "Answer is required";
  if (text.length < FAQ_ANSWER_MIN_LENGTH)
    return `Answer must be at least ${FAQ_ANSWER_MIN_LENGTH} characters`;
  if (hasRepeatedPunctuation(text)) return REPEATED_PUNCTUATION_MESSAGE;
  // Answers are longer and hold links, emails and codes, so one odd word is
  // fine: it fails only when mostly gibberish, or has no words at all.
  const withoutLinks = text.replace(LINK_OR_EMAIL, " ");
  const words = wordsOf(withoutLinks);
  // Nothing but a link, an email or a phone number is still an answer.
  if (words.length === 0)
    return new RegExp(LINK_OR_EMAIL.source, "i").test(text) ||
      isPhoneNumber(text)
      ? undefined
      : NOT_REAL_ANSWER;
  const gibberish = words.filter(isGibberishWord).length;
  if (
    gibberish / words.length >= ANSWER_MAX_BAD_SHARE ||
    GLUED_DIGITS.test(withoutLinks) ||
    isRepetitive(words, null)
  )
    return NOT_REAL_ANSWER;
  return undefined;
}

/** How the server words its refusal of a question that appears more than once
 * in one request (`knowledge/serializers.py`). */
const DUPLICATE_IN_REQUEST = /entered more than once/i;

/** A question as the server compares it: trimmed and in lower case. */
export function normalizeQuestion(question: string): string {
  return question.trim().toLowerCase();
}

/**
 * Takes out the server's "entered more than once" errors that no longer hold.
 * That refusal belongs to a row only while another row still has the same
 * question, so once a twin is deleted or reworded, the error on the one left
 * has to go too. Every other error is left as it was.
 */
export function dropStaleDuplicateErrors<
  Errors extends Record<string, Record<string, unknown>>,
>(rows: { localId: string; question: string }[], errors: Errors): Errors {
  const copies = new Map<string, number>();
  rows.forEach(({ question }) => {
    const key = normalizeQuestion(question);
    if (key) copies.set(key, (copies.get(key) ?? 0) + 1);
  });

  const entries = Object.entries(errors);
  const kept = entries.filter(([localId, error]) => {
    if (!DUPLICATE_IN_REQUEST.test(String(error.question ?? ""))) return true;
    const row = rows.find((candidate) => candidate.localId === localId);
    return (
      Boolean(row) && (copies.get(normalizeQuestion(row!.question)) ?? 0) > 1
    );
  });
  return kept.length === entries.length
    ? errors
    : (Object.fromEntries(kept) as Errors);
}
