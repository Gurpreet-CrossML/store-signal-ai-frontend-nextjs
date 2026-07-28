import { Suspense } from "react";
import IgComments from "@/clients/ig-comments";

export const metadata = {
  title: "IG Comments | Social AI",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <IgComments />
    </Suspense>
  );
}
