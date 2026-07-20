import { Suspense } from "react";
import { ConnectedView } from "@/components/custom/onboarding/connected-view";

export const metadata = {
  title: "Store connected",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ConnectedView />
    </Suspense>
  );
}
