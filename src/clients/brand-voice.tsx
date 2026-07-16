"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BrandVoice() {
  const router = useRouter();

  useEffect(() => {
    // Redirect the base route to the first sub-page since Brand Voice is now a group
    router.replace("/brand-voice/persona-identity");
  }, [router]);

  return null;
}
