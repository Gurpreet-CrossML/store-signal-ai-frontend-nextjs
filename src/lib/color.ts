/** Color helpers for the chatbot theme + live preview. */

type Rgb = { r: number; g: number; b: number };

/** Normalises any hex input ("6c5", "#6C5CE7", "6c5ce7") to "#rrggbb", or null if invalid. */
export function normalizeHex(input: string): string | null {
  if (!input) return null;
  let hex = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  return `#${hex.toLowerCase()}`;
}

function hexToRgb(hex: string): Rgb {
  const normalized = normalizeHex(hex) ?? "#000000";
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Blends `weight` (0–1) of `colorB` into `colorA`. mix(c, "#fff", 0.9) ≈ mostly white. */
export function mix(colorA: string, colorB: string, weight: number): string {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const w = Math.max(0, Math.min(1, weight));
  return rgbToHex({
    r: a.r * (1 - w) + b.r * w,
    g: a.g * (1 - w) + b.g * w,
    b: a.b * (1 - w) + b.b * w,
  });
}

/** Darkens a hex by `amount` (0–1) toward black. */
export function darken(hex: string, amount: number): string {
  return mix(hex, "#000000", amount);
}

/** Returns a readable text color (near-black or white) for a given background. */
export function getReadableText(background: string): string {
  const { r, g, b } = hexToRgb(background);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0f172a" : "#ffffff";
}
