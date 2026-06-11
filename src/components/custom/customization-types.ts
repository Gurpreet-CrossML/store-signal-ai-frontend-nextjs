/** Local UI shapes for the customization screen (mapped to the widget API on save). */

export type ActionButton = {
  id?: number;
  name: string;
  message: string;
};

export type QuickLinkItem = {
  id?: number;
  label: string;
  url: string;
  priority: number;
  active: boolean;
};

export type ColorKey = "primary" | "secondary" | "tertiary";
