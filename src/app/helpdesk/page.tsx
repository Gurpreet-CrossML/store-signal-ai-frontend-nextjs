import { Suspense } from "react";

import HelpDesk from "@/clients/helpdesk";

export const metadata = {
  title: "Help Desk",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HelpDesk />
    </Suspense>
  );
}
