import { Suspense } from "react";

import TicketingSettings from "@/clients/ticketing-settings";

export const metadata = {
  title: "HelpDesk Settings",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TicketingSettings />
    </Suspense>
  );
}
