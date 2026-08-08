import { Suspense } from "react";

import FacebookPosts from "@/clients/facebook-post";

export const metadata = {
  title: "Facebook Posts",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FacebookPosts />
    </Suspense>
  );
}
