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
  // proxy.ts lets only a valid token reach this page (lib/public-ids).
  return <CampaignCreate campaignId={campaignId} />;
}
