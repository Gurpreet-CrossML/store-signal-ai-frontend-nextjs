import { redirect } from "next/navigation";

/**
 * Workflows has no screen of its own — it is a heading over three.
 *
 * The sub-sidebar renders it as a collapsible trigger rather than a link,
 * so this path is only reached by typing it or by an older bookmark. Land
 * on the first workflow rather than a blank page.
 */
export default function Page() {
  redirect("/settings/workflows/order-cancellation");
}
