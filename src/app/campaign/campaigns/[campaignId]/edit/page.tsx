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
  return <CampaignCreate campaignId={campaignId} />;
}
