import BrandVoiceToneStyleEditor from "@/clients/tone";
import { Suspense } from "react";

export const metadata = {
  title: "Tone and Style",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BrandVoiceToneStyleEditor />
    </Suspense>
  );
}
