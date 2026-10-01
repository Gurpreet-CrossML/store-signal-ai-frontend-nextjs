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
  return <SegmentCreate segmentId={segmentId} />;
}
