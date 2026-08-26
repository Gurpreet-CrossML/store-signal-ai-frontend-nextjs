import {
  IconFileText,
  IconLock,
  IconMessage2,
  IconPhoto,
  IconSpeakerphone,
  IconVideo,
  type Icon,
} from "@tabler/icons-react";

import type { WhatsAppTemplateComponent } from "@/redux/api-slice/social-ai-slice";

export function getComponent(
  components: WhatsAppTemplateComponent[] | undefined,
  type: WhatsAppTemplateComponent["type"],
) {
  return components?.find((component) => component.type === type);
}

/**
 * Substitute a BODY's `{{token}}`/`{{1}}`... placeholders with Meta's
 * on-file example values, so the preview reads like a real message instead
 * of raw template syntax. Checks NAMED params first — every template this
 * app creates uses NAMED format (see VARIABLE_MAP in the backend's
 * template_variables.py), so `text` holds literal `{{customer_name}}`-style
 * tokens, not positional `{{1}}` — falling back to positional keeps this
 * correct for a template created some other way. Falls back to the
 * placeholder itself wherever Meta has no example on file for it.
 */
export function previewBodyText(component?: WhatsAppTemplateComponent) {
  const text = component?.text ?? "";
  const namedParams = component?.example?.body_text_named_params;
  if (namedParams?.length) {
    const byName = Object.fromEntries(
      namedParams.map((param) => [param.param_name, param.example]),
    );
    return text.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, token) => {
      return byName[token] ?? match;
    });
  }
  const positional = component?.example?.body_text?.[0];
  if (!positional) return text;
  return text.replace(/{{\s*(\d+)\s*}}/g, (match, position) => {
    const value = positional[Number(position) - 1];
    return value ?? match;
  });
}

/**
 * A row/preview icon derived from what the template actually carries — the
 * header's media format when it has one, its category otherwise. Not a
 * decorative guess: every branch reads a real field on the template.
 *
 * Typed structurally (not as WhatsAppTemplate) so a catalog item
 * (WhatsAppTemplateLibraryItem) — which carries the same category/
 * components but isn't a real template yet — satisfies it too.
 */
export function resolveTemplateIcon(template: {
  category: string;
  components: WhatsAppTemplateComponent[];
}): Icon {
  if (template.category?.toUpperCase() === "AUTHENTICATION") return IconLock;

  const header = getComponent(template.components, "HEADER");
  switch (header?.format) {
    case "IMAGE":
      return IconPhoto;
    case "VIDEO":
      return IconVideo;
    case "DOCUMENT":
      return IconFileText;
  }

  if (template.category?.toUpperCase() === "MARKETING") return IconSpeakerphone;
  return IconMessage2;
}

/**
 * Same icon resolution as resolveTemplateIcon, already rendered. A plain
 * `const Icon = resolveTemplateIcon(x)` followed by `<Icon />` trips the
 * "components created during render" lint rule when it sits directly in a
 * component's own body (it doesn't when nested inside a non-component
 * function, e.g. getWhatsAppTemplateColumns' `cell`) — rendering here,
 * one lexical scope away from any component body, sidesteps that.
 */
export function renderTemplateIcon(
  template: { category: string; components: WhatsAppTemplateComponent[] },
  className?: string,
) {
  const Icon = resolveTemplateIcon(template);
  return <Icon className={className} />;
}
