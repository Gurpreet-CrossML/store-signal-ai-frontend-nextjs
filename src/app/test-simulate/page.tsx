import { Suspense } from "react";

import TestSimulate from "@/clients/test-simulate";

export const metadata = {
  title: "Test & Simulate",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TestSimulate />
    </Suspense>
  );
}
