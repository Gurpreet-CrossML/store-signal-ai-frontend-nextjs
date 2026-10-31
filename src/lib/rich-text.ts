/**
 * Helpers for HTML produced by the rich text editor (TipTap).
 *
 * The editor emits a small, predictable set of tags (p, h1-h6, ul/ol/li,
 * strong, em, br), so plain regexes are enough and — unlike DOMParser — are
 * safe to run during server rendering.
 */

const BLANK = String.raw`(?:\s|&nbsp;|<br\s*\/?>)`;
// A run of opening tags, nothing visible, then closing tags — "<p></p>" or
// "<ul><li><p><br></p></li></ul>".
const EMPTY = String.raw`(?:<[a-z0-9]+>)+${BLANK}*(?:<\/[a-z0-9]+>)+`;
const EMPTY_START = new RegExp(String.raw`^${EMPTY}`);
const EMPTY_END = new RegExp(String.raw`${EMPTY}$`);
const LEADING_BLANK = new RegExp(String.raw`^((?:<[a-z0-9]+>)*)${BLANK}+`);
const TRAILING_BLANK = new RegExp(String.raw`${BLANK}+((?:<\/[a-z0-9]+>)*)$`);

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/**
 * The visible text of editor HTML. Each paragraph, heading, list item and
 * `<br>` becomes one newline; tags are dropped and entities decoded. Leading
 * and trailing spaces and newlines are removed.
 */
export function richTextToPlainText(html: string): string {
  return (
    html
      .replace(/<br\s*\/?>/gi, "\n")
      // TipTap wraps list item text in <p>, which already ends the line.
      .replace(/(?<!<\/p>)<\/li>/gi, "\n")
      .replace(/<\/(?:p|h[1-6])>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m])
      .trim()
  );
}

/** Number of characters a user sees, counting spaces and line breaks. */
export function richTextLength(html: string): number {
  return Array.from(richTextToPlainText(html)).length;
}

/**
 * Editor HTML without leading or trailing blank space: empty paragraphs and
 * line breaks at either end are dropped, as are spaces at the edge of the
 * first and last line of text.
 */
export function trimRichText(html: string): string {
  let out = html.trim();
  let previous: string;
  do {
    previous = out;
    out = out
      // Only blocks at either end go; blank lines between paragraphs are the
      // user's own spacing.
      .replace(EMPTY_START, "")
      .replace(EMPTY_END, "")
      .replace(LEADING_BLANK, "$1")
      .replace(TRAILING_BLANK, "$1")
      .trim();
  } while (out !== previous);
  return richTextToPlainText(out) ? out : "";
}
