import { Suspense } from "react";

import Support from "@/clients/support";

export const metadata = {
  title: "Support",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Support />
    </Suspense>
  );
}
