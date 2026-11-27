import OrderDetail from "@/clients/order-detail";

export const metadata = {
  title: "Order",
};

export default async function Page({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  // proxy.ts lets only a valid token reach this page (lib/public-ids).

  // No SubPageShell: its heading would sit directly above the order's own
  // number, which is the real heading of this page.
  return (
    <div className="flex flex-col gap-6 p-4">
      <OrderDetail orderId={orderId} />
    </div>
  );
}
