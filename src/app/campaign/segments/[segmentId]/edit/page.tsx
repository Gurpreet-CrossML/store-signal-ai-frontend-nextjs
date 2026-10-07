import { notFound } from "next/navigation";
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
  const parsed = Number(segmentId);
  if (!Number.isInteger(parsed) || parsed <= 0) notFound();
  return <SegmentCreate segmentId={segmentId} />;
}
