import { Suspense } from "react";
import { redirect, RedirectType } from "next/navigation";

export const metadata = {
  title: "Social AI",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <></>
    </Suspense>
  );
}
