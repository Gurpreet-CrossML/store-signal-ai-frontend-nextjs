import { Suspense } from "react";

import IgDms from "@/clients/instagram-dms";

export const metadata = {
  title: "Instagram Messages",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <IgDms />
    </Suspense>
  );
}
