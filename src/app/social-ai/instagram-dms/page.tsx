import { Suspense } from "react";
import IgDms from "@/clients/ig-dms";

export const metadata = {
  title: "IG DMs | Social AI",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <IgDms />
    </Suspense>
  );
}
