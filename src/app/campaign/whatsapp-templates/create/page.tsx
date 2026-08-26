import WhatsAppTemplateCreate from "@/clients/whatsapp-template-create";

export const metadata = {
  title: "Create WhatsApp Template",
};

export default function Page() {
  // No AreaSubPage: this screen has its own heading (with a back arrow to
  // the templates list) rather than the shared area heading — same reason
  // crm/orders/[orderId] skips SubPageShell.
  return <WhatsAppTemplateCreate />;
}
