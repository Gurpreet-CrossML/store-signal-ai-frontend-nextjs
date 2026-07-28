import { Suspense } from "react";
import FbComments from "@/clients/fb-comments";

export const metadata = {
  title: "FB Comments | Social AI",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FbComments />
    </Suspense>
  );
}
