import ThreadDetail from "@/clients/thread-detail";

export const metadata = {
  title: "Thread Details",
};

export default async function Page({
  params,
}: {
  params: Promise<{ thread_id: string }>;
}) {
  const { thread_id } = await params;
  return <ThreadDetail threadId={thread_id} />;
}
