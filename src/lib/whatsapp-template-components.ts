import type {
  WhatsAppTemplateComponent,
  WhatsAppTemplateParts,
} from "@/redux/api-slice/social-ai-slice";

/**
 * Rebuild Meta's `components` array from a template's stored parts.
 *
 * The backend keeps a template as header/body/footer/button fields rather
 * than Meta's blob, and assembles the array itself at submit time (see
 * campaign.helpers.build_components). The dashboard still thinks in
 * components — the phone mockup renders them, the icon resolver reads
 * them — so this is the mirror of that assembly on the client side. Keep
 * the two in step: a part added on one side has to be added on the other.
 *
 * A media header carries no renderable URL here (Meta's `header_handle` is
 * a write-only token, not a link); pass `file_url` to the mockup's
 * `headerMediaUrl` prop for the preview image.
 */
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
      header.text = parts.header_text;
      if (parts.header_text_example?.length) {
        header.example = { header_text: parts.header_text_example };
      }
    }
    components.push(header);
  }

  const body: WhatsAppTemplateComponent = {
    type: "BODY",
    text: parts.body_text,
  };
  if (parts.body_text_example?.length) {
    body.example =
      parts.parameter_format === "NAMED"
        ? { body_text_named_params: parts.body_text_example }
        : { body_text: [parts.body_text_example.map((p) => p.example)] };
  }
  components.push(body);

  if (parts.footer_text) {
    components.push({ type: "FOOTER", text: parts.footer_text });
  }

  if (parts.button_type) {
    components.push({
      type: "BUTTONS",
      buttons: [
        {
          type: parts.button_type,
          text: parts.button_text,
          ...(parts.button_url ? { url: parts.button_url } : {}),
          ...(parts.button_phone_number
            ? { phone_number: parts.button_phone_number }
            : {}),
        },
      ],
    });
  }

  return components;
}
