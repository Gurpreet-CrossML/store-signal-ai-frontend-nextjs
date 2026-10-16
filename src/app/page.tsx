import Dashboard from "@/clients/dashboard";
import { AccessGate } from "@/components/custom/access-gate";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function Page() {
  // Everyone lands on "/" after login; a role without team metrics is
  // moved on to the first screen it can open.
  return (
    <AccessGate permission="team_metrics" redirect>
      <Dashboard />
    </AccessGate>
  );
}
