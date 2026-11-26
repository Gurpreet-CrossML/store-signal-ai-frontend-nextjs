import EmailTemplateForm from "@/clients/email-template-form";

export const metadata = {
  title: "Edit Email Template",
};

export default async function Page({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  // proxy.ts lets only a valid token reach this page (lib/public-ids).
  return <EmailTemplateForm templateId={templateId} />;
}
