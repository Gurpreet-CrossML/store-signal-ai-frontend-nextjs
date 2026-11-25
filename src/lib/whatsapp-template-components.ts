import type {
  WhatsAppTemplateComponent,
  WhatsAppTemplateParts,
} from "@/redux/api-slice/social-ai-slice";
import { renderPreviewText } from "@/lib/whatsapp-template-helper";

// Every `{{token}}` is swapped for its WHATSAPP_VARIABLE_CATEGORIES sample
// here, same as the create form's own live preview — so a saved template's
// preview (list/library "eye" dialogs) reads like a real message instead of
// raw `{{...}}` syntax. Never what gets submitted: the stored template keeps
// the literal token text, resolved for real recipients server-side at send
// time.
export function buildTemplateComponents(
  parts: WhatsAppTemplateParts,
): WhatsAppTemplateComponent[] {
  const components: WhatsAppTemplateComponent[] = [];

  if (parts.header_format && parts.header_format !== "NONE") {
    const header: WhatsAppTemplateComponent = {
      type: "HEADER",
      format: parts.header_format,
    };
    if (parts.header_format === "TEXT") {
      header.text = renderPreviewText(parts.header_text);
    }
    components.push(header);
  }

  components.push({
    type: "BODY",
    text: renderPreviewText(parts.body_text),
  });

  if (parts.footer_text) {
    components.push({
      type: "FOOTER",
      text: renderPreviewText(parts.footer_text),
    });
  }

  if (parts.button_type) {
    components.push({
      type: "BUTTONS",
      buttons: [
        {
          type: parts.button_type,
          text: renderPreviewText(parts.button_text),
          ...(parts.button_url
            ? { url: renderPreviewText(parts.button_url) }
            : {}),
          ...(parts.button_phone_number
            ? { phone_number: parts.button_phone_number }
            : {}),
        },
      ],
    });
  }

  return components;
}
