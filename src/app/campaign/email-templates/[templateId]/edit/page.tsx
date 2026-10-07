import { notFound } from "next/navigation";
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
  const parsed = Number(templateId);
  if (!Number.isInteger(parsed) || parsed <= 0) notFound();
  return <EmailTemplateForm templateId={parsed} />;
}
