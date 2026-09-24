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
  return <EmailTemplateForm templateId={Number(templateId)} />;
}
