import { notFound } from "next/navigation";

import GuestDetail from "@/clients/guest-detail";

export const metadata = {
  title: "Guest",
};

export default async function Page({
  params,
}: {
  params: Promise<{ guestId: string }>;
}) {
  const { guestId } = await params;
  const id = Number(guestId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  // No SubPageShell: the guest's name is the real heading of this page.
  return (
    <div className="flex flex-col gap-6 p-4">
      <GuestDetail guestId={id} />
    </div>
  );
}
