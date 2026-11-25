import { notFound } from "next/navigation";
import EmailTemplateForm from "@/clients/email-template-form";
import { decryptUrlId } from "@/lib/url-id";

export const metadata = {
  title: "Edit Email Template",
};

export default async function Page({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const parsed = Number(decryptUrlId("EmailTemplate", templateId));
  if (!Number.isInteger(parsed) || parsed <= 0) notFound();
  return <EmailTemplateForm templateId={parsed} />;
}
