import NeverSayRules from "@/clients/never-say-rules";
import { Suspense } from "react";

export const metadata = {
  title: "Never-Say Rules",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <NeverSayRules />
    </Suspense>
  );
}
