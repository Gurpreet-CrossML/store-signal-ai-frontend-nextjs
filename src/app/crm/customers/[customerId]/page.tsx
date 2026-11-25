import { notFound } from "next/navigation";

import CustomerDetail from "@/clients/customer-detail";
import { decryptUrlId } from "@/lib/url-id";

export const metadata = {
  title: "Customer",
};

export default async function Page({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const id = Number(decryptUrlId("Customer", customerId));
  if (!Number.isInteger(id) || id <= 0) notFound();

  // No SubPageShell here: its heading would sit directly above the
  // customer's name, which is the real heading of this page.
  return (
    <div className="flex flex-col gap-6 p-4">
      <CustomerDetail customerId={id} />
    </div>
  );
}
