import CustomerDetail from "@/clients/customer-detail";

export const metadata = {
  title: "Customer",
};

export default async function Page({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  // proxy.ts lets only a valid token reach this page (lib/public-ids).

  // No SubPageShell here: its heading would sit directly above the
  // customer's name, which is the real heading of this page.
  return (
    <div className="flex flex-col gap-6 p-4">
      <CustomerDetail customerId={customerId} />
    </div>
  );
}
