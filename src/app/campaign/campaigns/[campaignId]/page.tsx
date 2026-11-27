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
  // proxy.ts lets only a valid token reach this page (lib/public-ids).
  return <CampaignDetail campaignId={campaignId} />;
}
