import { Suspense } from "react";

import FbDms from "@/clients/facebook-dms";

export const metadata = {
  title: "Facebook Messages",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FbDms />
    </Suspense>
  );
}
