import { Suspense } from "react";

import Threads from "@/clients/threads";

export const metadata = {
  title: "Threads",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Threads />
    </Suspense>
  );
}
