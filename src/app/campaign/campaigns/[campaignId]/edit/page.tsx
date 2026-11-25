import { notFound } from "next/navigation";
import CampaignCreate from "@/clients/campaign-create";
import { decryptUrlId } from "@/lib/url-id";

export const metadata = {
  title: "Edit Campaign",
};

export default async function Page({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const parsed = Number(decryptUrlId("Campaign", campaignId));
  if (!Number.isInteger(parsed) || parsed <= 0) notFound();
  return (
    <CampaignCreate campaignId={String(parsed)} campaignUrlId={campaignId} />
  );
}
