import { Suspense } from "react";

import SettingsEmail from "@/clients/settings-email";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/settings/email";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <Suspense fallback={null}>
        <SettingsEmail />
      </Suspense>
    </AreaSubPage>
  );
}
