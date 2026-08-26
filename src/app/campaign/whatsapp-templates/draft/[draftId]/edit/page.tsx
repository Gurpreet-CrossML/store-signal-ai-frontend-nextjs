import WhatsAppTemplateCreate from "@/clients/whatsapp-template-create";

export const metadata = {
  title: "Edit Draft",
};

export default async function Page({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;

  // No AreaSubPage: same reasoning as the create/edit pages — this screen
  // has its own heading (with a back arrow to the templates list).
  return <WhatsAppTemplateCreate draftId={draftId} />;
}
