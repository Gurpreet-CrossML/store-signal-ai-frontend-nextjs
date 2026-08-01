import { Suspense } from "react";

import FbDms from "@/clients/facebook-dms";

export const metadata = {
  title: "Facebook DMs",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FbDms />
    </Suspense>
  );
}
