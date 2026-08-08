import { Suspense } from "react";

import InstagramMessages from "@/clients/instagram-messages";

export const metadata = {
  title: "Instagram Messages",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <InstagramMessages />
    </Suspense>
  );
}
