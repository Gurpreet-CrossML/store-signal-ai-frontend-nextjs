import { Suspense } from "react";
import FbDms from "@/clients/fb-dms";

export const metadata = {
  title: "FB DMs | Social AI",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FbDms />
    </Suspense>
  );
}
