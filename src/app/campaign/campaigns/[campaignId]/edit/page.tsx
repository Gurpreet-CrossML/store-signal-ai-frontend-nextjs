import { notFound } from "next/navigation";
import CampaignCreate from "@/clients/campaign-create";

export const metadata = {
  title: "Edit Campaign",
};

export default async function Page({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const parsed = Number(campaignId);
  if (!Number.isInteger(parsed) || parsed <= 0) notFound();
  return <CampaignCreate campaignId={campaignId} />;
}
