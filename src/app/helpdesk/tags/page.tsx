import Tags from "@/clients/tags";
import { Suspense } from "react";

export const metadata = {
  title: "Tags",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Tags />
    </Suspense>
  );
}
