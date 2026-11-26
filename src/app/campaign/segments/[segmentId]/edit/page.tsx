import SegmentCreate from "@/clients/segment-create";

export const metadata = {
  title: "Edit Segment",
};

export default async function Page({
  params,
}: {
  params: Promise<{ segmentId: string }>;
}) {
  const { segmentId } = await params;
  // proxy.ts lets only a valid token reach this page (lib/public-ids).
  return <SegmentCreate segmentId={segmentId} />;
}
