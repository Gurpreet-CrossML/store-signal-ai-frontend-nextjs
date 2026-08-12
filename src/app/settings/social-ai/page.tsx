import { Suspense } from "react";

import SettingsSocialAI from "@/clients/settings-social-ai";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/settings/social-ai";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      {/* SettingsSocialAI reads useSearchParams (?page=); static prerender
          requires a Suspense boundary around it. */}
      <Suspense fallback={null}>
        <SettingsSocialAI />
      </Suspense>
    </AreaSubPage>
  );
}
