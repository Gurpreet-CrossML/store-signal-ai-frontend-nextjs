import { notFound } from "next/navigation";

import CampaignDetail from "@/clients/campaign-detail";
import { decryptUrlId } from "@/lib/url-id";

export const metadata = {
  title: "Campaign",
};

export default async function Page({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const parsed = Number(decryptUrlId("Campaign", campaignId));
  if (!Number.isInteger(parsed) || parsed <= 0) notFound();
  return <CampaignDetail campaignId={parsed} />;
}
