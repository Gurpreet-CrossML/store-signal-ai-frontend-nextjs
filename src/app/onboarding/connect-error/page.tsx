import { Suspense } from "react";
import { ConnectErrorView } from "@/components/custom/onboarding/connect-error-view";

export const metadata = {
  title: "Connection failed",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ConnectErrorView />
    </Suspense>
  );
}
