import { Suspense } from "react";

import InstagramPosts from "@/clients/instagram-post";

export const metadata = {
  title: "Instagram Posts",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <InstagramPosts />
    </Suspense>
  );
}
