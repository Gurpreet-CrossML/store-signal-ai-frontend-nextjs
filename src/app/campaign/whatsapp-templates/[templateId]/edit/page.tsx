import { notFound } from "next/navigation";
import WhatsAppTemplateCreate from "@/clients/whatsapp-template-create";

export const metadata = {
  title: "Edit WhatsApp Template",
};

export default async function Page({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const parsed = Number(templateId);
  if (!Number.isInteger(parsed) || parsed <= 0) notFound();

  // No AreaSubPage: same reasoning as the create page — this screen has its
  // own heading (with a back arrow to the templates list).
  return <WhatsAppTemplateCreate templateId={templateId} />;
}
