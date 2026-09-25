import { notFound } from "next/navigation";

import CampaignDetail from "@/clients/campaign-detail";

export const metadata = {
  title: "Campaign",
};

export default async function Page({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const parsed = Number(campaignId);
  if (!Number.isInteger(parsed) || parsed <= 0) notFound();
  return <CampaignDetail campaignId={parsed} />;
}
