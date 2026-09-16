import type {
  WhatsAppTemplateComponent,
  WhatsAppTemplateParts,
} from "@/redux/api-slice/social-ai-slice";

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
